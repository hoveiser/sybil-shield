import type { Band } from "./types";

const ATTO_NUMBER = 1e18;

export function toSst(value: string | number | bigint | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "bigint") return Number(value) / ATTO_NUMBER;
  if (typeof value === "number") return value;
  if (value.includes(".")) return Number(value);
  try {
    return Number(BigInt(value)) / ATTO_NUMBER;
  } catch {
    return Number(value);
  }
}

export function sstLabel(value: string | number | bigint | undefined, digits = 2): string {
  const numeric = toSst(value);
  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function fromSst(value: number): bigint {
  return BigInt(Math.round(value * ATTO_NUMBER));
}

export function shortAddress(value: string | undefined, size = 4): string {
  if (!value) return "0x0000";
  if (value.length <= 2 + size * 2) return value;
  return value.slice(0, 2 + size) + "..." + value.slice(-size);
}

export function shortHash(value: string | undefined, size = 6): string {
  return shortAddress(value, size);
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (part / total) * 100));
}

export function formatTime(iso: string | undefined): string {
  if (!iso) return "unknown";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export interface BandMeta {
  label: string;
  short: string;
  color: string;
  ring: string;
  text: string;
  chip: string;
  glow: string;
  anchor: number;
}

export const BANDS: Record<Band, BandMeta> = {
  DIAMOND_HUMAN: {
    label: "Diamond Human",
    short: "DIAMOND",
    color: "#22D3EE",
    ring: "#67E8F9",
    text: "text-cyan",
    chip: "bg-cyan/10 text-cyan border-cyan/30",
    glow: "shadow-halo",
    anchor: 100,
  },
  VERIFIED_CONTRIBUTOR: {
    label: "Verified Contributor",
    short: "VERIFIED",
    color: "#A78BFA",
    ring: "#C4B5FD",
    text: "text-violet",
    chip: "bg-violet/10 text-violet border-violet/30",
    glow: "shadow-violet",
    anchor: 75,
  },
  UNVERIFIED_PROVISIONAL: {
    label: "Unverified Provisional",
    short: "PROVISIONAL",
    color: "#FBBF24",
    ring: "#FCD34D",
    text: "text-amber",
    chip: "bg-amber/10 text-amber border-amber/30",
    glow: "",
    anchor: 40,
  },
  SYBIL_FRAUD_SLASH: {
    label: "Sybil Fraud Slash",
    short: "SLASHED",
    color: "#FB7185",
    ring: "#FDA4AF",
    text: "text-rose",
    chip: "bg-rose/10 text-rose border-rose/30",
    glow: "",
    anchor: 0,
  },
};

export function bandMeta(band: Band | string | undefined): BandMeta {
  if (band && band in BANDS) return BANDS[band as Band];
  return BANDS.UNVERIFIED_PROVISIONAL;
}

export function statusTone(status: string | undefined): string {
  switch (status) {
    case "ACTIVE":
      return "text-lime";
    case "CHALLENGED":
      return "text-amber";
    case "SLASHED":
      return "text-rose";
    case "WITHDRAWN":
      return "text-mist";
    default:
      return "text-cyan";
  }
}
