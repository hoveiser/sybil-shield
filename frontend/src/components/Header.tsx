import { Github, Menu, ShieldCheck, Volume2, VolumeX, Wallet, X } from "lucide-react";
import { useState } from "react";
import { shortAddress } from "../lib/format";
import type { WalletState } from "../lib/wallet";
import { Wordmark } from "./Logo";

interface HeaderProps {
  source: "live" | "cached";
  wallet: WalletState | null;
  soundOn: boolean;
  onOpenWallet: () => void;
  onToggleSound: () => void;
}

const LINKS = [
  { href: "#passport", label: "Passport" },
  { href: "#simulator", label: "Simulator" },
  { href: "#guards", label: "Guard lab" },
  { href: "#evidence", label: "Evidence" },
];

export function Header({ source, wallet, soundOn, onOpenWallet, onToggleSound }: HeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-edge/60 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="SybilShield home">
          <Wordmark />
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Sections">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-edge bg-panel px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-mist sm:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${source === "live" ? "bg-lime" : "bg-amber"} animate-pulseRing`} />
            studionet · 61999
          </span>

          <button
            type="button"
            onClick={onToggleSound}
            className="rounded-lg border border-edge bg-white/[0.02] p-2.5 text-white/60 transition hover:border-cyan/40 hover:text-cyan"
            aria-label={soundOn ? "Mute interface sound" : "Enable interface sound"}
            title={soundOn ? "Sound on" : "Sound off"}
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <a
            href="https://github.com/hoveiser/sybil-shield"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg border border-edge bg-white/[0.02] p-2.5 text-white/60 transition hover:border-cyan/40 hover:text-cyan sm:block"
            aria-label="Source repository"
          >
            <Github size={16} />
          </a>

          <button type="button" onClick={onOpenWallet} className="btn-ghost !px-3 !py-2 text-xs">
            {wallet ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                {shortAddress(wallet.address)}
              </>
            ) : (
              <>
                <Wallet size={14} /> Connect
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="rounded-lg border border-edge p-2.5 text-white/60 lg:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-edge/60 bg-ink px-4 py-3 lg:hidden">
          <div className="grid grid-cols-2 gap-2">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg border border-edge px-3 py-2 text-sm text-white/70"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-mist">
            <ShieldCheck size={14} className="text-cyan" />
            No owner key. Every badge decision needs validator consensus.
          </div>
        </div>
      )}
    </header>
  );
}
