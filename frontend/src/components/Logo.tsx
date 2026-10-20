export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="ssShieldStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <radialGradient id="ssShieldFill" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#101334" />
          <stop offset="100%" stopColor="#08091A" />
        </radialGradient>
      </defs>
      <path
        d="M32 3.5 57 13v20.5c0 13.6-10.3 23.6-25 27.9C17.3 57.1 7 47.1 7 33.5V13L32 3.5Z"
        fill="url(#ssShieldFill)"
        stroke="url(#ssShieldStroke)"
        strokeWidth="2.4"
      />
      <circle cx="32" cy="31" r="11.5" fill="none" stroke="#22D3EE" strokeWidth="1.6" opacity="0.85" />
      <circle cx="32" cy="31" r="16.5" fill="none" stroke="#A78BFA" strokeWidth="1" opacity="0.45" strokeDasharray="3 5" />
      <path d="M32 21.5v19" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M25.5 26.5c3.9-2.8 9.1-2.8 13 0" stroke="#67E8F9" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M24 33c4.6-3.6 11.4-3.6 16 0" stroke="#67E8F9" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M26.5 39.4c3.2-2 7.8-2 11 0" stroke="#A78BFA" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.85" />
      <circle cx="32" cy="21.5" r="1.8" fill="#22D3EE" />
      <circle cx="32" cy="40.5" r="1.8" fill="#A78BFA" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={compact ? 30 : 36} />
      <span className="leading-none">
        <span className="block text-[17px] font-bold tracking-tight text-white">
          Sybil<span className="text-cyan">Shield</span>
        </span>
        {!compact && (
          <span className="mt-1 block text-[9px] uppercase tracking-[0.28em] text-mist">
            Staked trust graph
          </span>
        )}
      </span>
    </span>
  );
}
