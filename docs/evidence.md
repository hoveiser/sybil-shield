# SybilShield studionet evidence

Every transaction below reached FINALIZED on chain and was read back
through the GenLayer consensus data contract. Nothing in this file is
copied from CLI output.

- Network: studionet (chain ID 61999)
- Contract: `0x94806406B257529934aCF29CA2E2D8e9C0D219Ba`
- Deploy transaction: `0xd617468a7e85a220e6ae7a6250ad6600dde7b4adbe1a96debd1cdb953ea5923e`
- Source sha256: `38594a53cce92aac364ad3be10db1fb6db3af5ffb01b6cfe74b163cc0e60668e`
- Four way source match: `True`
- Finished at: 2026-10-20T11:23:23+00:00

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
| deploy | `0xd617468a7e85a220e6ae7a6250ad6600dde7b4adbe1a96debd1cdb953ea5923e` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_alpha | `0xc1a34ffb325c8db873cd90e800613c25d995954ec82b94a218662b46cf47f7ff` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_beta | `0x882c4b345067d31c6b2a71978c9f07d2a9746e26468b2ca51f5d61fe9989a781` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_gamma | `0xa14c608b7e06f82fa533d2be5e2f5d78666452ee92c0155ec7dc56cd8d09b892` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_challenger | `0xf9ee7b3bc31a253bde7765422a2e25b6cc8af524bc18d87864dd685dcdce5a73` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_alpha | `0x637deed4363f869fa2063cc4ac35c51840753bd533398ba6289b4a8049013389` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_beta | `0xe0a7a39755d2babd07db4393094f05118ff776c6a68c7974bfa689d40fa76af2` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_gamma | `0x0235c97bf4fee8e8d3b094f83927dfbdfff118e428fcce8d9148e5ec3ead8b88` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| vouch_gamma_to_alpha | `0x80f54f4226ad29cf004f09312e7a672468558ea3e520ef8a3176291ae669c614` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| vouch_alpha_to_beta | `0x4327533417adea419a46e4234c2103282ab5500b87eb6e9b3198526b276831c5` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| verify_alpha_diamond | `0xfdc2118a548af399d5ca25b570dac42306a5045b64f3a12262fcac99dcd0e9a1` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| verify_beta_missing_fingerprint | `0x6821d753678f74b2facc8252a632fd3517555e5c559d65444bd419ed8ab9e14f` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| claim_alpha_reward_and_stake | `0x9f265f7e213f84aaa74ea1ee46ced4445e63c120a04edc1a3d1306854fcdef13` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| challenge_beta | `0x0e1c8b7b577c52c0ac74b9a6d53576621c09abf3772622c5edc73c67c3c7c87a` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| self_vouch_revert | `0xb08e41b48824d3a0ec7b8fd4bf3650e16fa6bddc3fc8b9e35f44b60b892e5837` | FINALIZED | ERROR | MAJORITY_AGREE |
| duplicate_fingerprint_revert | `0xa0ebbcb88b65a39119f0a9fe0abf1d6df02e52fc5d1050a83e81fe9ef709d2b8` | FINALIZED | ERROR | MAJORITY_AGREE |
| premature_stake_exit_revert | `0xf0f1d06adc0bb47b03c0fcf52b6338730c2a59cf9386a413dae687ae714edf31` | FINALIZED | ERROR | MAJORITY_AGREE |

## Consensus outcomes

| Passport | Band | Anchor | Fingerprint matched | Status |
| --- | --- | --- | --- | --- |
| alpha | DIAMOND_HUMAN | 100 | True | ACTIVE |
| beta | UNVERIFIED_PROVISIONAL | 40 | False | CHALLENGED |
| gamma | SYBIL_FRAUD_SLASH | 0 | False | SLASHED |

## Guard rollbacks

| Probe | Tx | Execution | Expected revert | Verified |
| --- | --- | --- | --- | --- |
| self_vouch_revert | `0xb08e41b48824d3a0ec7b8fd4bf3650e16fa6bddc3fc8b9e35f44b60b892e5837` | ERROR | self vouch is not allowed | True |
| duplicate_fingerprint_revert | `0xa0ebbcb88b65a39119f0a9fe0abf1d6df02e52fc5d1050a83e81fe9ef709d2b8` | ERROR | duplicate identity fingerprint | True |
| premature_stake_exit_revert | `0xf0f1d06adc0bb47b03c0fcf52b6338730c2a59cf9386a413dae687ae714edf31` | ERROR | open sybil challenge pending | True |

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

