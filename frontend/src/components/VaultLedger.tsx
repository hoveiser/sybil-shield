import { CheckCircle2, Coins, Lock, ShieldCheck, Vault } from "lucide-react";
import { percent, sstLabel } from "../lib/format";
import type { VaultState } from "../lib/types";

interface VaultLedgerProps {
  vault: VaultState;
}

export function VaultLedger({ vault }: VaultLedgerProps) {
  const total = Number(vault.vault_custody_balance) / 1e18;
  const rows = [
    { key: "reserve", label: "Protocol slash reserve", value: Number(vault.protocol_slash_reserve) / 1e18, color: "#A78BFA", icon: <Coins size={12} /> },
    { key: "stakes", label: "Locked applicant stakes", value: Number(vault.locked_stakes) / 1e18, color: "#22D3EE", icon: <Lock size={12} /> },
    { key: "vouches", label: "Locked voucher stakes", value: Number(vault.locked_vouches) / 1e18, color: "#38BDF8", icon: <ShieldCheck size={12} /> },
    { key: "bonds", label: "Open challenger bonds", value: Number(vault.locked_bonds) / 1e18, color: "#FBBF24", icon: <Vault size={12} /> },
    { key: "claims", label: "Finalized pending claims", value: Number(vault.pending_claims) / 1e18, color: "#A3E635", icon: <CheckCircle2 size={12} /> },
  ];

  return (
    <section className="panel p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="label">Vault custody</p>
          <h2 className="mt-1 text-lg font-semibold text-white">SST escrow accounting</h2>
        </div>
        <span className={`chip ${vault.vault_balanced ? "border-lime/30 bg-lime/10 text-lime" : "border-rose/30 bg-rose/10 text-rose"}`}>
          {vault.vault_balanced ? <CheckCircle2 size={12} /> : <Lock size={12} />}
          {vault.vault_balanced ? "balanced" : "drift"}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-edge/60 bg-ink/40 p-4">
        <p className="label">Vault custody balance</p>
        <p className="mono mt-1 text-3xl font-semibold text-white">{sstLabel(vault.vault_custody_balance)} <span className="text-sm text-cyan">SST</span></p>
        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full border border-edge/60 bg-ink">
          {rows.map((row) => (
            <div key={row.key} style={{ width: `${percent(row.value, total)}%`, background: row.color }} title={`${row.label}: ${row.value} SST`} />
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between rounded-lg border border-edge/40 bg-white/[0.012] px-3 py-2">
            <span className="flex items-center gap-2 text-[11px] text-white/55">
              <span style={{ color: row.color }}>{row.icon}</span>
              {row.label}
            </span>
            <span className="mono text-[11px] text-white/80">{sstLabel(row.value)} SST</span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-edge/60 bg-white/[0.015] p-3">
          <p className="label">Expected liabilities</p>
          <p className="mono mt-1 text-xs text-white/75">{sstLabel(vault.expected_liabilities)} SST</p>
        </div>
        <div className="rounded-lg border border-edge/60 bg-white/[0.015] p-3">
          <p className="label">Circulating supply</p>
          <p className="mono mt-1 text-xs text-white/75">{sstLabel(vault.circulating_supply)} SST</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-lime/20 bg-lime/5 px-3 py-2">
        <span className="text-[10px] text-lime">supply = circulating + vault</span>
        <span className="mono text-[10px] text-lime">
          {vault.supply_conserved ? "conserved" : "mismatch"} · {sstLabel(vault.total_minted)} minted
        </span>
      </div>
    </section>
  );
}
