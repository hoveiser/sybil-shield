#!/usr/bin/env python3
"""Project the studionet evidence into a frontend fallback snapshot.

The dashboard reads live state from studionet on load. If the RPC is rate
limited or offline, it falls back to this bundled snapshot and labels the data
as cached, so the page never shows invented numbers.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / "evidence" / "studionet_deployment.json"
DEPLOY = ROOT / "frontend" / "src" / "deployments" / "studionet.json"
TARGET = ROOT / "frontend" / "src" / "data" / "snapshot.json"


def main():
    evidence = json.loads(EVIDENCE.read_text())
    deployment = json.loads(DEPLOY.read_text())

    snapshot = {
        "network": "studionet",
        "chainId": evidence["chain_id"],
        "address": evidence["contract_address"],
        "deployTx": evidence["deploy_tx"],
        "sourceSha256": evidence["source_sha256"],
        "finishedAt": evidence["finished_at"],
        "explorer": evidence["explorer"],
        "config": evidence["config"],
        "vault": evidence["vault_state"],
        "leaders": evidence["leaderboard"],
        "activity": evidence["activity"],
        "consensus": evidence["consensus_runs"],
        "guards": evidence["guard_rollbacks"],
        "signers": evidence["signers"],
        "passports": evidence["passports"],
        "transactions": evidence["transactions"],
        "sourceIdentity": evidence["source_identity"],
        "sourceMatch": deployment.get("sourceSha256") == evidence["source_sha256"],
    }
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps(snapshot, indent=2) + "\n")
    print("wrote", TARGET, "leaders", len(snapshot["leaders"]), "txs", len(snapshot["transactions"]))


if __name__ == "__main__":
    main()
