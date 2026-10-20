#!/usr/bin/env python3
"""Deploy SybilShield to studionet and drive a full multi signer scenario.

The script is idempotent: a checkpoint records the deployed address and the
transactions that already reached FINALIZED, and every seeding step first reads
contract state before sending anything. Reads and receipt polling are retried
with exponential backoff because studionet rate limits aggressive clients.
Transaction submission itself is single shot so a retry can never duplicate a
state transition.

Evidence is written to evidence/studionet_deployment.json and docs/evidence.md.
"""

import hashlib
import json
import os
import base64
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from eth_utils import keccak
from genlayer_py import create_account, create_client
from genlayer_py.chains import studionet
from genlayer_py.consensus.consensus_main import decode_tx_data
from genlayer_py.types import TransactionStatus
from web3 import Web3

ROOT = Path(__file__).resolve().parents[1]
CONTRACT_PATH = ROOT / "contracts" / "sybil_shield.py"
EVIDENCE_DIR = ROOT / "evidence"
EVIDENCE_JSON = EVIDENCE_DIR / "studionet_deployment.json"
CHECKPOINT = EVIDENCE_DIR / "_checkpoint.json"
EVIDENCE_MD = ROOT / "docs" / "evidence.md"
FRONTEND_DEPLOY = ROOT / "frontend" / "src" / "deployments" / "studionet.json"

CHAIN_ID = 61999
ATTO = 10 ** 18
EXPLORER = "https://genlayer-explorer.vercel.app"

PROOF_BASE = "https://raw.githubusercontent.com/hoveiser/sybil-shield/main/proofs/"
ALPHA = {
    "role": "alpha",
    "handle": "nadia_koval",
    "category": "GITHUB",
    "fingerprint": "sha256:9f2c41d8be77a0c5e3d1a6b49f0c8e27d5a4b163",
    "proof_url": PROOF_BASE + "passport-alpha.md",
    "stake": 50,
}
BETA = {
    "role": "beta",
    "handle": "orion_labs",
    "category": "GITHUB",
    "fingerprint": "sha256:c7b1e904d3f58a2c6e0b9d47a1f3825c9e6d0b74",
    "proof_url": PROOF_BASE + "passport-beta.md",
    "stake": 50,
}
GAMMA = {
    "role": "gamma",
    "handle": "specter_ops",
    "category": "GITHUB",
    "fingerprint": "sha256:41ad9e0c7b25f836d1c4a90e6f78b2d5c390e1a8",
    "proof_url": PROOF_BASE + "operations-handbook.md",
    "stake": 50,
}
FRAUD_URL = PROOF_BASE + "fraud-evidence.md"

PASSPORTS = [ALPHA, BETA, GAMMA]


def log(message):
    print(message, flush=True)


_LAST_REQUEST = [0.0]
MIN_REQUEST_GAP = 2.6


def throttle():
    """Keep the script under the studionet limit of 30 requests per minute."""
    now = time.monotonic()
    wait = MIN_REQUEST_GAP - (now - _LAST_REQUEST[0])
    if wait > 0:
        time.sleep(wait)
    _LAST_REQUEST[0] = time.monotonic()


def is_rate_limit(error):
    text = str(error).lower()
    return "rate limit" in text or "too many requests" in text


def send_with_retry(label, fn, attempts=4):
    """A rate limited submission was rejected before broadcast, so retrying is safe."""
    for attempt in range(attempts):
        throttle()
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001 - only rate limits are retried
            if is_rate_limit(exc) and attempt < attempts - 1:
                delay = 22 * (attempt + 1)
                log("  rate limited on %s, waiting %ds" % (label, delay))
                time.sleep(delay)
                continue
            raise


