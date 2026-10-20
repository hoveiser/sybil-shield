import type { ReactNode } from "react";
import { ArrowUpRight, Fingerprint, Link2, ShieldCheck, ShieldX, Users } from "lucide-react";
import { bandMeta, shortAddress, sstLabel, statusTone } from "../lib/format";
import type { LeaderRow, PassportRecord } from "../lib/types";
import { TrustRing } from "./TrustRing";

interface PassportCardProps {
  passport: PassportRecord;
  row?: LeaderRow;
  source: "live" | "cached";
}

export function PassportCard({ passport, row, source }: PassportCardProps) {
  const band = row?.trust_band ?? passport.trust_band;
  const score = row?.trust_score ?? passport.trust_score;
  const status = row?.status ?? passport.status;
  const meta = bandMeta(band);
  const verified = status === "ACTIVE";

  return (
    <section id="passport" className="panel noise relative overflow-hidden p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-violet/10 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="label">Credential passport</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Passport #{String(passport.passport_id).padStart(2, "0")}</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`chip ${meta.chip}`}>
            {verified ? <ShieldCheck size={12} /> : <ShieldX size={12} />}
            {meta.label}
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-mist">
            {source === "live" ? "live studionet" : "cached snapshot"}
          </span>
        </div>
      </div>

      <div className="relative mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="shrink-0 animate-float">
          <TrustRing score={score} band={band} size={216} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-2xl font-bold text-white">@{passport.handle}</h3>
            <span className="chip border-edge bg-white/[0.02] text-mist">{passport.domain_category}</span>
            <span className={`text-xs font-semibold uppercase tracking-[0.16em] ${statusTone(status)}`}>{status}</span>
          </div>

          <p className="mono mt-2 flex items-center gap-2 truncate text-[11px] text-white/45">
            <Fingerprint size={12} className="shrink-0 text-cyan/70" />
            {passport.identity_fingerprint}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Stake" value={`${sstLabel(passport.stake_amount)} SST`} />
            <Metric label="Vouches" value={`${sstLabel(passport.vouch_total)} SST`} icon={<Users size={11} />} />
            <Metric label="Anchor" value={`${passport.authenticity_anchor} / 100`} />
            <Metric label="Rounds" value={String(passport.verification_rounds)} />
          </div>

          <div className="mt-4 rounded-xl border border-edge/70 bg-ink/40 p-3">
            <p className="label">Validator note</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">{passport.verification_note}</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a href={passport.proof_url} target="_blank" rel="noreferrer" className="link inline-flex items-center gap-1 text-[11px]">
              <Link2 size={12} /> proof page <ArrowUpRight size={11} />
            </a>
            <span className="mono text-[10px] text-mist">
              digest {passport.evidence_digest ? passport.evidence_digest.slice(0, 18) : "pending"}
            </span>
            <span className="mono text-[10px] text-mist">holder {shortAddress(passport.holder)}</span>
          </div>
        </div>
      </div>

      <div className="relative mt-6 grid gap-2 sm:grid-cols-3">
        <Signal
          ok={passport.fingerprint_matched}
          title="Fingerprint binding"
          detail={passport.fingerprint_matched ? "Live page binds the claimed fingerprint" : "Not bound, trust withheld"}
        />
        <Signal
          ok={Boolean(passport.sybil_resistant)}
          title="Sybil resistance"
          detail={passport.sybil_resistant ? "Eligible for bounty and gating" : "Not gated as a verified human"}
        />
        <Signal
          ok={!passport.challenge_open}
          title="Challenge window"
          detail={passport.challenge_open ? "Open challenge, stake stays locked" : "No open challenge"}
        />
      </div>
    </section>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="rounded-lg border border-edge/60 bg-white/[0.015] px-2.5 py-2">
      <p className="label flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="mono mt-1 truncate text-sm font-medium text-white/85">{value}</p>
    </div>
  );
}

function Signal({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <div className="rounded-xl border border-edge/60 bg-white/[0.015] p-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-5 w-5 items-center justify-center rounded-full ${ok ? "bg-lime/10 text-lime" : "bg-rose/10 text-rose"}`}>
          {ok ? <ShieldCheck size={12} /> : <ShieldX size={12} />}
        </span>
        <p className="text-[11px] font-semibold text-white/80">{title}</p>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-white/45">{detail}</p>
    </div>
  );
}
