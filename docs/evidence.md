# SybilShield studionet evidence

Every transaction below reached FINALIZED on chain and was read back
through the GenLayer consensus data contract. Nothing in this file is
copied from CLI output.

- Network: studionet (chain ID 61999)
- Contract: `0xd85E634b0C16D6d79b0AD10406B791db2a1fdaCc`
- Deploy transaction: `0x45396573bbec2684867b9acf76de04477b773ccaf783226bf6b0c5645306314e`
- Deploy transaction created: 2026-10-20T13:59:55.936772+00:00
- Deployed contract commit: `9e7e02ba3f068b5f8f8a916544efdff6561148b7`
- Source sha256: `99c4adf28f51c4dc9437754a313fb1a91a75431838ffbc2277fe7f48af31ac19`
- Four way source match: `True`
- Finished at: 2026-10-20T14:15:15+00:00

## Source identity

| Source | sha256 | Matches repo file |
| --- | --- | --- |
| repo_file | `99c4adf28f51c4dc9437754a313fb1a91a75431838ffbc2277fe7f48af31ac19` | yes |
| git_head_blob | `99c4adf28f51c4dc9437754a313fb1a91a75431838ffbc2277fe7f48af31ac19` | yes |
| deploy_tx_code | `99c4adf28f51c4dc9437754a313fb1a91a75431838ffbc2277fe7f48af31ac19` | yes |
| onchain_contract_code | `99c4adf28f51c4dc9437754a313fb1a91a75431838ffbc2277fe7f48af31ac19` | yes |

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
| deploy | `0x45396573bbec2684867b9acf76de04477b773ccaf783226bf6b0c5645306314e` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_alpha | `0x7ba36d454e8be67c6947792127cadf1dc1bcdb1ab0e112363b458418321f9e67` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_beta | `0x336e2613750b19b53daf1dadaa931577572f509617e998a5776d1361960cbe3e` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_gamma | `0x8ac6a0faf8964184293a45b61735ce9aa928efdae6077a37f227e380596da3e5` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_challenger | `0x6bf650f4d9efe159919d8bdc2559e032ac233f8bf2dc5d54d58562a56581ae92` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_alpha | `0x05505a93796d1638738c0b01a1364c0fad1dc9086d8048626230ea214de7d6a6` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_beta | `0x4846dcee134eec6f4dbcca3849f0d30123c7c60819ae1bb745f882467cf120f3` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_gamma | `0x426c669828d2910b4ec43fcf6d98a00719d7716e9b83c3193c9e4449e922335f` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| vouch_beta_to_alpha | `0x1d0a23687982c1f6123ed420ec6c0c6c44bff49b06d4a488ec54e1bb64528161` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| vouch_gamma_to_alpha | `0xee129d40c6363d1de7d90dc7139707de07e92395b36ea3ab746a173c5a1101ba` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| vouch_alpha_to_beta | `0x3d11837576b181b0640273c333690b3bb90baab50ac757c78c8e7ec1c03c8c25` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| verify_alpha_diamond | `0xc053e1028484ffb252860ebb33e7a0178b4c0337546a43212e7fc48bd4f98885` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| verify_beta_missing_fingerprint | `0xc8461e5e9ba36ace381e3df89883f521e1d1822c75d04725e55328d4b6e6557b` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| verify_gamma_fabricated_evidence | `0x4f1b03f9839f46a16b56d5c735657b149825e6a30215fb3eaa0d72e043e5cd08` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| claim_alpha_reward_and_stake | `0x024bc7b3864fe1b1b58b559c0332a79724b8518cef9916083cab3fb268cc3957` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| challenge_beta | `0xfaf6c42b950057421f92b6d3658b85a383b25c523fe3ec38a9f64cbff108f0e1` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| self_vouch_revert | `0x37c96f120df6d079f6e21a990cd41f4e3f09ec9c18652104979b6a45e10e9f78` | FINALIZED | ERROR | MAJORITY_AGREE |
| duplicate_fingerprint_revert | `0xa20a731e02696c8cef05cff77427e4d5bace4f8276ff679c3936604b2ff7a89b` | FINALIZED | ERROR | MAJORITY_AGREE |
| premature_stake_exit_revert | `0x35eb4c92485de3aed71e9666207559a15fe6fbfe812320f29cda8756f1cd5bc4` | FINALIZED | ERROR | MAJORITY_AGREE |

## Consensus outcomes

| Passport | Band | Anchor | Fingerprint matched | Status |
| --- | --- | --- | --- | --- |
| alpha | DIAMOND_HUMAN | 100 | True | ACTIVE |
| beta | UNVERIFIED_PROVISIONAL | 40 | False | CHALLENGED |
| gamma | SYBIL_FRAUD_SLASH | 0 | False | SLASHED |

## Guard rollbacks

| Probe | Tx | Execution | Expected revert | Verified |
| --- | --- | --- | --- | --- |
| self_vouch_revert | `0x37c96f120df6d079f6e21a990cd41f4e3f09ec9c18652104979b6a45e10e9f78` | ERROR | self vouch is not allowed | True |
| duplicate_fingerprint_revert | `0xa20a731e02696c8cef05cff77427e4d5bace4f8276ff679c3936604b2ff7a89b` | ERROR | duplicate identity fingerprint | True |
| premature_stake_exit_revert | `0x35eb4c92485de3aed71e9666207559a15fe6fbfe812320f29cda8756f1cd5bc4` | ERROR | open sybil challenge pending | True |

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