def sha256_bytes(payload):
    return hashlib.sha256(payload).hexdigest()


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def with_retries(label, fn, attempts=6, base_delay=2.0):
    last_error = None
    for attempt in range(attempts):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001 - retried at the RPC boundary
            last_error = exc
            delay = min(base_delay * (2 ** attempt), 60.0)
            log("  retry %s in %.1fs (%s)" % (label, delay, type(exc).__name__))
            time.sleep(delay)
    raise RuntimeError("%s failed after %d attempts" % (label, attempts)) from last_error


def load_env():
    load_dotenv(ROOT / ".env")
    private_key = os.environ.get("GENLAYER_PRIVATE_KEY")
    if not private_key:
        raise SystemExit("GENLAYER_PRIVATE_KEY missing from .env, refusing to continue")
    return private_key


def derive_signer(main_key_hex, label):
    raw = main_key_hex[2:] if main_key_hex.startswith("0x") else main_key_hex
    seed = bytes.fromhex(raw)
    derived = keccak(seed + b"/sybilshield/demo-signer/" + label.encode("utf-8"))
    return create_account(derived)


def tx_hash_hex(value):
    if isinstance(value, (bytes, bytearray)):
        return "0x" + bytes(value).hex()
    if hasattr(value, "hex"):
        return value.hex()
    return str(value)


def read_view(client, address, function_name, args=None):
    throttle()
    return with_retries(
        "read " + function_name,
        lambda: client.read_contract(address, function_name, args=args or []),
    )


def summarize(receipt, step, expected, extra=None):
    leader = (receipt.get("consensus_data") or {}).get("leader_receipt")
    leader_entry = leader[0] if leader else {}
    decoded = receipt.get("tx_data_decoded") or {}
    execution = receipt.get("tx_execution_result_name") or leader_entry.get("execution_result")
    record = {
        "step": step,
        "tx_hash": tx_hash_hex(receipt.get("tx_id")),
        "status": receipt.get("status_name"),
        "execution_result": execution,
        "consensus_result": receipt.get("result_name"),
        "leader_execution": leader_entry.get("execution_result"),
        "expected": expected,
        "contract_address": decoded.get("contract_address") if isinstance(decoded, dict) else None,
    }
    if extra:
        record.update(extra)
    record["explorer"] = EXPLORER + "/transactions/" + str(record["tx_hash"])
    return record


def send_write(client, address, function_name, args, account, step, expected="SUCCESS"):
    log("  tx %s as %s" % (step, account.address))
    tx = send_with_retry(
        step, lambda: client.write_contract(address, function_name, account=account, args=args)
    )
    log("    submitted %s" % tx_hash_hex(tx))
    receipt = with_retries(
        "receipt " + step,
        lambda: client.wait_for_transaction_receipt(
            tx,
            status=TransactionStatus.FINALIZED,
            interval=12000,
            retries=150,
            full_transaction=True,
        ),
        attempts=3,
        base_delay=15.0,
    )
    record = summarize(receipt, step, expected)
    log("    %s %s %s" % (record["tx_hash"], record["execution_result"], record["consensus_result"]))
    return record


def observed_matches(record, expected):
    observed = record.get("leader_execution") or record.get("execution_result")
    if expected == "SUCCESS":
        return observed == "SUCCESS"
    if expected == "ROLLBACK":
        return observed == "ERROR"
    return True


def fund_native(client, sender, recipient, amount_wei):
    throttle()
    latest = client.w3.eth.get_block("latest")
    base_fee = latest.get("baseFeePerGas") or client.w3.to_wei(1, "gwei")
    priority = client.w3.to_wei(2, "gwei")
    transaction = {
        "from": sender.address,
        "to": Web3.to_checksum_address(recipient),
        "value": amount_wei,
        "nonce": client.w3.eth.get_transaction_count(sender.address),
        "chainId": CHAIN_ID,
        "maxFeePerGas": base_fee + priority,
        "maxPriorityFeePerGas": priority,
        "gas": 21000,
        "data": "0x",
    }
    signed = sender.sign_transaction(transaction)
    raw = signed.raw_transaction.hex()
    if not raw.startswith("0x"):
        raw = "0x" + raw
    tx_hash = client.provider.make_request("eth_sendRawTransaction", [raw])["result"]
    receipt = client.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
    return tx_hash_hex(tx_hash), int(receipt.status)


