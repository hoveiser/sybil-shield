import { Check, Copy, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { bandMeta, shortHash } from "../lib/format";
import type { Config, ConsensusRun, PassportRecord, PromptPreview } from "../lib/types";

interface DrawerProps {
  open: boolean;
  passport: PassportRecord;
  config: Config;
  preview: PromptPreview | null;
  loading: boolean;
  runs: ConsensusRun[];
  transactions: { step: string; tx_hash: string }[];
  onClose: () => void;
}

const TABS = ["Prompt", "Principle", "Fail closed", "Live runs"] as const;
type Tab = (typeof TABS)[number];

export function ConsensusDrawer({ open, passport, config, preview, loading, runs, transactions, onClose }: DrawerProps) {
  const [tab, setTab] = useState<Tab>("Prompt");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const prompt =
    preview?.prompt ??
    "The live prompt preview is loading from preview_consensus_prompt(" + passport.passport_id + ").";
  const principle = preview?.principle ?? config.consensus_principle;
  const rules = preview?.fail_closed_rules ?? [
    "malformed model JSON downgrades to anchor 40 and grants nothing",
    "prompt injection markers cap the anchor at 40",
    "missing fingerprint binding caps the anchor at 40",
    "a page that never mentions the claim slashes at anchor 0",
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tab === "Prompt" ? prompt : principle);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close inspector" className="absolute inset-0 bg-ink/75 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-2xl flex-col border-l border-edge bg-panel shadow-2xl">
        <div className="flex items-start justify-between border-b border-edge/70 p-5">
          <div>
            <p className="label">Consensus & prompt inspector</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Passport #{passport.passport_id} · @{passport.handle}</h2>
            <p className="mono mt-1 text-[10px] text-mist">anchor {passport.authenticity_anchor} · {passport.trust_band}</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 border-b border-edge/70 px-3 pt-3">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`rounded-t-lg px-3 py-2 text-xs transition ${
                tab === item ? "bg-ink text-cyan" : "text-white/45 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-edge bg-ink/50 px-3 py-2 text-[11px] text-mist">
              <Loader2 size={13} className="animate-spin text-cyan" /> reading preview_consensus_prompt
            </div>
          )}

          {tab === "Prompt" && (
            <div>
              <div className="flex items-center justify-between">
                <p className="label">Evidence prompt</p>
                <button type="button" onClick={copy} className="btn-ghost !px-2.5 !py-1.5 text-[10px]">
                  {copied ? <Check size={12} /> : <Copy size={12} />} copy
                </button>
              </div>
              <pre className="terminal mt-2 max-h-[52vh] overflow-auto whitespace-pre-wrap">{prompt}</pre>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-edge/60 bg-white/[0.015] p-3">
                  <p className="label">Proof URL</p>
                  <p className="mono mt-1 truncate text-[10px] text-cyan">{preview?.proof_url ?? passport.proof_url}</p>
                </div>
                <div className="rounded-lg border border-edge/60 bg-white/[0.015] p-3">
                  <p className="label">Fraud evidence</p>
                  <p className="mono mt-1 truncate text-[10px] text-violet">
                    {preview?.fraud_evidence_url ?? (passport.challenge_open ? passport.fraud_evidence_url : "none")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {tab === "Principle" && (
            <div>
              <p className="label">Equivalence principle</p>
              <pre className="terminal mt-2 whitespace-pre-wrap">{principle}</pre>
              <div className="mt-4 space-y-2">
                {["trust_band", "authenticity_anchor", "fingerprint_matched"].map((field) => (
                  <div key={field} className="flex items-center gap-2 rounded-lg border border-edge/60 bg-white/[0.015] px-3 py-2">
                    <ShieldCheck size={13} className="text-lime" />
                    <span className="mono text-[11px] text-white/70">{field}</span>
                    <span className="ml-auto text-[10px] uppercase tracking-[0.14em] text-lime">exact agreement</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-white/45">
                prompt_comparative reruns the evidence evaluation on every validator. The leader cannot pass a band
                alone: a disagreement on any of the three fields fails equivalence and forces another rotation.
              </p>
            </div>
          )}

          {tab === "Fail closed" && (
            <div>
              <p className="label">Fail closed branches</p>
              <div className="mt-2 space-y-2">
                {rules.map((rule) => (
                  <div key={rule} className="rounded-lg border border-amber/20 bg-amber/5 px-3 py-2 text-[11px] leading-relaxed text-amber/80">
                    {rule}
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-edge/60 bg-white/[0.015] p-3">
                <p className="label">Anchor ladder</p>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[0, 40, 75, 100].map((anchor) => {
                    const band = anchor >= 100 ? "DIAMOND_HUMAN" : anchor >= 75 ? "VERIFIED_CONTRIBUTOR" : anchor >= 40 ? "UNVERIFIED_PROVISIONAL" : "SYBIL_FRAUD_SLASH";
                    const meta = bandMeta(band);
                    return (
                      <div key={anchor} className="rounded-lg border border-edge/60 p-2 text-center">
                        <p className="text-base font-bold" style={{ color: meta.color }}>{anchor}</p>
                        <p className="mt-0.5 text-[8px] uppercase tracking-[0.08em] text-white/40">{meta.short}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "Live runs" && (
            <div>
              <p className="label">Live consensus runs</p>
              <div className="mt-2 space-y-2">
                {runs.map((run) => {
                  const meta = bandMeta(run.band);
                  const tx = transactions.find((item) => item.step === "verify_" + run.passport.toLowerCase().split(" ")[0]);
                  return (
                    <div key={run.passport} className="rounded-xl border border-edge/60 bg-white/[0.015] p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{run.passport}</p>
                        <span className={`chip ${meta.chip}`}>{meta.short}</span>
                      </div>
                      <p className="mono mt-1 text-[10px] text-white/45">
                        anchor {run.anchor} · matched {String(run.fingerprint_matched)} · {run.status}
                      </p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-white/55">{run.note}</p>
                      <p className="mono mt-1.5 text-[9px] text-mist">tx {tx ? shortHash(tx.tx_hash, 8) : "see evidence"}</p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-white/40">
                These are the finalized studionet runs. Each one returned MAJORITY_AGREE and a FINISHED_WITH_RETURN
                execution result before the state change was written.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
