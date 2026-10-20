# SybilShield

**Staked Cross-Platform Credential and Anti-Sybil Trust-Graph Passport**

SybilShield turns a social handle into an on-chain passport backed by real staked
SST, peer trust attestations, and a validator consensus review of the public
proof page. There is no owner key, no admin override, and no deterministic
shortcut that can mint a badge, move escrowed funds, or override reputation.

Live dashboard: <https://hoveiser.github.io/sybil-shield/>
Contract source: [`contracts/sybil_shield.py`](contracts/sybil_shield.py)
Transaction evidence: [`docs/evidence.md`](docs/evidence.md)

![SybilShield logo](docs/logo.png)

## Live deployment

| Item | Value |
| --- | --- |
| Network | GenLayer studionet, chain ID `61999` |
| Contract | [`0xd85E634b0C16D6d79b0AD10406B791db2a1fdaCc`](https://genlayer-explorer.vercel.app/contracts/0xd85E634b0C16D6d79b0AD10406B791db2a1fdaCc) |
| Deploy transaction | `0x45396573bbec2684867b9acf76de04477b773ccaf783226bf6b0c5645306314e` |
| Deploy transaction created | `2026-10-20T13:59:55+00:00` (read back from the chain) |
| Deployed contract commit | `9e7e02ba3f068b5f8f8a916544efdff6561148b7` |
| Release tag | `studionet-v1`, whose contract blob is byte identical to `9e7e02b` |
| Contract source sha256 | `99c4adf28f51c4dc9437754a313fb1a91a75431838ffbc2277fe7f48af31ac19` |
| Four-way source identity | `4 / 4` sources match (repo file, git HEAD blob, deploy calldata, on-chain code) |
| Finalized transactions | `19`, all `FINALIZED` with `MAJORITY_AGREE` |
| Guard rollbacks | `3 / 3`, each `FINALIZED` with leader execution result `ERROR` (reverted) |
| Vault invariant | `check_vault_invariants().ok = true` |

The four hashes are not cosmetic. The repository file, the committed git blob,
the code payload inside the deploy transaction, and the code served by
`gen_getContractCode` all produce the same sha256.

The transaction table above is generated, not typed. `103` direct tests and
`genvm-lint` pass on the same commit, and CI runs both on every push to `main`
(`.github/workflows/ci.yml`).

### Live consensus outcomes

| Passport | Claim | Anchor | Band | Final status |
| --- | --- | --- | --- | --- |
| `nadia_koval` | Fingerprint bound on the proof page | `100` | `DIAMOND_HUMAN` | `ACTIVE` |
| `orion_labs` | Handle visible, fingerprint missing | `40` | `UNVERIFIED_PROVISIONAL` | `CHALLENGED` |
| `specter_ops` | Proof page never references the claim | `0` | `SYBIL_FRAUD_SLASH` | `SLASHED` |

## Why this needs GenLayer

A passport is a judgment about an external, adversarial, and changing evidence
page. A normal backend can fetch the page, but it cannot make that judgment
credible to strangers. GenLayer is used for exactly the step that needs
independent agreement:

1. Validators fetch the proof page and the fraud report themselves.
2. Each validator scores authenticity on a discrete ladder: `0`, `40`, `75`, `100`.
3. Validators must agree exactly on `trust_band`, `authenticity_anchor`, and
   `fingerprint_matched`.
4. Only then does the deterministic settlement branch run and move SST.

The frontend, the token indexer, and the simulator are conveniences. The
contract owns the credential decision, the escrow, the challenge resolution, and
the final settlement.

## The problem

Reputation systems that cost nothing to create are free to farm. A sybil cluster
can register many wallets, copy the same proof page, vouch for itself, and wait
for a badge. SybilShield makes every step expensive and every claim contestable:

- The applicant locks real SST before review.
- A vouch requires the voucher's own SST to be locked in vault custody.
- A challenger locks a bond equal to the applicant stake before verification.
- A false challenge pays the passport holder. A confirmed sybil pays the
  challenger.
- The same identity fingerprint cannot be registered twice.
- A page that never references the claim is slashable evidence, not a warning.

## Contract lifecycle

```text
register_credential_claim
  debit applicant SST -> vault_custody_balance
  create passport (PROVISIONAL)
        |
        +--> vouch_for_passport (staked, one per voucher, no self vouch)
        |
        +--> challenge_sybil_passport (bond == stake, bond locked in vault)
                    |
                    v
update_proof_url (holder, provisional only, blocked while challenged)
  replace a moved or offline proof page
        |
        v
verify_passport_credential_live
  snapshot storage into locals
  gl.nondet.web.render(proof_url) and fraud page
  sanitize, detect prompt injection, check fingerprint binding
  discrete anchor -> deterministic trust band
  gl.eq_principle.prompt_comparative demands exact agreement on 3 fields
        |
        +--> 100 / 75: ACTIVE
        |      stake + false bond + reward become claimable
        |
        +--> 40: UNVERIFIED_PROVISIONAL
        |      stake stays locked, challenger bond is returned
        |
        +--> 0: SLASHED
               stake + complicit vouch stakes go to the challenger,
               or to the protocol reserve when there is no challenger
                    |
                    v
claim_verified_stake_or_bounty
  vault_custody_balance -> holder or challenger token balance
```

### Status and permission matrix

`who` is the caller that the guard accepts. Fund movements are always
`vault_custody_balance` to a token balance, or the reverse. There is no owner
role in this table.

| Status | Write methods that succeed | Next status | What happens to funds |
| --- | --- | --- | --- |
| `PROVISIONAL` | `vouch_for_passport` (non holder), `challenge_sybil_passport` (non holder, non voucher), `update_proof_url` (holder), `verify_passport_credential_live` (anyone) | `ACTIVE`, `UNVERIFIED`, `CHALLENGED`, `SLASHED` | Stake locked in custody, nothing is released before a round |
| `CHALLENGED` | `verify_passport_credential_live` (anyone) | `ACTIVE`, `UNVERIFIED`, `SLASHED` | Stake, vouches and the bond stay locked until the round settles |
| `UNVERIFIED` | `withdraw_unlocked_stake` (holder), `reclaim_vouch` (voucher), `challenge_sybil_passport`, `update_proof_url` (holder), `verify_passport_credential_live` | `WITHDRAWN`, `CHALLENGED`, `ACTIVE`, `SLASHED` | Bond returned to the challenger as a claim, stake still locked until the holder exits |
| `ACTIVE` | `claim_verified_stake_or_bounty` (holder), `vouch_for_passport`, `reclaim_vouch` (voucher) | terminal | Stake, false bond and reward leave custody through the claim |
| `SLASHED` | `claim_verified_stake_or_bounty` (challenger) | terminal | Stake plus confiscated voucher stakes go to the challenger, or to the reserve when nobody challenged |
| `WITHDRAWN` | `reclaim_vouch` (voucher) | terminal | Holder stake already returned, voucher stakes still reclaimable |

Every status has at least one exit that moves funds out of custody, and no exit
depends on a specific counterparty cooperating: verification is permissionless,
so a challenged or stalled passport cannot be frozen by silence. The contract
uses status transitions rather than wall clock deadlines, because a deadline an
LLM validator can read is not deterministic across rotations. The only thing
that can stall a round is consensus itself failing to finalize (for example a
validator timeout), which is recorded as a failed transaction and can be retried
by anyone.

### Trust bands

| Anchor | Band | Meaning | Settlement |
| --- | --- | --- | --- |
| `100` | `DIAMOND_HUMAN` | Handle and fingerprint bound, no fraud signal | Active, full reward basis points |
| `75` | `VERIFIED_CONTRIBUTOR` | Handle and fingerprint bound, partial or stale evidence | Active, reduced reward basis points |
| `40` | `UNVERIFIED_PROVISIONAL` | Binding incomplete or unverifiable | No badge, stake stays locked, bond returned |
| `0` | `SYBIL_FRAUD_SLASH` | Impersonation, conflicting fingerprint, or fabricated evidence | Stake and complicit vouches slashed |

The reward is drawn only from the protocol slash reserve. A verification never
mints SST. That reserve is seeded at genesis and grows when fraud is slashed.

## Vault accounting

All SST movements go through `_credit`, `_debit`, `_lock`, and `_unlock_to`, so
the following invariant is meaningful and is checked by a public view:

```text
vault_custody_balance
  = protocol_slash_reserve
  + locked applicant stakes
  + locked voucher stakes
  + open challenger bonds
  + finalized pending claims

total_minted = circulating_supply + vault_custody_balance
```

At the recorded studionet state:

```text
773 SST = 638 reserve + 50 stakes + 35 vouches + 50 bonds + 0 pending
2200 minted = 1427 circulating + 773 custody
```

## Security model

Every counterparty is treated as adversarial.

- **No owner or admin bypass.** There is no role that can approve a badge,
  override a score, or slash a passport. Every credential decision runs through
  live validators.
- **Exact consensus fields.** `prompt_comparative` requires identical
  `trust_band`, `authenticity_anchor`, and `fingerprint_matched`. A disagreement
  fails equivalence and forces another rotation.
- **Fail-closed evidence parsing.** Malformed model JSON, prompt injection
  markers, and missing fingerprint binding all cap the result at anchor `40`.
  No bad parse can grant a badge or unlock a stake.
- **Strict input validation.** Both time and money windows have floors and
  ceilings: stake floor and ceiling, vouch floor and ceiling, faucet caps, bounded
  URLs, bounded evidence text, and a challenger bond that must equal the stake.
- **Race checks.** A passport with an open challenge cannot be challenged again,
  cannot be withdrawn, and cannot accept new vouches. A previous unresolved
  claim must be settled before a new challenge round starts.
- **Unique identity.** The fingerprint index maps one identity to exactly one
  live passport. Self-vouching, self-challenging, and voucher-challenging revert
  before any token moves.
- **No name burning.** A holder that exits after an inconclusive round releases
  the handle and fingerprint index, so a sybil cannot register a victim handle,
  take one provisional round, withdraw and quarantine the name forever. A
  slashed identity stays quarantined.
- **Confiscated vouches are retired.** When a passport is slashed, every voucher
  record is marked inactive and the registry is cleared, so a confiscated stake
  can never be reclaimed by its voucher and never double counts.
- **Post-slash lockdown.** A slashed passport rejects vouches and voucher
  reclaims.
- **Bounded vouches.** A passport accepts at most 12 staked vouchers, which
  bounds the registry string and the storage cost of any single passport.
- **Evidence recovery.** The holder can replace the proof URL while the passport
  is provisional and unchallenged, so a moved or offline page cannot strand the
  stake. After settlement, the evidence is frozen.
- **Challenge burden of proof.** An unreachable fraud report is treated as no
  evidence, not as a reason to block the passport. The challenger chose that URL
  and their bond is at risk if the accusation cannot be supported.

## Repository layout

```text
contracts/sybil_shield.py            Intelligent Contract (22 methods, 12 view, 10 write)
tests/test_sybil_shield_direct.py    103 direct mode tests
tests/conftest.py                    Windows unlink/remove permission workaround
scripts/deploy_studionet.py          Idempotent deploy, seed, live run and evidence writer
scripts/build_frontend_snapshot.py   Evidence -> frontend fallback snapshot
frontend/                            React + TypeScript + Vite + Tailwind dashboard
proofs/                              Public proof pages used by the live validators
docs/evidence.md                     Generated transaction level evidence
evidence/studionet_deployment.json   Machine readable evidence
tools/generate_logo.py               512x512 logo generator
tools/generate_soundtrack.py         48s synthesized soundtrack
tools/generate_demo_video.py         Frame renderer, ASS/SRT subtitles, ffmpeg encode
```

## Local development

### Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer
- ffmpeg with libass (only for the demo video)
- A `.env` file in the repository root with:

```text
GENLAYER_PRIVATE_KEY=0x...
GITHUB_TOKEN=ghp_...
```

`.env` is gitignored. The deploy script refuses to run if the contract has
uncommitted changes, so the deploy tx code hash always matches the repo file.

### Contract

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/genvm-lint check contracts/sybil_shield.py
.venv/bin/python -m pytest tests/ -q
```

Expected: `genvm-lint` reports zero errors, and `103 passed` in direct mode.

### Studionet deployment

```bash
.venv/bin/python scripts/deploy_studionet.py
```

The script is idempotent. It reuses a finalized deployment when the source hash
matches, reads contract state before every seed step, retries RPC reads with
exponential backoff, and records every transaction through the consensus data
contract. It writes:

- `evidence/studionet_deployment.json`
- `docs/evidence.md`
- `frontend/src/deployments/studionet.json`
- `evidence/_checkpoint.json` (gitignored, for safe reruns)

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
```

The dashboard performs four reads on first load (`get_config`,
`get_vault_state`, `get_leaderboard`, `get_activity`) plus the genlayer-js client
initialization. It never passes a local ABI override to `readContract`. If the
RPC is rate limited, it falls back to the bundled verified snapshot and labels
the data as cached.

## Dashboard features

- **Biometric passport card** with a live trust ring, band chip, stake, vouch
  total, anchor, verification note, and evidence digest.
- **SVG trust graph** with staked voucher nodes, challenger bond, evidence node,
  radar sweep, and animated edge weights.
- **What-if trust graph and slashing simulator**: sliders for applicant stake,
  peer vouches, challenger bond, and consensus anchor. It shows the live trust
  score, badge tier, and exact SST vault distribution, including the custody
  invariant after settlement.
- **Consensus and prompt inspector drawer**: the live prompt, the exact
  equivalence principle, the fail-closed rules, the anchor ladder, and the live
  studionet runs.
- **Security guard lab**: one-click probes for self-vouch revert, duplicate
  fingerprint revert, and premature stake exit revert. The probes mirror the
  on-chain predicates and link to the real rollback transactions.
- **Vault ledger**: the invariant components, supply conservation, and the
  balanced or drift state.
- **Dual wallet**: a 1-click burner stored in this browser, and MetaMask with a
  GenLayer Studio chain add/switch request.
- **Web Audio synthesizer**: interface chimes, hover blips, verification
  arpeggios, and error tones, all generated in the browser.

## Demo video

`docs/demo-video-subtitled.mp4` is a 48 second, 1280x720, H.264/AAC video with a
synthesized ambient electronic soundtrack and burned-in English subtitles. It is
gitignored because binaries do not belong on `main`; regenerate it with:

```bash
.venv/bin/python tools/generate_soundtrack.py
.venv/bin/python tools/generate_demo_video.py
```

Subtitles are generated in both SRT and ASS form at `docs/demo.srt` and
`docs/demo.ass`. The ASS file uses an explicit 1280x720 script resolution so the
burned-in text is exactly 24px.

## Testing

The direct suite runs the contract in the GenVM direct runner and covers 103
tests across:

- SST ledger: faucet caps, transfers, conservation, insufficient balance.
- Registration: stake floors and ceilings, duplicate fingerprint, duplicate
  handle per domain, invalid URLs, unsupported categories.
- Staked vouches: locks, self-vouch, duplicates, reclaim windows, trust bonuses.
- Challenges: bond equality, bond locking, self-challenge, voucher challenge,
  double challenge, closed windows.
- All four trust bands and their exact settlement branches.
- Fail-closed paths: missing fingerprint, prompt injection, malformed JSON,
  thin pages, fabricated pages, conflicting bindings, string anchors.
- Claims, false-challenger payouts, double claims, non-entitled callers.
- Exit guards: open challenge, provisional withdrawal, post-slash lockdown.
- Identity indexes: duplicate fingerprint and handle per domain, release after a
  holder withdraws, permanent quarantine after a slash, retired voucher records
  after a slash, and double reclaim.
- Invariants, leaderboard ordering, activity feed, prompt preview.

Direct mode runs the leader path only. Validator agreement is proven by the live
studionet run, not by direct tests.

## Honest notes

- SST is a demo token with a capped faucet. It is not a financial asset.
- The guard lab is a deterministic mirror of the contract predicates. The real
  rollbacks are recorded in the evidence with their transaction hashes.
- The simulator never writes to the contract. It mirrors the contract math for
  exploration.
- The GenLayer explorer at `genlayer-explorer.vercel.app` returned HTTP 503
  while this release was prepared. All evidence was verified through the
  consensus data contract and `gen_getContractCode`, and the explorer links are
  kept for when the explorer is reachable.
- The burner wallet stores an ephemeral key in localStorage. It is for the
  studionet demo only.

## License

MIT. See [LICENSE](LICENSE).