def find_passport_id(client, address, handle):
    count = int(read_view(client, address, "get_passport_count"))
    for passport_id in range(1, count + 1):
        record = read_view(client, address, "get_passport", [passport_id])
        if record["handle"] == handle:
            return passport_id
    return 0


def contract_dirty():
    try:
        status = subprocess.check_output(
            ["git", "status", "--porcelain", "contracts/sybil_shield.py"],
            cwd=str(ROOT),
            text=True,
        ).strip()
        return len(status) > 0
    except Exception:
        return True


def main():
    started = now_iso()
    private_key = load_env()
    if contract_dirty():
        raise SystemExit("contracts/sybil_shield.py has uncommitted changes, commit before deploying")

    source_bytes = CONTRACT_PATH.read_bytes()
    file_sha = sha256_bytes(source_bytes)
    git_bytes = subprocess.check_output(
        ["git", "show", "HEAD:contracts/sybil_shield.py"], cwd=str(ROOT)
    )
    git_sha = sha256_bytes(git_bytes)
    if file_sha != git_sha:
        raise SystemExit("working tree contract differs from HEAD, commit before deploying")

    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
    (ROOT / "docs").mkdir(parents=True, exist_ok=True)
    FRONTEND_DEPLOY.parent.mkdir(parents=True, exist_ok=True)

    checkpoint = {}
    if CHECKPOINT.exists():
        checkpoint = json.loads(CHECKPOINT.read_text())
    transactions = list(checkpoint.get("transactions") or [])
    guards = list(checkpoint.get("guards") or [])
    if not transactions and EVIDENCE_JSON.exists():
        # Recover a previous run that predates checkpoint transaction storage.
        prior = json.loads(EVIDENCE_JSON.read_text())
        seen = set()
        for item in prior.get("transactions") or []:
            key = (item.get("step"), item.get("tx_hash"))
            if key in seen:
                continue
            seen.add(key)
            transactions.append(item)
        if not guards:
            guards = list(prior.get("guard_rollbacks") or [])

    def persist():
        checkpoint["transactions"] = transactions
        checkpoint["guards"] = guards
        CHECKPOINT.write_text(json.dumps(checkpoint, indent=2) + "\n")

    def record_tx(record):
        transactions.append(record)
        persist()

    deployer = create_account(private_key)
    client = create_client(studionet, account=deployer)
    log("deployer %s on chain %s" % (deployer.address, client.chain.id))

    burners = {}
    for label, data in (("beta", BETA), ("gamma", GAMMA), ("challenger", {"role": "challenger"})):
        burners[data["role"]] = derive_signer(private_key, label)
    accounts = {"alpha": deployer}
    accounts.update(burners)

    deploy_source_code = None
    deploy_tx_data = None
    reused = bool(
        checkpoint.get("contract_address")
        and checkpoint.get("source_sha256") == file_sha
        and checkpoint.get("deploy_status") == "FINALIZED"
    )

    if reused:
        contract_address = checkpoint["contract_address"]
        deploy_tx = checkpoint.get("deploy_tx")
        log("reusing deployed contract %s" % contract_address)
        receipt = with_retries("deploy readback", lambda: (throttle(), client.get_transaction(deploy_tx))[1])
        deploy_record = summarize(receipt, "deploy", "SUCCESS")
        if not any(tx["step"] == "deploy" and tx["tx_hash"] == deploy_tx for tx in transactions):
            record_tx(deploy_record)
        decoded = receipt.get("tx_data_decoded") or {}
        deploy_source_code = decoded.get("code")
        deploy_tx_data = receipt.get("tx_data")
        checkpoint["deploy_execution"] = deploy_record["execution_result"]
        checkpoint["deploy_consensus"] = deploy_record["consensus_result"]
        persist()
    else:
        log("deploying contract")
        tx = send_with_retry(
            "deploy", lambda: client.deploy_contract(source_bytes.decode("utf-8"), account=deployer)
        )
        receipt = with_retries(
            "deploy receipt",
            lambda: client.wait_for_transaction_receipt(
                tx,
                status=TransactionStatus.FINALIZED,
                interval=12000,
                retries=150,
                full_transaction=True,
            ),
            attempts=3,
            base_delay=15.0,
        )
        decoded = receipt.get("tx_data_decoded") or {}
        contract_address = decoded.get("contract_address") or receipt.get("recipient")
        if not contract_address:
            raise SystemExit("deploy receipt did not expose a contract address")
        deploy_record = summarize(receipt, "deploy", "SUCCESS")
        deploy_tx = deploy_record["tx_hash"]
        deploy_source_code = decoded.get("code")
        deploy_tx_data = receipt.get("tx_data")
        checkpoint = {
            "contract_address": contract_address,
            "deploy_tx": deploy_tx,
            "deploy_status": receipt.get("status_name"),
            "deploy_execution": deploy_record["execution_result"],
            "deploy_consensus": deploy_record["consensus_result"],
            "source_sha256": file_sha,
            "started": started,
        }
        transactions.clear()
        guards.clear()
        record_tx(deploy_record)
        log("deployed at %s" % contract_address)

    # Fund the demo signers with native GEN for gas. Native transfers are
    # idempotent through a balance check.
    for role, account in burners.items():
        balance = int(client.w3.eth.get_balance(account.address))
        if balance < 5 * ATTO:
            log("funding %s with GEN" % role)
            fund_native(client, deployer, account.address, 25 * ATTO)

    # Faucet SST into every signer that needs it.
    for role, account in accounts.items():
        balance = int(read_view(client, contract_address, "get_token_balance", [account.address]))
        if balance < 200 * ATTO:
            record = send_write(
                client, contract_address, "faucet_or_deposit", [400 * ATTO], account, "faucet_" + role
            )
            record_tx(record)
            assert observed_matches(record, "SUCCESS"), record

    # Register the three passport claims.
    passport_ids = {}
    for role, spec in (("alpha", ALPHA), ("beta", BETA), ("gamma", GAMMA)):
        existing = find_passport_id(client, contract_address, spec["handle"])
        if existing:
            passport_ids[role] = existing
            log("passport %s already registered as %d" % (role, existing))
            continue
        record = send_write(
            client,
            contract_address,
            "register_credential_claim",
            [
                spec["handle"],
                spec["category"],
                spec["proof_url"],
                spec["fingerprint"],
                spec["stake"] * ATTO,
            ],
            accounts[role],
            "register_" + role,
        )
        record_tx(record)
        assert observed_matches(record, "SUCCESS"), record
        passport_ids[role] = find_passport_id(client, contract_address, spec["handle"])

    # Multi signer staked vouches.
    vouch_plan = [
        ("beta", "alpha", 10),
        ("gamma", "alpha", 15),
        ("alpha", "beta", 10),
    ]
    for voucher_role, target_role, amount in vouch_plan:
        passport = read_view(client, contract_address, "get_passport", [passport_ids[target_role]])
        registry = passport["voucher_registry"]
        voucher_hex = accounts[voucher_role].address.lower()
        if voucher_hex in registry:
            log("vouch %s -> %s already present" % (voucher_role, target_role))
            continue
        record = send_write(
            client,
            contract_address,
            "vouch_for_passport",
            [passport_ids[target_role], amount * ATTO],
            accounts[voucher_role],
            "vouch_" + voucher_role + "_to_" + target_role,
        )
        record_tx(record)
        assert observed_matches(record, "SUCCESS"), record

    # Live consensus run 1: the alpha claim should become an active passport.
    alpha_state = read_view(client, contract_address, "get_passport", [passport_ids["alpha"]])
    if alpha_state["status"] == "PROVISIONAL":
        record = send_write(
            client,
            contract_address,
            "verify_passport_credential_live",
            [passport_ids["alpha"]],
            deployer,
            "verify_alpha_diamond",
        )
        record_tx(record)
        assert observed_matches(record, "SUCCESS"), record
    alpha_state = read_view(client, contract_address, "get_passport", [passport_ids["alpha"]])
    log("alpha band %s status %s" % (alpha_state["trust_band"], alpha_state["status"]))
    if alpha_state["status"] != "ACTIVE":
        raise SystemExit("alpha did not reach ACTIVE after live verification")

    # Live consensus run 2: the beta claim publishes no fingerprint, so the
    # deterministic fail closed path must keep it provisional.
    beta_state = read_view(client, contract_address, "get_passport", [passport_ids["beta"]])
    if beta_state["status"] == "PROVISIONAL":
        record = send_write(
            client,
            contract_address,
            "verify_passport_credential_live",
            [passport_ids["beta"]],
            burners["beta"],
            "verify_beta_missing_fingerprint",
        )
        record_tx(record)
        assert observed_matches(record, "SUCCESS"), record
    beta_state = read_view(client, contract_address, "get_passport", [passport_ids["beta"]])
    log("beta band %s status %s" % (beta_state["trust_band"], beta_state["status"]))
    if beta_state["trust_band"] != "UNVERIFIED_PROVISIONAL":
        raise SystemExit("beta did not stay provisional after the missing fingerprint check")
    if beta_state["status"] not in ("UNVERIFIED_PROVISIONAL", "CHALLENGED"):
        raise SystemExit("beta left the provisional state unexpectedly: %s" % beta_state["status"])

    # Live consensus run 3: the gamma proof page never references the claim, so
    # the anchor is zero and the stake is slashed into the protocol reserve.
    gamma_state = read_view(client, contract_address, "get_passport", [passport_ids["gamma"]])
    if gamma_state["status"] == "PROVISIONAL":
        record = send_write(
            client,
            contract_address,
            "verify_passport_credential_live",
            [passport_ids["gamma"]],
            burners["gamma"],
            "verify_gamma_fabricated_evidence",
        )
        record_tx(record)
        assert observed_matches(record, "SUCCESS"), record
    gamma_state = read_view(client, contract_address, "get_passport", [passport_ids["gamma"]])
    log("gamma band %s status %s" % (gamma_state["trust_band"], gamma_state["status"]))
    if gamma_state["status"] != "SLASHED":
        raise SystemExit("gamma was not slashed after fabricated evidence")

    # Claim the verified reward and unlocked stake from vault custody.
    alpha_state = read_view(client, contract_address, "get_passport", [passport_ids["alpha"]])
    if int(alpha_state["holder_claimable"]) > 0:
        record = send_write(
            client,
            contract_address,
            "claim_verified_stake_or_bounty",
            [passport_ids["alpha"]],
            deployer,
            "claim_alpha_reward_and_stake",
        )
        record_tx(record)
        assert observed_matches(record, "SUCCESS"), record

    # Move SST between wallets to prove the ledger is live.
    beta_balance = int(read_view(client, contract_address, "get_token_balance", [burners["beta"].address]))
    if beta_balance < 300 * ATTO:
        record = send_write(
            client,
            contract_address,
            "transfer_tokens",
            [burners["beta"].address, 25 * ATTO],
            deployer,
            "transfer_alpha_to_beta",
        )
        record_tx(record)
        assert observed_matches(record, "SUCCESS"), record

    # Challenge escrow: the challenger locks a bond equal to the beta stake.
    beta_state = read_view(client, contract_address, "get_passport", [passport_ids["beta"]])
    if not beta_state["challenge_open"]:
        record = send_write(
            client,
            contract_address,
            "challenge_sybil_passport",
            [passport_ids["beta"], int(beta_state["stake_amount"]), FRAUD_URL],
            burners["challenger"],
            "challenge_beta",
        )
        record_tx(record)
        assert observed_matches(record, "SUCCESS"), record

    # Guard probes. Each one is an expected on chain rollback. Results are
    # reused on a rerun so the same contract is never probed twice.
    completed_guards = {guard["step"] for guard in guards}
    guard_plan = [
        (
            "self_vouch_revert",
            "self vouch is not allowed",
            "vouch_for_passport",
            [passport_ids["alpha"], 10 * ATTO],
            deployer,
        ),
        (
            "duplicate_fingerprint_revert",
            "duplicate identity fingerprint",
            "register_credential_claim",
            [
                "nadia_koval_clone",
                "GITHUB",
                PROOF_BASE + "passport-beta.md",
                ALPHA["fingerprint"],
                50 * ATTO,
            ],
            burners["beta"],
        ),
        (
            "premature_stake_exit_revert",
            "open sybil challenge pending",
            "withdraw_unlocked_stake",
            [passport_ids["beta"]],
            burners["beta"],
        ),
    ]
    for step, reason, function_name, args, account in guard_plan:
        if step in completed_guards:
            log("guard %s already recorded" % step)
            continue
        record = send_write(
            client, contract_address, function_name, args, account, step, expected="ROLLBACK"
        )
        record["expected_reason"] = reason
        record["verified"] = observed_matches(record, "ROLLBACK")
        record_tx(record)
        guards.append(
            {
                "step": step,
                "tx_hash": record["tx_hash"],
                "execution_result": record["execution_result"],
                "expected_reason": reason,
                "verified": record["verified"],
            }
        )
        if not record["verified"]:
            raise SystemExit("guard %s did not roll back as expected" % step)
        persist()

    # Final on chain reads.
    final_passports = {}
    for role, passport_id in passport_ids.items():
        final_passports[role] = read_view(client, contract_address, "get_passport", [passport_id])
    vault_state = read_view(client, contract_address, "get_vault_state")
    invariants = read_view(client, contract_address, "check_vault_invariants")
    leaderboard = read_view(client, contract_address, "get_leaderboard", [10])
    activity = read_view(client, contract_address, "get_activity", [12])
    config = read_view(client, contract_address, "get_config")

    if not invariants["ok"]:
        raise SystemExit("vault invariant failed on chain: %s" % json.dumps(invariants))

    # Four way source identity.
    onchain_code = with_retries(
        "gen_getContractCode",
        lambda: (throttle(), client.provider.make_request("gen_getContractCode", [contract_address]))[1],
    )["result"]
    if isinstance(onchain_code, dict):
        onchain_code = onchain_code.get("code") or onchain_code.get("result") or ""
    onchain_bytes = b""
    if isinstance(onchain_code, str) and onchain_code:
        try:
            candidate = base64.b64decode(onchain_code, validate=True)
            if b"Depends" in candidate[:400] or candidate.startswith(b"#"):
                onchain_bytes = candidate
            else:
                onchain_bytes = onchain_code.encode("utf-8")
        except Exception:
            onchain_bytes = onchain_code.encode("utf-8")
    elif onchain_code:
        onchain_bytes = bytes(onchain_code)

    deploy_record = next((tx for tx in transactions if tx["step"] == "deploy"), None)
    deploy_code_bytes = deploy_source_code.encode("utf-8") if isinstance(deploy_source_code, str) else None
    if deploy_code_bytes is None and deploy_tx_data:
        try:
            raw_tx = deploy_tx_data[2:] if deploy_tx_data.startswith("0x") else deploy_tx_data
            decoded_payload = decode_tx_data(bytes.fromhex(raw_tx))
            tx_code = decoded_payload.get("code") if isinstance(decoded_payload, dict) else None
            if isinstance(tx_code, str) and tx_code.startswith("0x"):
                deploy_code_bytes = bytes.fromhex(tx_code[2:])
            elif isinstance(tx_code, str):
                deploy_code_bytes = tx_code.encode("utf-8")
        except Exception as exc:  # noqa: BLE001 - recorded as unavailable evidence
            log("could not decode deploy calldata: %s" % type(exc).__name__)
    if deploy_code_bytes is None and checkpoint.get("deploy_tx") and deploy_record is None:
        deploy_record = {
            "step": "deploy",
            "tx_hash": checkpoint["deploy_tx"],
            "status": checkpoint.get("deploy_status"),
            "execution_result": checkpoint.get("deploy_execution"),
            "consensus_result": checkpoint.get("deploy_consensus"),
            "expected": "SUCCESS",
            "explorer": EXPLORER + "/transactions/" + checkpoint["deploy_tx"],
        }
        transactions.insert(0, deploy_record)

    hashes = {
        "repo_file": file_sha,
        "git_head_blob": git_sha,
        "deploy_tx_code": sha256_bytes(deploy_code_bytes) if deploy_code_bytes else None,
        "onchain_contract_code": sha256_bytes(onchain_bytes) if onchain_bytes else None,
    }
    matched = [name for name, value in hashes.items() if value == file_sha]
    four_way_match = len(matched) == 4

    evidence = {
        "project": "SybilShield",
        "network": "studionet",
        "chain_id": CHAIN_ID,
        "rpc": "https://studio.genlayer.com/api",
        "explorer": EXPLORER,
        "started_at": started,
        "finished_at": now_iso(),
        "contract_address": contract_address,
        "deploy_tx": checkpoint.get("deploy_tx") or (deploy_record or {}).get("tx_hash"),
        "source_sha256": file_sha,
        "source_identity": {
            "hashes": hashes,
            "matched_sources": matched,
            "four_way_match": four_way_match,
        },
        "signers": {role: account.address for role, account in accounts.items()},
        "passport_ids": passport_ids,
        "transactions": transactions,
        "guard_rollbacks": guards,
        "passports": final_passports,
        "vault_state": vault_state,
        "invariants": invariants,
        "leaderboard": leaderboard,
        "activity": activity,
        "config": {
            "token_symbol": config["token_symbol"],
            "anchor_ladder": config["anchor_ladder"],
            "min_stake": config["min_stake"],
            "base_reward": config["base_reward"],
        },
        "consensus_runs": [
            {
                "passport": role,
                "band": final_passports[role]["trust_band"],
                "anchor": final_passports[role]["authenticity_anchor"],
                "fingerprint_matched": final_passports[role]["fingerprint_matched"],
                "status": final_passports[role]["status"],
                "note": final_passports[role]["verification_note"],
            }
            for role in ("alpha", "beta", "gamma")
        ],
    }

    if not four_way_match:
        log("WARNING: four way sha256 identity is incomplete: %s" % matched)

    EVIDENCE_JSON.write_text(json.dumps(evidence, indent=2) + "\n")
    FRONTEND_DEPLOY.write_text(
        json.dumps(
            {
                "network": "studionet",
                "chainId": CHAIN_ID,
                "address": contract_address,
                "deployTx": evidence["deploy_tx"],
                "sourceSha256": file_sha,
                "deployedAt": evidence["finished_at"],
                "explorer": EXPLORER,
            },
            indent=2,
        )
        + "\n"
    )
    write_markdown(evidence)
    checkpoint["deploy_status"] = "FINALIZED"
    checkpoint["finished_at"] = evidence["finished_at"]
    CHECKPOINT.write_text(json.dumps(checkpoint, indent=2) + "\n")

    log("")
    log("contract %s" % contract_address)
    log("deploy tx %s" % evidence["deploy_tx"])
    log("four way sha256 match %s (%s)" % (four_way_match, ", ".join(matched)))
    log("guard rollbacks %d" % len(guards))
    log("evidence %s" % EVIDENCE_JSON)
    if not four_way_match:
        raise SystemExit("four way sha256 identity did not fully match")


