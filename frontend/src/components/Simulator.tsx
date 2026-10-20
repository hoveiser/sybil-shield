import { AlertTriangle, ArrowRight, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { bandMeta, percent, sstLabel } from "../lib/format";
import { simulate } from "../lib/simulator";
import type { Anchor, PassportRecord, VaultState } from "../lib/types";
import { sound } from "../lib/sound";
import { TrustRing } from "./TrustRing";

interface SimulatorProps {
  passport: PassportRecord;
  vault: VaultState;
}

const ANCHORS: { value: Anchor; label: string; hint: string }[] = [
  { value: 0, label: "0", hint: "Fraud" },
  { value: 40, label: "40", hint: "Provisional" },
  { value: 75, label: "75", hint: "Verified" },
  { value: 100, label: "100", hint: "Diamond" },
];

export function Simulator({ passport, vault }: SimulatorProps) {
  const liveStake = Number(passport.stake_amount) / 1e18 || 50;
  const liveVouch = Number(passport.vouch_total) / 1e18 || 0;
  const liveBond = Number(passport.challenge_bond) / 1e18 || liveStake;
  const liveReserve = Number(vault.protocol_slash_reserve) / 1e18 || 600;

  const [stake, setStake] = useState(liveStake);
  const [vouches, setVouches] = useState(liveVouch);
  const [bond, setBond] = useState(liveBond);
  const [challenged, setChallenged] = useState(passport.challenge_open || passport.status === "CHALLENGED");
  const [anchor, setAnchor] = useState<Anchor>((passport.authenticity_anchor as Anchor) || 100);
  const [reserve, setReserve] = useState(liveReserve);

  const result = useMemo(
    () => simulate({ stake, vouches, bond, challenged, anchor, reserve }),
    [stake, vouches, bond, challenged, anchor, reserve],
  );

  const meta = bandMeta(result.band);
  const total = Math.max(0.0001, result.vaultAfter);
  const segments = [
    { key: "reserve", label: "Protocol reserve", value: result.reserveAfter, color: "#A78BFA" },
    { key: "stake", label: "Locked stake", value: result.lockedStake, color: "#22D3EE" },
    { key: "vouch", label: "Vouch escrow", value: result.lockedVouches, color: "#38BDF8" },
    { key: "bond", label: "Challenger bond", value: result.lockedBond, color: "#FBBF24" },
    { key: "pending", label: "Pending claims", value: result.pendingClaims, color: "#A3E635" },
  ];

  const reset = () => {
    setStake(liveStake);
    setVouches(liveVouch);
    setBond(liveBond);
    setChallenged(passport.challenge_open || passport.status === "CHALLENGED");
    setAnchor((passport.authenticity_anchor as Anchor) || 100);
    setReserve(liveReserve);
    sound.click();
  };

  return (
    <section id="simulator" className="panel relative overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-violet/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label">What if simulator</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Trust graph and slashing console</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/50">
            Drag the economics and the consensus anchor. The math below mirrors the contract byte for byte:
            the same vouch bonus, the same reward basis points and the same vault settlement branches.
          </p>
        </div>
        <button type="button" onClick={reset} className="btn-ghost !py-2 text-xs">
          <RotateCcw size={13} /> Reset to live state
        </button>
      </div>

      <div className="relative mt-6 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-4">
          <Slider
            label="Applicant stake"
            value={stake}
            min={25}
            max={500}
            step={5}
            suffix="SST"
            onChange={setStake}
            hint="Debited from the applicant balance and locked in vault custody."
          />
          <Slider
            label="Peer vouch stakes"
            value={vouches}
            min={0}
            max={200}
            step={5}
            suffix="SST"
            onChange={setVouches}
            hint="Real SST from distinct vouchers. Adds up to 15 trust points."
          />
          <div className="rounded-xl border border-edge/60 bg-white/[0.015] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label">Challenger bond</p>
                <p className="mt-1 text-[10px] text-white/40">A challenge must equal the applicant stake.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setChallenged((value) => !value);
                  sound.click();
                }}
                className={`relative h-6 w-11 rounded-full border transition ${
                  challenged ? "border-rose/40 bg-rose/20" : "border-edge bg-edge/40"
                }`}
                aria-pressed={challenged}
                aria-label="Toggle sybil challenge"
              >
                <span
                  className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${
                    challenged ? "left-[22px] bg-rose" : "left-0.5 bg-white/50"
                  }`}
                  style={{ height: 18, width: 18 }}
                />
              </button>
            </div>
            <input
              type="range"
              min={stake}
              max={500}
              step={5}
              value={Math.max(stake, bond)}
              onChange={(event) => setBond(Number(event.target.value))}
              className="mt-3 w-full accent-rose"
              aria-label="Challenger bond"
            />
            <div className="mt-2 flex items-center justify-between text-[10px] text-mist">
              <span className="mono">{sstLabel(stake)} SST minimum</span>
              <span className="mono text-rose">{sstLabel(challenged ? Math.max(stake, bond) : 0)} SST locked</span>
            </div>
          </div>

          <div>
            <p className="label">Consensus anchor</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {ANCHORS.map((item) => {
                const active = anchor === item.value;
                const itemMeta = bandMeta(
                  item.value >= 100
                    ? "DIAMOND_HUMAN"
                    : item.value >= 75
                      ? "VERIFIED_CONTRIBUTOR"
                      : item.value >= 40
                        ? "UNVERIFIED_PROVISIONAL"
                        : "SYBIL_FRAUD_SLASH",
                );
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setAnchor(item.value);
                      sound.click();
                    }}
                    className={`rounded-xl border px-2 py-3 text-center transition ${
                      active ? "bg-white/[0.04]" : "border-edge/60 bg-white/[0.012] hover:border-white/20"
                    }`}
                    style={active ? { borderColor: itemMeta.color, boxShadow: `0 0 24px ${itemMeta.color}22` } : undefined}
                  >
                    <span className="block text-lg font-bold" style={{ color: itemMeta.color }}>
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[9px] uppercase tracking-[0.1em] text-white/45">{item.hint}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-white/40">
              The anchor only moves when validators independently read the same evidence and agree on
              trust_band, authenticity_anchor and fingerprint_matched.
            </p>
          </div>

          <Slider
            label="Protocol slash reserve"
            value={reserve}
            min={0}
            max={1500}
            step={10}
            suffix="SST"
            onChange={setReserve}
            hint="Rewards are paid only from slashed fraud, never minted for a verification."
          />
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border p-4" style={{ borderColor: meta.color + "44", background: meta.color + "08" }}>
            <div className="flex items-center gap-4">
              <TrustRing score={result.score} band={result.band} size={132} compact label="SCORE" />
              <div className="min-w-0">
                <p className="label">Projected outcome</p>
                <p className="mt-1 text-lg font-semibold" style={{ color: meta.color }}>
                  {meta.label}
                </p>
                <p className="mono mt-1 text-[11px] text-white/50">
                  status {result.status} · anchor {result.base}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-white/55">{result.outcome}</p>
              </div>
            </div>
            <div className="mono mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-edge/50 bg-ink/40 px-3 py-2 text-[10px] text-white/50">
              <span>{result.base} base</span>
              <span className="text-lime">+{result.vouchBonus} vouch</span>
              <span className="text-rose">-{result.penalty} false challenge</span>
              <ArrowRight size={11} />
              <span className="text-white">{result.score} score</span>
            </div>
          </div>

          <div className="rounded-2xl border border-edge/70 bg-white/[0.015] p-4">
            <div className="flex items-center justify-between">
              <p className="label">Vault distribution</p>
              <span className="mono text-[10px] text-white/40">{sstLabel(result.vaultAfter)} SST</span>
            </div>
            <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full border border-edge/60 bg-ink">
              {segments.map((segment) => (
                <div
                  key={segment.key}
                  title={`${segment.label}: ${sstLabel(segment.value)} SST`}
                  style={{ width: `${percent(segment.value, total)}%`, background: segment.color }}
                  className="h-full transition-all duration-500"
                />
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {segments.map((segment) => (
                <div key={segment.key} className="flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-2 text-white/50">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: segment.color }} />
                    {segment.label}
                  </span>
                  <span className="mono text-white/75">{sstLabel(segment.value)} SST</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-lime/20 bg-lime/5 px-2.5 py-2">
              <span className="flex items-center gap-1.5 text-[10px] text-lime">
                <ShieldCheck size={11} /> custody invariant
              </span>
              <span className="mono text-[10px] text-lime">
                {sstLabel(result.vaultAfter)} = {sstLabel(result.reserveAfter + result.lockedStake + result.lockedVouches + result.lockedBond + result.pendingClaims)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Payout label="Holder claim" value={result.holderPayout} tone="text-cyan" />
            <Payout label="Challenger claim" value={result.challengerPayout} tone="text-violet" />
            <Payout label="Reward drawn" value={result.reward} tone="text-lime" />
            <Payout label="Reserve after" value={result.reserveAfter} tone="text-amber" />
          </div>
        </div>
      </div>

      <div className="relative mt-5 flex items-start gap-2 rounded-xl border border-edge/60 bg-ink/40 p-3">
        <Sparkles size={13} className="mt-0.5 shrink-0 text-cyan" />
        <p className="text-[10px] leading-relaxed text-white/45">
          The simulator is a deterministic mirror for exploring outcomes. It never writes to the contract.
          The live decisions are recorded in the evidence table with their transaction hashes.
        </p>
      </div>

      {anchor === 0 && (
        <div className="relative mt-3 flex items-start gap-2 rounded-xl border border-rose/25 bg-rose/5 p-3">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-rose" />
          <p className="text-[10px] leading-relaxed text-rose/80">
            Anchor 0 is a slash. The applicant stake and every complicit voucher stake leave vault custody
            only after the settlement is finalized and claimed.
          </p>
        </div>
      )}
    </section>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  hint: string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, suffix, hint, onChange }: SliderProps) {
  return (
    <div className="rounded-xl border border-edge/60 bg-white/[0.015] p-4">
      <div className="flex items-baseline justify-between">
        <p className="label">{label}</p>
        <p className="mono text-sm text-white/80">
          {value.toLocaleString("en-US")} <span className="text-[10px] text-mist">{suffix}</span>
        </p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-3 w-full accent-cyan"
        aria-label={label}
      />
      <div className="mt-2 flex items-center justify-between text-[10px] text-mist">
        <span>{hint}</span>
        <span className="mono">
          {min} - {max}
        </span>
      </div>
    </div>
  );
}

function Payout({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-edge/60 bg-white/[0.015] p-3">
      <p className="label">{label}</p>
      <p className={`mono mt-1 text-sm ${tone}`}>{sstLabel(value)} SST</p>
    </div>
  );
}
