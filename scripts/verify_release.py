"""Independent pre-submission verification of the live SybilShield deployment.

Recomputes the four way source identity from scratch, reads the final contract
state through the RPC, and checks that the public evidence pages the validators
fetch are reachable. Prints a check table used for the submission review.
"""

import base64
import hashlib
import json
import os
import subprocess

import requests
from dotenv import load_dotenv
from genlayer_py import create_account, create_client
from genlayer_py.chains import studionet
from genlayer_py.consensus.consensus_main import decode_tx_data

load_dotenv(".env")
EVIDENCE = json.loads(open("evidence/studionet_deployment.json").read())
ADDRESS = EVIDENCE["contract_address"]
DEPLOY_TX = EVIDENCE["deploy_tx"]
EXPECTED_SHA = EVIDENCE["source_sha256"]

account = create_account(os.environ["GENLAYER_PRIVATE_KEY"])
client = create_client(studionet, account=account)

rows = []


def check(name, ok, detail):
    rows.append((name, "PASS" if ok else "FAIL", detail))


def sha(data):
    return hashlib.sha256(data).hexdigest()


repo_bytes = open("contracts/sybil_shield.py", "rb").read()
head_bytes = subprocess.check_output(["git", "show", "HEAD:contracts/sybil_shield.py"])
tag_bytes = subprocess.check_output(["git", "show", "studionet-v1:contracts/sybil_shield.py"])
check("repo file sha256", sha(repo_bytes) == EXPECTED_SHA, sha(repo_bytes)[:16])
check("git HEAD blob sha256", sha(head_bytes) == EXPECTED_SHA, sha(head_bytes)[:16])
check("tag studionet-v1 blob sha256", sha(tag_bytes) == EXPECTED_SHA, sha(tag_bytes)[:16])

tx = client.get_transaction(DEPLOY_TX)
raw_tx = tx["tx_data"]
raw_tx = raw_tx[2:] if raw_tx.startswith("0x") else raw_tx
payload = decode_tx_data(bytes.fromhex(raw_tx))
code = payload.get("code")
if isinstance(code, str) and code.startswith("0x"):
    deploy_bytes = bytes.fromhex(code[2:])
elif isinstance(code, str):
    deploy_bytes = code.encode("utf-8")
else:
    deploy_bytes = bytes(code or b"")
check("deploy tx calldata sha256", sha(deploy_bytes) == EXPECTED_SHA, sha(deploy_bytes)[:16])

raw = client.provider.make_request("gen_getContractCode", [ADDRESS])["result"]
if isinstance(raw, dict):
    raw = raw.get("code") or raw.get("result") or ""
try:
    candidate = base64.b64decode(raw, validate=True)
    onchain_bytes = candidate if b"Depends" in candidate[:400] else raw.encode("utf-8")
except Exception:
    onchain_bytes = raw.encode("utf-8") if isinstance(raw, str) else bytes(raw)
check("onchain gen_getContractCode sha256", sha(onchain_bytes) == EXPECTED_SHA, sha(onchain_bytes)[:16])

state = client.read_contract(ADDRESS, "get_vault_state", args=[])
inv = client.read_contract(ADDRESS, "check_vault_invariants", args=[])
recorded = EVIDENCE["vault_state"]
check(
    "live vault equals recorded vault",
    all(str(state[key]) == str(recorded[key]) for key in recorded),
    "custody %s vs expected %s" % (state["vault_custody_balance"], state["expected_liabilities"]),
)
check("live vault invariant ok", bool(inv["ok"]), "balanced %s conserved %s" % (inv["vault_balanced"], inv["supply_conserved"]))

for passport_id, role in ((1, "alpha"), (2, "beta"), (3, "gamma")):
    live = client.read_contract(ADDRESS, "get_passport", args=[passport_id])
    was = EVIDENCE["passports"][role]
    same = all(str(live[key]) == str(was[key]) for key in ("status", "trust_band", "authenticity_anchor", "stake_amount"))
    check("passport %s state matches evidence" % role, same, "%s %s anchor %s" % (live["handle"], live["status"], live["authenticity_anchor"]))

urls = sorted({client.read_contract(ADDRESS, "get_passport", args=[pid])["proof_url"] for pid in (1, 2, 3)})
fraud = client.read_contract(ADDRESS, "get_passport", args=[2])["fraud_evidence_url"]
if fraud:
    urls.append(fraud)
for url in urls:
    try:
        resp = requests.get(url, timeout=30)
        check("evidence reachable %s" % url.rsplit("/", 1)[-1], resp.status_code == 200, "%d bytes" % len(resp.text))
    except Exception as exc:  # noqa: BLE001 - reachability probe
        check("evidence reachable %s" % url, False, type(exc).__name__)

pages = requests.get("https://hoveiser.github.io/sybil-shield/", timeout=30)
check("github pages index", pages.status_code == 200, "asset %s" % json.dumps([a for a in pages.text.split('"') if "assets/index-" in a][:1]))
logo = requests.get("https://hoveiser.github.io/sybil-shield/logo.png", timeout=30)
check("github pages logo", logo.status_code == 200 and len(logo.content) > 1000, "%d bytes" % len(logo.content))

video = os.path.getsize("docs/demo-video-subtitled.mp4")
check("demo video present and under 15 MB", 0 < video < 15 * 1024 * 1024, "%d bytes" % video)

width, failures = 46, 0
print("| %-44s | %-4s | %s |" % ("check", "result", "detail"))
print("| --- | --- | --- |")
for name, status, detail in rows:
    failures += status == "FAIL"
    print("| %-44s | %-4s | %s |" % (name[: width - 2], status, detail))
print("")
print("checks %d, failures %d" % (len(rows), failures))
