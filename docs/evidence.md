# SybilShield studionet evidence

Every transaction below reached FINALIZED on chain and was read back
through the GenLayer consensus data contract. Nothing in this file is
copied from CLI output.

- Network: studionet (chain ID 61999)
- Contract: `0x2b7162AdC6F112dC03A746Ead039e44059639A04`
- Deploy transaction: `0x2df2d6775fd48e928782edc19811ee70f7643ee64ceee39beb8a22ce6978f7ec`
- Source sha256: `e156f1a0f875bd82c39c376dfbc023ce10b8a2501f96b9be82fad5f2b073bbf2`
- Four way source match: `True`
- Finished at: 2026-10-20T09:44:48+00:00

## Source identity

| Source | sha256 | Matches repo file |
| --- | --- | --- |
| repo_file | `e156f1a0f875bd82c39c376dfbc023ce10b8a2501f96b9be82fad5f2b073bbf2` | yes |
| git_head_blob | `e156f1a0f875bd82c39c376dfbc023ce10b8a2501f96b9be82fad5f2b073bbf2` | yes |
| deploy_tx_code | `e156f1a0f875bd82c39c376dfbc023ce10b8a2501f96b9be82fad5f2b073bbf2` | yes |
| onchain_contract_code | `e156f1a0f875bd82c39c376dfbc023ce10b8a2501f96b9be82fad5f2b073bbf2` | yes |

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
| deploy | `0x2df2d6775fd48e928782edc19811ee70f7643ee64ceee39beb8a22ce6978f7ec` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_beta | `0xe8b67cdc93758be23b0989b02e8356dfb26dfc086d33014376b1bc53f431d9d8` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_gamma | `0xf72d57e3c5590d53ed4315d8a7de993b2c625a6277e84957566906b078eac020` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| faucet_challenger | `0xd970c0c2cc8587dac4c937292a4c731de35d8048afb15a5d4366f30b859e469e` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_alpha | `0x65e29c7aeab570a700a6fb92c4dca21b5e4b6829748f17687473cf967de1ad11` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_beta | `0x2c3b201260a9e2046a7a7b09f612d490aed808229bd20fc197114ff237251a5f` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| register_gamma | `0xd0a6bf19f60e415b6fcd25b97c2786dff9a09390495381559783ad7aadbd73b3` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| vouch_beta_to_alpha | `0x2c251a64ae3eae58e489616541cc924a47417aa277945ad23a2f85803990a7e4` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| vouch_gamma_to_alpha | `0xcd49ae9407dbe967eb5922c0928d0ae9343ca71a2573e5b4636f537615c38062` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| vouch_alpha_to_beta | `0xcf4361017f9c88e70d21dea750994924b9a1d9dcf70f9431f2912089aa6e1d41` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| verify_alpha_diamond | `0x6587f4170af02e9c8891ca9d870d409825f6a8450e8e2008269303f5059c6a6d` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| verify_beta_missing_fingerprint | `0x322f1e6f2da2c3bc5ba4a7dff499f6c0044474fdfc79f182f37bd21b433462a1` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| verify_gamma_fabricated_evidence | `0x7188c77c5bf13deb127500236a51d7194244a065de52d617c763eb3c3b238c44` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| claim_alpha_reward_and_stake | `0x62bee7629fa4267777b116f440e7904faba3b517b367008ab4d96f5f0bd8d3c6` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| challenge_beta | `0xa028174af76d0a838ec08e81d57bdf28ec57bb7f162acacbe762f4548446843c` | FINALIZED | SUCCESS | MAJORITY_AGREE |
| self_vouch_revert | `0x13e792906f68e720f291299893d7ff8829ef2f280d1f3e43a1362425536587f7` | FINALIZED | ERROR | MAJORITY_AGREE |
| duplicate_fingerprint_revert | `0xc007f5b6005d111294f4ea78f11c657898d91dff3274aa3adc4e0fe200726ede` | FINALIZED | ERROR | MAJORITY_AGREE |
| premature_stake_exit_revert | `0xcef2c5daa8c4b37d4043afea8d85ad607c50582f1581334c3162f2d5855d9691` | FINALIZED | ERROR | MAJORITY_AGREE |

## Consensus outcomes

| Passport | Band | Anchor | Fingerprint matched | Status |
| --- | --- | --- | --- | --- |
| alpha | DIAMOND_HUMAN | 100 | True | ACTIVE |
| beta | UNVERIFIED_PROVISIONAL | 40 | False | CHALLENGED |
| gamma | SYBIL_FRAUD_SLASH | 0 | False | SLASHED |

## Guard rollbacks

| Probe | Tx | Execution | Expected revert | Verified |
| --- | --- | --- | --- | --- |
| self_vouch_revert | `0x13e792906f68e720f291299893d7ff8829ef2f280d1f3e43a1362425536587f7` | ERROR | self vouch is not allowed | True |
| duplicate_fingerprint_revert | `0xc007f5b6005d111294f4ea78f11c657898d91dff3274aa3adc4e0fe200726ede` | ERROR | duplicate identity fingerprint | True |
| premature_stake_exit_revert | `0xcef2c5daa8c4b37d4043afea8d85ad607c50582f1581334c3162f2d5855d9691` | ERROR | open sybil challenge pending | True |

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

