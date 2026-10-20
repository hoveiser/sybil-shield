import type { GuardRollback, PassportRecord } from "./types";

export interface GuardContext {
  passport: PassportRecord | null;
  fingerprints: string[];
  challengeOpen: boolean;
  onchain: Record<string, GuardRollback | undefined>;
}

export interface GuardResult {
  id: string;
  reverted: boolean;
  message: string;
  detail: string;
  rule: string;
  txHash?: string;
}

function lookup(ctx: GuardContext, step: string): string | undefined {
  return ctx.onchain[step]?.tx_hash;
}

export function probeSelfVouch(ctx: GuardContext): GuardResult {
  const holder = ctx.passport?.holder ?? "the passport holder";
  const amount = 10;
  const reverted = Boolean(ctx.passport);
  return {
    id: "self_vouch_revert",
    reverted,
    message: "[EXPECTED] self vouch is not allowed",
    detail: reverted
      ? "Applicant " + holder.slice(0, 10) + " attempted to lock " + amount + " SST as a vouch on their own passport. The contract compares gl.message.sender_address with the stored holder and reverts before any SST moves."
      : "No passport loaded, cannot evaluate the self vouch predicate.",
    rule: "vouch_for_passport requires sender != holder",
    txHash: lookup(ctx, "self_vouch_revert"),
  };
}

export function probeDuplicateFingerprint(ctx: GuardContext): GuardResult {
  const fingerprint = ctx.passport?.identity_fingerprint ?? "sha256:unknown";
  const exists = ctx.fingerprints.some(
    (item) => item.toLowerCase() === fingerprint.toLowerCase(),
  );
  return {
    id: "duplicate_fingerprint_revert",
    reverted: exists,
    message: "[EXPECTED] duplicate identity fingerprint",
    detail: exists
      ? "A second claim for " + fingerprint.slice(0, 24) + " was rejected. The fingerprint index maps one identity to exactly one passport, so a sybil cluster cannot recycle the same proof across wallets."
      : "The fingerprint index does not contain this identity, so a re-registration would not revert.",
    rule: "identity_fingerprint is unique across the passport registry",
    txHash: lookup(ctx, "duplicate_fingerprint_revert"),
  };
}

export function probePrematureExit(ctx: GuardContext): GuardResult {
  const reverted = Boolean(ctx.passport && (ctx.challengeOpen || ctx.passport.status === "CHALLENGED"));
  return {
    id: "premature_stake_exit_revert",
    reverted,
    message: "[EXPECTED] Stake vault locked: open sybil challenge pending",
    detail: reverted
      ? "The holder tried to withdraw " + (ctx.passport?.stake_amount ? "the locked stake" : "the stake") + " while a sybil challenge is open. Every maximum slash or reward liability stays inside vault custody until the round is finalized and claimed."
      : "There is no open challenge on this passport, so the withdrawal guard would not fire.",
    rule: "withdraw_unlocked_stake checks challenge_open before releasing stake",
    txHash: lookup(ctx, "premature_stake_exit_revert"),
  };
}

export function runAllGuards(ctx: GuardContext): GuardResult[] {
  return [probeSelfVouch(ctx), probeDuplicateFingerprint(ctx), probePrematureExit(ctx)];
}
