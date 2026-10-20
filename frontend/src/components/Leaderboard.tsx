import { ChevronRight, Crown, ShieldX } from "lucide-react";
import { bandMeta, sstLabel, statusTone } from "../lib/format";
import type { LeaderRow } from "../lib/types";

interface LeaderboardProps {
  rows: LeaderRow[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export function Leaderboard({ rows, selectedId, onSelect }: LeaderboardProps) {
  return (
    <section className="panel flex h-full flex-col p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="label">Leaderboard</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Ranked by the shared standing helper</h2>
        </div>
        <Crown size={18} className="text-amber/80" />
      </div>

      <div className="mt-4 flex-1 space-y-2">
        {rows.length === 0 && (
          <div className="rounded-xl border border-edge/60 bg-white/[0.015] p-4 text-xs text-white/50">
            No active passports returned by get_leaderboard.
          </div>
        )}
        {rows.map((row, index) => {
          const meta = bandMeta(row.trust_band);
          const selected = row.passport_id === selectedId;
          return (
            <button
              key={row.passport_id}
              type="button"
              onClick={() => onSelect(row.passport_id)}
              className={`w-full rounded-xl border p-3 text-left transition ${
                selected
                  ? "border-cyan/45 bg-cyan/[0.06]"
                  : "border-edge/60 bg-white/[0.012] hover:border-cyan/25 hover:bg-white/[0.03]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="mono w-6 shrink-0 text-center text-[11px] text-mist">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold"
                  style={{ borderColor: meta.color + "55", color: meta.color, background: meta.color + "12" }}
                >
                  {row.handle.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-white">@{row.handle}</span>
                    <span className="mono text-xs text-white/70">{row.trust_score}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className={`chip ${meta.chip} !px-2 !py-0.5 !text-[9px]`}>{meta.short}</span>
                    <span className={`text-[9px] uppercase tracking-[0.14em] ${statusTone(row.status)}`}>{row.status}</span>
                  </span>
                  <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-edge/60">
                    <span
                      className="block h-full rounded-full transition-all duration-500"
                      style={{ width: `${row.trust_score}%`, background: `linear-gradient(90deg, ${meta.color}, #A78BFA)` }}
                    />
                  </span>
                </span>
                <ChevronRight size={14} className={selected ? "text-cyan" : "text-white/20"} />
              </div>
              <div className="mt-2 flex items-center justify-between pl-9 text-[10px] text-mist">
                <span className="mono">stake {sstLabel(row.stake_amount)} SST</span>
                <span className="mono">vouch {sstLabel(row.vouch_total)} SST</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-edge/50 bg-white/[0.015] p-2.5">
        <ShieldX size={12} className="mt-0.5 shrink-0 text-rose/70" />
        <p className="text-[10px] leading-relaxed text-white/40">
          Slashed passports are excluded by the contract view. Ranking, sybil gating and payouts all read the same
          _compute_trust_standing helper.
        </p>
      </div>
    </section>
  );
}
