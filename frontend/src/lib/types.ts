export type Band =
  | "DIAMOND_HUMAN"
  | "VERIFIED_CONTRIBUTOR"
  | "UNVERIFIED_PROVISIONAL"
  | "SYBIL_FRAUD_SLASH";

export type Anchor = 0 | 40 | 75 | 100;

export interface Config {
  token_symbol: string;
  token_decimals: number;
  atto: string;
  min_stake: string;
  max_stake: string;
  min_vouch: string;
  max_vouch: string;
  faucet_call_cap: string;
  faucet_account_cap: string;
  base_reward: string;
  reward_reserve_seed: string;
  anchor_ladder: Anchor[];
  bands: { anchor: Anchor; band: Band; badge: string }[];
  categories: string[];
  consensus_principle: string;
  vault_custody_balance: string;
  protocol_slash_reserve: string;
}

export interface VaultState {
  vault_custody_balance: string;
  protocol_slash_reserve: string;
  locked_stakes: string;
  locked_vouches: string;
  locked_bonds: string;
  pending_claims: string;
  expected_liabilities: string;
  vault_balanced: boolean;
  circulating_supply: string;
  total_minted: string;
  supply_conserved: boolean;
  passport_count: number;
  active_count: number;
  provisional_count: number;
  slashed_count: number;
}

export interface LeaderRow {
  passport_id: number;
  handle: string;
  domain_category: string;
  trust_score: number;
  trust_band: Band;
  badge_tier: string;
  stake_amount: string;
  vouch_total: string;
  status: string;
  sybil_resistant: boolean;
}

export interface PassportRecord {
  passport_id: number;
  holder: string;
  handle: string;
  domain_category: string;
  proof_url: string;
  identity_fingerprint: string;
  stake_amount: string;
  vouch_total: string;
  voucher_registry: string;
  status: string;
  authenticity_anchor: number;
  trust_band: Band;
  badge_tier: string;
  trust_score: number;
  fingerprint_matched: boolean;
  evidence_digest: string;
  verification_note: string;
  verification_rounds: number;
  challenge_open: boolean;
  challenger: string;
  challenge_bond: string;
  fraud_evidence_url: string;
  challenge_outcome: string;
  settled: boolean;
  holder_claimable: string;
  challenger_claimable: string;
  slashed_vouch_amount: string;
  sybil_resistant: boolean;
  bounty_eligible: boolean;
  created_seq: number;
}

export interface ActivityEntry {
  seq: number;
  actor: string;
  action: string;
  detail: string;
}

export interface ConsensusRun {
  passport: string;
  band: Band;
  anchor: number;
  fingerprint_matched: boolean;
  status: string;
  note: string;
}

export interface GuardRollback {
  step: string;
  tx_hash: string;
  execution_result: string;
  expected_reason: string;
  verified: boolean;
}

export interface Dashboard {
  source: "live" | "cached";
  config: Config;
  vault: VaultState;
  leaders: LeaderRow[];
  activity: ActivityEntry[];
  fetchedAt: string;
}

export interface PromptPreview {
  passport_id: number;
  proof_url: string;
  fraud_evidence_url: string;
  prompt: string;
  principle: string;
  anchor_ladder: Anchor[];
  fail_closed_rules: string[];
  settlement_preview: {
    holder_claimable: string;
    challenger_claimable: string;
    challenge_bond: string;
    stake_amount: string;
    vouch_total: string;
  };
}

export interface WalletInfo {
  kind: "burner" | "metamask";
  address: string;
}
