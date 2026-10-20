import { Check, Copy, Flame, LogOut, ShieldAlert, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { shortAddress } from "../lib/format";
import type { WalletState } from "../lib/wallet";
import { burnerCreatedAt, truncatedKeyWarning } from "../lib/wallet";

interface WalletPanelProps {
  open: boolean;
  wallet: WalletState | null;
  burnerAddress: string;
  busy: boolean;
  message: string | null;
  onClose: () => void;
  onBurner: () => void;
  onMetaMask: () => void;
  onDisconnect: () => void;
  onFaucet: () => void;
}

export function WalletPanel({
  open,
  wallet,
  burnerAddress,
  busy,
  message,
  onClose,
  onBurner,
  onMetaMask,
  onDisconnect,
  onFaucet,
}: WalletPanelProps) {
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

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close wallet panel"
        className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="panel relative w-full max-w-md overflow-hidden p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="label">Wallet</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Choose a signer</h2>
          </div>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={onBurner}
            className={`w-full rounded-xl border p-4 text-left transition ${
              wallet?.kind === "burner"
                ? "border-cyan/50 bg-cyan/5"
                : "border-edge bg-white/[0.02] hover:border-cyan/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <Flame size={16} className="text-cyan" /> 1 click burner
              </span>
              {wallet?.kind === "burner" && <Check size={16} className="text-lime" />}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-white/50">
              Generates an ephemeral key in this browser and stores it in localStorage.
              {" "}
              {burnerAddress ? shortAddress(burnerAddress, 6) : "no key yet"}
            </p>
            {burnerCreatedAt() && <p className="mt-1 text-[10px] text-mist">created {burnerCreatedAt()}</p>}
          </button>

          <button
            type="button"
            onClick={onMetaMask}
            className={`w-full rounded-xl border p-4 text-left transition ${
              wallet?.kind === "metamask"
                ? "border-violet/50 bg-violet/5"
                : "border-edge bg-white/[0.02] hover:border-violet/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <Wallet size={16} className="text-violet" /> MetaMask
              </span>
              {wallet?.kind === "metamask" && <Check size={16} className="text-lime" />}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-white/50">
              Connects the injected provider and offers to add GenLayer Studio (chain 61999).
            </p>
          </button>
        </div>

        {wallet && (
          <div className="mt-4 rounded-xl border border-edge bg-panelAlt/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="label">Connected</p>
                <p className="mono mt-1 text-xs text-white/80">{wallet.address}</p>
              </div>
              <button
                type="button"
                onClick={() => copy(wallet.address)}
                className="rounded-lg border border-edge p-2 text-white/50 hover:text-cyan"
                aria-label="Copy wallet address"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={onFaucet} disabled={busy} className="btn-primary !py-2 text-xs">
                {busy ? "Sending..." : "Faucet 400 SST"}
              </button>
              <button type="button" onClick={onDisconnect} className="btn-ghost !py-2 text-xs">
                <LogOut size={13} /> Disconnect
              </button>
            </div>
            {wallet.kind === "burner" && (
              <p className="mt-2 text-[10px] leading-relaxed text-amber/80">
                A burner needs GEN for gas. Fund the address from a studionet faucet before sending writes.
              </p>
            )}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-xl border border-edge bg-ink/60 p-3">
            <p className="mono text-[11px] leading-relaxed text-white/60">{message}</p>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber/20 bg-amber/5 p-3">
          <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber" />
          <p className="text-[10px] leading-relaxed text-amber/80">{truncatedKeyWarning()}</p>
        </div>
      </div>
    </div>
  );
}
