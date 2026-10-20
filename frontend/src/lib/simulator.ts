import { BANDS } from "./format";
import type { Band } from "./types";

const ATTO = 1e18;
const BASE_REWARD = 12;
const SCORE_CAP = 100;

export interface SimInput {
  stake: number;
  vouches: number;
  bond: number;
  challenged: boolean;
  anchor: 0 | 40 | 75 | 100;
  reserve: number;
}

export interface SimResult {
  band: Band;
  badge: string;
  score: number;
  base: number;
  vouchBonus: number;
  penalty: number;
  reward: number;
  rewardBps: number;
  status: string;
  outcome: string;
  holderPayout: number;
  challengerPayout: number;
  lockedStake: number;
  lockedVouches: number;
  lockedBond: number;
  pendingClaims: number;
  reserveAfter: number;
  vaultBefore: number;
  vaultAfter: number;
  settled: boolean;
}

export function trustScore(anchor: number, vouches: number, falseChallenge: boolean): number {
  const bonus = Math.min(15, Math.floor((vouches * 25) / 100));
  const penalty = falseChallenge ? 5 : 0;
  return Math.max(0, Math.min(SCORE_CAP, anchor + bonus - penalty));
}

export function simulate(input: SimInput): SimResult {
  const band = bandFor(input.anchor);
  const bonus = Math.min(15, Math.floor((input.vouches * 25) / 100));
  const active = input.anchor >= 75;
  const slashed = input.anchor === 0;
  const falseChallenge = input.challenged && active;
  const penalty = falseChallenge ? 5 : 0;
  const score = slashed ? 0 : Math.max(0, Math.min(SCORE_CAP, input.anchor + bonus - penalty));
  const rewardBps = input.anchor === 100 ? 10000 : input.anchor === 75 ? 6000 : 0;
  const reward = Math.min((BASE_REWARD * rewardBps) / 10000, Math.max(0, input.reserve));

  const vaultBefore =
    input.reserve +
    input.stake +
    input.vouches +
    (input.challenged ? input.bond : 0);

  let holderPayout = 0;
  let challengerPayout = 0;
  let lockedStake = input.stake;
  let lockedVouches = input.vouches;
  let lockedBond = input.challenged ? input.bond : 0;
  let reserveAfter = input.reserve;
  let status = "PROVISIONAL";
  let outcome = "Awaiting a live consensus round";
  let settled = false;

  if (active) {
    status = "ACTIVE";
    settled = true;
    lockedStake = 0;
    lockedBond = 0;
    holderPayout = input.stake + (input.challenged ? input.bond : 0) + reward;
    reserveAfter = input.reserve - reward;
    outcome = falseChallenge
      ? "Verified. The false challenger bond is slashed to the passport holder."
      : "Verified. Stake and reward unlock from vault custody.";
  } else if (input.anchor === 40) {
    status = "UNVERIFIED_PROVISIONAL";
    challengerPayout = input.challenged ? input.bond : 0;
    lockedBond = 0;
    outcome = input.challenged
      ? "Inconclusive. The challenger bond is returned and the stake stays locked."
      : "Fail closed. No badge is granted and the stake stays locked.";
  } else {
    status = "SLASHED";
    settled = true;
    lockedStake = 0;
    lockedVouches = 0;
    lockedBond = 0;
    if (input.challenged) {
      challengerPayout = input.stake + input.vouches + input.bond;
      outcome = "Sybil confirmed. Stake, voucher stake and the challenger bond settle to the challenger.";
    } else {
      reserveAfter = input.reserve + input.stake + input.vouches;
      outcome = "Fabricated evidence. The stake and voucher stake are slashed into the protocol reserve.";
    }
  }

  const pendingClaims = holderPayout + challengerPayout;
  const vaultAfter = reserveAfter + lockedStake + lockedVouches + lockedBond + pendingClaims;

  return {
    band,
    badge: BANDS[band].label,
    score,
    base: input.anchor,
    vouchBonus: bonus,
    penalty,
    reward,
    rewardBps,
    status,
    outcome,
    holderPayout,
    challengerPayout,
    lockedStake,
    lockedVouches,
    lockedBond,
    pendingClaims,
    reserveAfter,
    vaultBefore,
    vaultAfter,
    settled,
  };
}

export function bandFor(anchor: number): Band {
  if (anchor >= 100) return "DIAMOND_HUMAN";
  if (anchor >= 75) return "VERIFIED_CONTRIBUTOR";
  if (anchor >= 40) return "UNVERIFIED_PROVISIONAL";
  return "SYBIL_FRAUD_SLASH";
}

export function anchorLabel(anchor: number): string {
  switch (anchor) {
    case 100:
      return "Diamond Human";
    case 75:
      return "Verified Contributor";
    case 40:
      return "Unverified Provisional";
    default:
      return "Sybil Fraud Slash";
  }
}

export function sstToAtto(value: number): bigint {
  return BigInt(Math.round(value * ATTO));
}
