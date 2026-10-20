import {
  ArrowLeftRight,
  ArrowDownToLine,
  Coins,
  Droplets,
  FilePlus2,
  ScanEye,
  ShieldX,
  Swords,
  Undo2,
  Users,
} from "lucide-react";
import { shortAddress } from "../lib/format";
import type { ActivityEntry } from "../lib/types";

const ICONS: Record<string, typeof Coins> = {
  REGISTER: FilePlus2,
  VOUCH: Users,
  VOUCH_RECLAIM: Undo2,
  CHALLENGE: Swords,
  VERIFY: ScanEye,
  SLASH: ShieldX,
  CLAIM: Coins,
  TRANSFER: ArrowLeftRight,
  FAUCET: Droplets,
  WITHDRAW: ArrowDownToLine,
};

const TONES: Record<string, string> = {
  REGISTER: "text-cyan",
  VOUCH: "text-violet",
  VOUCH_RECLAIM: "text-mist",
  CHALLENGE: "text-amber",
  VERIFY: "text-lime",
  SLASH: "text-rose",
  CLAIM: "text-lime",
  TRANSFER: "text-cyan",
  FAUCET: "text-mist",
  WITHDRAW: "text-amber",
};

export function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  return (
    <section className="panel flex h-full flex-col p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="label">Activity</p>
          <h2 className="mt-1 text-lg font-semibold text-white">On chain event log</h2>
        </div>
        <span className="chip border-edge bg-white/[0.02] text-mist">{entries.length} events</span>
      </div>

      <div className="mt-4 max-h-[320px] flex-1 space-y-2 overflow-y-auto pr-1">
        {entries.length === 0 && (
          <p className="rounded-xl border border-edge/60 bg-white/[0.015] p-4 text-xs text-white/45">
            No activity rows returned by get_activity.
          </p>
        )}
        {entries.map((entry) => {
          const Icon = ICONS[entry.action] ?? Coins;
          const tone = TONES[entry.action] ?? "text-cyan";
          return (
            <div key={entry.seq} className="flex items-start gap-3 rounded-lg border border-edge/40 bg-white/[0.012] px-3 py-2">
              <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-edge/60 bg-ink/60 ${tone}`}>
                <Icon size={12} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-white/80">{entry.action.replace("_", " ")}</span>
                  <span className="mono text-[9px] text-mist">#{entry.seq}</span>
                </div>
                <p className="truncate text-[10px] text-white/45">{entry.detail}</p>
                <p className="mono text-[9px] text-mist/80">{shortAddress(entry.actor, 4)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
