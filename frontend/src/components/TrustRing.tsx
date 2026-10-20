import { bandMeta } from "../lib/format";
import type { Band } from "../lib/types";

interface TrustRingProps {
  score: number;
  band: Band;
  size?: number;
  label?: string;
  compact?: boolean;
}

export function TrustRing({ score, band, size = 260, label = "TRUST", compact = false }: TrustRingProps) {
  const meta = bandMeta(band);
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 92;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;
  const ticks = Array.from({ length: 60 }, (_, index) => index);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 260 260" width={size} height={size} role="img" aria-label={`${meta.label} trust score ${clamped} of 100`}>
        <defs>
          <linearGradient id="trustArc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={meta.color} />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
          <radialGradient id="trustCore" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor={meta.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor="#08091A" stopOpacity="0" />
          </radialGradient>
          <filter id="trustGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx="130" cy="130" r="118" fill="url(#trustCore)" />
        <circle cx="130" cy="130" r="118" fill="none" stroke="#23264D" strokeWidth="1" />
        <circle cx="130" cy="130" r="104" fill="none" stroke="#23264D" strokeWidth="0.7" strokeDasharray="2 7" />
        <circle cx="130" cy="130" r="72" fill="none" stroke="#23264D" strokeWidth="0.7" />

        <g opacity="0.55">
          {ticks.map((tick) => {
            const angle = (tick / ticks.length) * Math.PI * 2 - Math.PI / 2;
            const inner = tick % 5 === 0 ? 108 : 112;
            const x1 = 130 + Math.cos(angle) * inner;
            const y1 = 130 + Math.sin(angle) * inner;
            const x2 = 130 + Math.cos(angle) * 117;
            const y2 = 130 + Math.sin(angle) * 117;
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={tick % 5 === 0 ? meta.color : "#3A3F73"}
                strokeWidth={tick % 5 === 0 ? 1.6 : 0.8}
                opacity={tick % 5 === 0 ? 0.8 : 0.45}
              />
            );
          })}
        </g>

        <circle
          cx="130"
          cy="130"
          r={radius}
          fill="none"
          stroke="#1B1E42"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle
          cx="130"
          cy="130"
          r={radius}
          fill="none"
          stroke="url(#trustArc)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 130 130)"
          filter="url(#trustGlow)"
        />
        <circle cx="130" cy="130" r="80" fill="#08091A" fillOpacity="0.55" stroke={meta.color} strokeOpacity="0.18" />

        <g className="animate-sweep" style={{ transformOrigin: "130px 130px" }}>
          <line x1="130" y1="130" x2="130" y2="26" stroke={meta.color} strokeWidth="1.2" opacity="0.4" />
          <line x1="130" y1="130" x2="152" y2="32" stroke={meta.color} strokeWidth="1" opacity="0.18" />
        </g>

        <text x="130" y="118" textAnchor="middle" fill="#9AA0C7" fontSize="9" letterSpacing="3">
          {label}
        </text>
        <text x="130" y="152" textAnchor="middle" fill="#F4F6FF" fontSize={compact ? "38" : "46"} fontWeight="700" fontFamily="Space Grotesk, sans-serif">
          {clamped}
        </text>
        <text x="130" y="170" textAnchor="middle" fill={meta.color} fontSize="8.5" letterSpacing="2.4">
          {meta.short}
        </text>
      </svg>
    </div>
  );
}