def write_markdown(evidence):
    lines = []
    lines.append("# SybilShield studionet evidence")
    lines.append("")
    lines.append("Every transaction below reached FINALIZED on chain and was read back")
    lines.append("through the GenLayer consensus data contract. Nothing in this file is")
    lines.append("copied from CLI output.")
    lines.append("")
    lines.append("- Network: studionet (chain ID %d)" % evidence["chain_id"])
    lines.append("- Contract: `%s`" % evidence["contract_address"])
    lines.append("- Deploy transaction: `%s`" % evidence["deploy_tx"])
    lines.append("- Source sha256: `%s`" % evidence["source_sha256"])
    lines.append("- Four way source match: `%s`" % evidence["source_identity"]["four_way_match"])
    lines.append("- Finished at: %s" % evidence["finished_at"])
    lines.append("")
    lines.append("## Source identity")
    lines.append("")
    lines.append("| Source | sha256 | Matches repo file |")
    lines.append("| --- | --- | --- |")
    for name, value in evidence["source_identity"]["hashes"].items():
        lines.append(
            "| %s | `%s` | %s |"
            % (name, value or "unavailable", "yes" if value == evidence["source_sha256"] else "no")
        )
    lines.append("")
    lines.append("## Signers")
    lines.append("")
    lines.append("| Role | Address |")
    lines.append("| --- | --- |")
    for role, address in evidence["signers"].items():
        lines.append("| %s | `%s` |" % (role, address))
    lines.append("")
    lines.append("## Transactions")
    lines.append("")
    lines.append("| Step | Tx | Status | Execution | Consensus |")
    lines.append("| --- | --- | --- | --- | --- |")
    for tx in evidence["transactions"]:
        lines.append(
            "| %s | `%s` | %s | %s | %s |"
            % (
                tx["step"],
                tx["tx_hash"],
                tx.get("status"),
                tx.get("execution_result"),
                tx.get("consensus_result"),
            )
        )
    lines.append("")
    lines.append("## Consensus outcomes")
    lines.append("")
    lines.append("| Passport | Band | Anchor | Fingerprint matched | Status |")
    lines.append("| --- | --- | --- | --- | --- |")
    for run in evidence["consensus_runs"]:
        lines.append(
            "| %s | %s | %d | %s | %s |"
            % (run["passport"], run["band"], run["anchor"], run["fingerprint_matched"], run["status"])
        )
    lines.append("")
    lines.append("## Guard rollbacks")
    lines.append("")
    lines.append("| Probe | Tx | Execution | Expected revert | Verified |")
    lines.append("| --- | --- | --- | --- | --- |")
    for guard in evidence["guard_rollbacks"]:
        lines.append(
            "| %s | `%s` | %s | %s | %s |"
            % (
                guard["step"],
                guard["tx_hash"],
                guard["execution_result"],
                guard["expected_reason"],
                guard["verified"],
            )
        )
    lines.append("")
    lines.append("## Final vault accounting")
    lines.append("")
    state = evidence["vault_state"]
    for key in (
        "vault_custody_balance",
        "protocol_slash_reserve",
        "locked_stakes",
        "locked_vouches",
        "locked_bonds",
        "pending_claims",
        "expected_liabilities",
        "circulating_supply",
        "total_minted",
    ):
        lines.append("- %s: `%s`" % (key, state[key]))
    lines.append("- vault balanced: `%s`" % state["vault_balanced"])
    lines.append("- supply conserved: `%s`" % state["supply_conserved"])
    lines.append("")
    lines.append("The contract view `check_vault_invariants` returned `ok = %s`." % evidence["invariants"]["ok"])
    lines.append("")
    EVIDENCE_MD.write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(130)
