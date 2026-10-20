import { ShieldAlert, ShieldCheck } from "lucide-react";
import { bandMeta, shortAddress, sstLabel } from "../lib/format";
import type { PassportRecord } from "../lib/types";

interface TrustGraphProps {
  passport: PassportRecord;
}

interface VoucherNode {
  address: string;
  amount: number;
}

export function parseRegistry(registry: string): VoucherNode[] {
  if (!registry) return [];
  const nodes: VoucherNode[] = [];
  for (const chunk of registry.split(";")) {
    const [address, amount] = chunk.split("=");
    if (!address || !amount) continue;
    const numeric = Number(amount) / 1e18;
    if (!Number.isFinite(numeric)) continue;
    nodes.push({ address, amount: numeric });
  }
  return nodes;
}

export function TrustGraph({ passport }: TrustGraphProps) {
  const vouchers = parseRegistry(passport.voucher_registry);
  const meta = bandMeta(passport.trust_band);
  const centerX = 260;
  const centerY = 178;
  const radius = 132;

  const voucherNodes = vouchers.slice(0, 5).map((voucher, index) => {
    const angle = Math.PI * (0.9 + (index / Math.max(1, vouchers.length)) * 0.9);
    return {
      ...voucher,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * 86,
    };
  });

  const challengerX = centerX + radius + 6;
  const challengerY = centerY - 34;
  const evidenceX = centerX - radius - 8;
  const evidenceY = centerY - 42;

  return (
    <section className="panel relative overflow-hidden p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="label">Trust graph</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Who backs this passport</h2>
        </div>
        <span className="chip border-edge bg-white/[0.02] text-mist">{vouchers.length} vouchers</span>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-edge/60 bg-[#060714]">
        <svg viewBox="0 0 520 360" className="h-auto w-full" role="img" aria-label="Trust graph around the passport">
          <defs>
            <radialGradient id="graphGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={meta.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={meta.color} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.6" />
            </linearGradient>
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g opacity="0.55">
            {[42, 72, 102, 132].map((r) => (
              <circle key={r} cx={centerX} cy={centerY} r={r} fill="none" stroke="#23264D" strokeWidth="0.7" strokeDasharray={r === 132 ? "3 6" : undefined} />
            ))}
            <line x1={centerX - 170} y1={centerY} x2={centerX + 170} y2={centerY} stroke="#23264D" strokeWidth="0.5" strokeDasharray="2 8" />
            <line x1={centerX} y1={centerY - 130} x2={centerX} y2={centerY + 130} stroke="#23264D" strokeWidth="0.5" strokeDasharray="2 8" />
          </g>

          <circle cx={centerX} cy={centerY} r="120" fill="url(#graphGlow)" />

          <g className="animate-sweep" style={{ transformOrigin: `${centerX}px ${centerY}px` }}>
            <line x1={centerX} y1={centerY} x2={centerX} y2={centerY - 132} stroke={meta.color} strokeWidth="1.4" opacity="0.35" />
            <path d={`M ${centerX} ${centerY} L ${centerX + 42} ${centerY - 124}`} stroke={meta.color} strokeWidth="1" opacity="0.16" />
          </g>

          {voucherNodes.map((node, index) => (
            <g key={node.address + index}>
              <line x1={centerX} y1={centerY} x2={node.x} y2={node.y} stroke="url(#edgeGrad)" strokeWidth="1.4" strokeDasharray="4 4" className="animate-dash" />
              <circle cx={node.x} cy={node.y} r="15" fill="#0D0F27" stroke="#22D3EE" strokeWidth="1.2" opacity="0.9" />
              <text x={node.x} y={node.y + 3} textAnchor="middle" fill="#67E8F9" fontSize="8" fontFamily="JetBrains Mono, monospace">
                {node.amount.toFixed(0)}
              </text>
              <text x={node.x} y={node.y + 30} textAnchor="middle" fill="#9AA0C7" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
                {shortAddress(node.address, 3)}
              </text>
            </g>
          ))}

          {passport.voucher_registry === "" && (
            <text x={centerX - 170} y={centerY - 60} fill="#5B608F" fontSize="9" fontFamily="JetBrains Mono, monospace">
              no staked vouches yet
            </text>
          )}

          <g>
            <line x1={centerX} y1={centerY} x2={challengerX} y2={challengerY} stroke={passport.challenge_open ? "#FB7185" : "#2B2F5C"} strokeWidth="1.4" strokeDasharray="5 4" />
            <circle cx={challengerX} cy={challengerY} r="17" fill="#0D0F27" stroke={passport.challenge_open ? "#FB7185" : "#2B2F5C"} strokeWidth="1.2" />
            <text x={challengerX} y={challengerY + 3} textAnchor="middle" fill={passport.challenge_open ? "#FDA4AF" : "#5B608F"} fontSize="8" fontFamily="JetBrains Mono, monospace">
              {passport.challenge_open ? "BOND" : "n/a"}
            </text>
            <text x={challengerX} y={challengerY + 32} textAnchor="middle" fill="#9AA0C7" fontSize="7.5">
              challenger
            </text>
          </g>

          <g>
            <line x1={centerX} y1={centerY} x2={evidenceX} y2={evidenceY} stroke="#A78BFA" strokeWidth="1.2" strokeDasharray="3 5" opacity="0.6" />
            <circle cx={evidenceX} cy={evidenceY} r="17" fill="#0D0F27" stroke="#A78BFA" strokeWidth="1.2" />
            <text x={evidenceX} y={evidenceY + 3} textAnchor="middle" fill="#C4B5FD" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
              WEB
            </text>
            <text x={evidenceX} y={evidenceY + 32} textAnchor="middle" fill="#9AA0C7" fontSize="7.5">
              evidence
            </text>
          </g>

          <g filter="url(#nodeGlow)">
            <circle cx={centerX} cy={centerY} r="40" fill="#0A0C22" stroke={meta.color} strokeWidth="1.6" />
            <circle cx={centerX} cy={centerY} r="32" fill="none" stroke={meta.color} strokeWidth="0.8" opacity="0.4" strokeDasharray="2 4" />
            <text x={centerX} y={centerY - 4} textAnchor="middle" fill="#F4F6FF" fontSize="14" fontWeight="700" fontFamily="Space Grotesk, sans-serif">
              {passport.trust_score}
            </text>
            <text x={centerX} y={centerY + 12} textAnchor="middle" fill={meta.color} fontSize="7" letterSpacing="1.6">
              {meta.short}
            </text>
          </g>
          <text x={centerX} y={centerY + 58} textAnchor="middle" fill="#F4F6FF" fontSize="10" fontFamily="Space Grotesk, sans-serif">
            @{passport.handle}
          </text>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-edge/60 bg-white/[0.015] p-3">
          <p className="label">Staked vouch escrow</p>
          <p className="mono mt-1 text-sm text-cyan">{sstLabel(passport.vouch_total)} SST</p>
        </div>
        <div className="rounded-lg border border-edge/60 bg-white/[0.015] p-3">
          <p className="label">Challenger bond</p>
          <div className="mt-1 flex items-center gap-2">
            {passport.challenge_open ? (
              <ShieldAlert size={13} className="text-rose" />
            ) : (
              <ShieldCheck size={13} className="text-lime" />
            )}
            <p className="mono text-sm text-white/80">{sstLabel(passport.challenge_bond)} SST</p>
          </div>
        </div>
      </div>
    </section>
  );
}
