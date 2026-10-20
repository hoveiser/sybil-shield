import { CheckCircle2, Fingerprint, FlaskConical, Play, ShieldAlert, Terminal, XCircle, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { explorerTx } from "../lib/genlayer";
import type { GuardResult } from "../lib/guards";
import { runAllGuards, type GuardContext } from "../lib/guards";
import { shortHash } from "../lib/format";
import type { GuardRollback, PassportRecord } from "../lib/types";
import { sound } from "../lib/sound";

interface GuardLabProps {
  passport: PassportRecord;
  fingerprints: string[];
  onchain: GuardRollback[];
}

const PROBE_META: Record<string, { title: string; subtitle: string; icon: LucideIcon }> = {
  self_vouch_revert: {
    title: "Self vouch revert",
    subtitle: "The applicant tries to stake a vouch on their own passport.",
    icon: ShieldAlert,
  },
  duplicate_fingerprint_revert: {
    title: "Duplicate fingerprint revert",
    subtitle: "A second wallet recycles an identity fingerprint that is already registered.",
    icon: Fingerprint,
  },
  premature_stake_exit_revert: {
    title: "Premature stake exit revert",
    subtitle: "The holder tries to withdraw while a sybil challenge bond is locked.",
    icon: XCircle,
  },
};

export function GuardLab({ passport, fingerprints, onchain }: GuardLabProps) {
  const [results, setResults] = useState<Record<string, GuardResult | undefined>>({});
  const [running, setRunning] = useState<string | null>(null);

  const context: GuardContext = {
    passport,
    fingerprints,
    challengeOpen: passport.challenge_open,
    onchain: Object.fromEntries(onchain.map((item) => [item.step, item])),
  };

  const execute = (id: string) => {
    if (running) return;
    setRunning(id);
    window.setTimeout(() => {
      const all = runAllGuards(context);
      const match = all.find((item) => item.id === id);
      if (match) {
        setResults((previous) => ({ ...previous, [id]: match }));
        if (match.reverted) sound.error();
        else sound.click();
      }
      setRunning(null);
    }, 420);
  };

  const runAll = () => {
    if (running) return;
    setRunning("all");
    window.setTimeout(() => {
      const all = runAllGuards(context);
      const next: Record<string, GuardResult | undefined> = {};
      for (const item of all) next[item.id] = item;
      setResults(next);
      sound.error();
      setRunning(null);
    }, 520);
  };

  const confirmed = Object.values(results).filter((item) => item?.reverted).length;

  return (
    <section id="guards" className="panel relative overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-amber/5 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label">Security guard lab</p>
          <h2 className="mt-1 text-xl font-semibold text-white">One click probes against the guard rails</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/50">
            Each probe runs the exact predicate the contract uses, against the live passport state. The result
            includes the real revert string and a link to the rollback transaction from the studionet run.
          </p>
        </div>
        <button type="button" onClick={runAll} disabled={Boolean(running)} className="btn-primary !py-2 text-xs">
          <FlaskConical size={14} /> {running === "all" ? "Running..." : "Run all probes"}
        </button>
      </div>

      <div className="relative mt-5 grid gap-3 md:grid-cols-3">
        {Object.entries(PROBE_META).map(([id, meta]) => {
          const Icon = meta.icon;
          const result = results[id];
          const busy = running === id || running === "all";
          return (
            <div key={id} className="flex flex-col rounded-xl border border-edge/70 bg-white/[0.015] p-4">
              <div className="flex items-start justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber/25 bg-amber/10 text-amber">
                  <Icon size={16} />
                </span>
                <span className="chip border-edge bg-white/[0.02] !text-[9px] text-mist">guard</span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-white">{meta.title}</h3>
              <p className="mt-1 flex-1 text-[11px] leading-relaxed text-white/45">{meta.subtitle}</p>
              <button
                type="button"
                onClick={() => execute(id)}
                disabled={Boolean(running)}
                className="btn-ghost mt-3 !py-2 text-[11px]"
              >
                <Play size={12} /> {busy ? "Probing..." : result ? "Run again" : "Run probe"}
              </button>

              {result && (
                <div className={`mt-3 rounded-lg border p-3 ${result.reverted ? "border-lime/25 bg-lime/5" : "border-rose/25 bg-rose/5"}`}>
                  <p className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${result.reverted ? "text-lime" : "text-rose"}`}>
                    {result.reverted ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {result.reverted ? "Revert confirmed" : "No revert"}
                  </p>
                  <p className="mono mt-1.5 text-[10px] leading-relaxed text-white/70">{result.message}</p>
                  <p className="mt-2 text-[10px] leading-relaxed text-white/40">{result.detail}</p>
                  {result.txHash && (
                    <a href={explorerTx(result.txHash)} target="_blank" rel="noreferrer" className="mono mt-2 block text-[9px] text-cyan/80 hover:underline">
                      onchain tx {shortHash(result.txHash, 8)}
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-edge/60 bg-ink/40 p-3">
        <span className="flex items-center gap-2 text-[10px] text-white/45">
          <Terminal size={12} className="text-cyan" />
          probes mirror the on-chain predicates, no transaction is sent from this page
        </span>
        <span className="mono text-[10px] text-white/50">{confirmed} / 3 revert conditions reproduced</span>
      </div>
    </section>
  );
}
