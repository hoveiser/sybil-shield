# SybilShield studionet evidence

Every transaction below reached FINALIZED on chain and was read back
through the GenLayer consensus data contract. Nothing in this file is
copied from CLI output.

- Network: studionet (chain ID 61999)
- Contract: `0xd37a39a3260aD2055a09CF89f3ecf71972695b8d`
- Deploy transaction: `0x94483762014a801c61d4783ac3b140a21738eeba353c2c2d4238cc4c5fed00c7`
- Source sha256: `38594a53cce92aac364ad3be10db1fb6db3af5ffb01b6cfe74b163cc0e60668e`
- Four way source match: `True`
- Finished at: 2026-10-20T11:39:54+00:00

## Source identity

| Source | sha256 | Matches repo file |
| --- | --- | --- |
| repo_file | `38594a53cce92aac364ad3be10db1fb6db3af5ffb01b6cfe74b163cc0e60668e` | yes |
| git_head_blob | `38594a53cce92aac364ad3be10db1fb6db3af5ffb01b6cfe74b163cc0e60668e` | yes |
| deploy_tx_code | `38594a53cce92aac364ad3be10db1fb6db3af5ffb01b6cfe74b163cc0e60668e` | yes |
| onchain_contract_code | `38594a53cce92aac364ad3be10db1fb6db3af5ffb01b6cfe74b163cc0e60668e` | yes |

## Signers

| Role | Address |
| --- | --- |
| alpha | `0x3de43AA2f7162c80af98abe78222aE0Cdf83c506` |
| beta | `0x8D3F5eD0021881B3F6B1779ea74Bd9aE45E4a2bD` |
| gamma | `0x4832ECCFb2bc3eb738BB823959B24a476b138e7D` |
| challenger | `0xBeA3D7eF574705BC655cdE400Eb6749196E08730` |

## Transactions

| Step | Tx | Status | Execution | Consensus |
| --- | --- | --- | --- | --- |
| deploy | `0x94483762014a801c61d4783ac3b140a21738eeba353c2c2d4238cc4c5fed00c7` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_alpha | `0x540d4c97f7d78d084bf7039c58695585e5b0a3b9dd9342d302df66eeda7960b0` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_beta | `0x6e4ca113658a5f7e817d70e87ccc387fd29dc0aba48d5e5383485550356365ce` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_gamma | `0xb1765fdc179f930d9ee5caefe7fdc64ef0af36896364416dec92f00b832eb37e` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_challenger | `0x6f711500cbb197997e5b295709f310b1d6954ecf5e0afd4bb6ea7edf815e6ad5` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_alpha | `0xe7b8dc69427a023fd6d2f2906c67cd2e4d580ab68c4d74b2d8145a5eec3e4740` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_beta | `0xa28141c940d7d3de8e3a0f1a2b21686e675441a888732260373a32f30e002be3` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_gamma | `0x15b9bf2c31dcab40200a6d807632ea540db4347e261d9ff6b2a060d3f3ee6d2c` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| vouch_beta_to_alpha | `0x7e076a3592edaf21bfaaa7ab982b9e53a2f8a8c02eb896ff7ba504680d700000` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| vouch_gamma_to_alpha | `0x014b48db68e2c58d70788a65333786ed36a676e4b0416257294a7f992f97a155` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| vouch_alpha_to_beta | `0xab19c0a5ac405723455e28dcb05ff7d136bab1be64c02f65e7fdf50bba8b3d59` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| verify_alpha_diamond | `0x38e0373b25c4c9fe8efdb3cf31dfda13c1da565b6c1201e6c7797de67fb180ed` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| verify_beta_missing_fingerprint | `0x95c3ec07267200fe50a94af84a2284fa07a7c85bd293e10fe6ed4e4afe6c0c9d` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| verify_gamma_fabricated_evidence | `0xb94a50cca0772e54a456ed77359962144037593e024ee59964143b0a053bcb0b` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| claim_alpha_reward_and_stake | `0x19ae906983ac653ad3158a15e52dc738bc8933b3cb0bed9d946c940310220ca9` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| challenge_beta | `0x8b1fd803e51bf4c91421cb3ab97da6874d3106b3c843b18be5b685d83726e09d` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| self_vouch_revert | `0xf617c52bc960e3f9951cdf4f1d2a51093c6e0e031075e57040c34f349bd42dff` | FINALIZED | ERROR | MAJORITY_AGREE |
| duplicate_fingerprint_revert | `0x37e083e6083bc611e73464f6a3a6718c5ba1ddaad07f0e2c84fb96f40737f43d` | FINALIZED | ERROR | MAJORITY_AGREE |
| premature_stake_exit_revert | `0x0cd1a089eada37b188294d70037816db84256dfdb2c4fb02badf4af6a49c5cc0` | FINALIZED | ERROR | MAJORITY_AGREE |

## Consensus outcomes

| Passport | Band | Anchor | Fingerprint matched | Status |
| --- | --- | --- | --- | --- |
| alpha | DIAMOND_HUMAN | 100 | True | ACTIVE |
| beta | UNVERIFIED_PROVISIONAL | 40 | False | CHALLENGED |
| gamma | SYBIL_FRAUD_SLASH | 0 | False | SLASHED |

## Guard rollbacks

| Probe | Tx | Execution | Expected revert | Verified |
| --- | --- | --- | --- | --- |
| self_vouch_revert | `0xf617c52bc960e3f9951cdf4f1d2a51093c6e0e031075e57040c34f349bd42dff` | ERROR | self vouch is not allowed | True |
| duplicate_fingerprint_revert | `0x37e083e6083bc611e73464f6a3a6718c5ba1ddaad07f0e2c84fb96f40737f43d` | ERROR | duplicate identity fingerprint | True |
| premature_stake_exit_revert | `0x0cd1a089eada37b188294d70037816db84256dfdb2c4fb02badf4af6a49c5cc0` | ERROR | open sybil challenge pending | True |

## Final vault accounting

- vault_custody_balance: `773000000000000000000`
- protocol_slash_reserve: `638000000000000000000`
- locked_stakes: `50000000000000000000`
- locked_vouches: `35000000000000000000`
- locked_bonds: `50000000000000000000`
- pending_claims: `0`
- expected_liabilities: `773000000000000000000`
- circulating_supply: `1427000000000000000000`
- total_minted: `2200000000000000000000`
- vault balanced: `True`
- supply conserved: `True`

The contract view `check_vault_invariants` returned `ok = True`.

