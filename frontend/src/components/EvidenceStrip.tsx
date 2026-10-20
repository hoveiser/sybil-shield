import type { ReactNode } from "react";
import { CheckCircle2, ExternalLink, Fingerprint, GitCommitHorizontal, Hash, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { shortHash } from "../lib/format";
import type { SourceCheck } from "../lib/genlayer";
import { DEPLOYMENT, explorerTx } from "../lib/genlayer";
import type { SnapshotShape } from "../lib/genlayer";

interface EvidenceStripProps {
  snapshot: SnapshotShape;
  sourceCheck: SourceCheck | null;
  verifying: boolean;
  onVerify: () => void;
}

export function EvidenceStrip({ snapshot, sourceCheck, verifying, onVerify }: EvidenceStripProps) {
  const hashes = snapshot.sourceIdentity.hashes;
  const labels: Record<string, string> = {
    repo_file: "repo file",
    git_head_blob: "git HEAD blob",
    deploy_tx_code: "deploy tx code",
    onchain_contract_code: "onchain contract code",
  };
  const guardCount = snapshot.guards.filter((guard) => guard.verified).length;
  const finalized = snapshot.transactions.filter((tx) => tx.status === "FINALIZED").length;

  return (
    <section id="evidence" className="panel p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label">On chain evidence</p>
          <h2 className="mt-1 text-xl font-semibold text-white">Four way source identity</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/50">
            The same contract bytes are hashed from the repository, the git blob, the deploy calldata and the
            deployed contract code. All four hashes must match before a release is claimed.
          </p>
        </div>
        <button type="button" onClick={onVerify} disabled={verifying} className="btn-violet !py-2 text-xs">
          {verifying ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
          {verifying ? "Hashing on chain" : "Verify source on chain"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-edge/70 bg-white/[0.015] p-4">
          <div className="flex items-center justify-between">
            <p className="label flex items-center gap-1.5">
              <Hash size={11} /> sha256 sources
            </p>
            <span className={`chip ${snapshot.sourceIdentity.four_way_match ? "border-lime/30 bg-lime/10 text-lime" : "border-rose/30 bg-rose/10 text-rose"}`}>
              {snapshot.sourceIdentity.four_way_match ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
              {snapshot.sourceIdentity.matched_sources.length} / 4 match
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            {Object.entries(hashes).map(([key, value]) => {
              const match = value === snapshot.sourceSha256;
              return (
                <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-edge/40 bg-ink/40 px-3 py-2">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-white/45">{labels[key] ?? key}</span>
                  <span className="mono text-[9px] text-white/60">{value ? value.slice(0, 20) + "..." : "unavailable"}</span>
                  {match ? <CheckCircle2 size={12} className="shrink-0 text-lime" /> : <XCircle size={12} className="shrink-0 text-rose" />}
                </div>
              );
            })}
          </div>
          <p className="mono mt-3 break-all text-[9px] text-mist">source {snapshot.sourceSha256}</p>
          {sourceCheck && (
            <div className={`mt-3 rounded-lg border p-2.5 ${sourceCheck.match ? "border-lime/25 bg-lime/5" : "border-rose/25 bg-rose/5"}`}>
              <p className={`text-[10px] font-semibold ${sourceCheck.match ? "text-lime" : "text-rose"}`}>
                {sourceCheck.match ? "On chain code matches the recorded source hash" : "On chain code does not match"}
              </p>
              <p className="mono mt-1 break-all text-[9px] text-white/50">{sourceCheck.onchainSha256}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stat label="Contract" value={shortHash(snapshot.address, 6)} href={DEPLOYMENT.explorer + "/contracts/" + snapshot.address} icon={<GitCommitHorizontal size={12} />} />
          <Stat label="Deploy tx" value={shortHash(snapshot.deployTx, 6)} href={explorerTx(snapshot.deployTx)} icon={<ExternalLink size={12} />} />
          <Stat label="Finalized txs" value={String(finalized)} icon={<CheckCircle2 size={12} />} />
          <Stat label="Guard rollbacks" value={`${guardCount} / 3`} icon={<Fingerprint size={12} />} />
          <div className="col-span-2 rounded-xl border border-edge/60 bg-white/[0.015] p-3">
            <p className="label">Network</p>
            <p className="mono mt-1 text-xs text-white/75">studionet · chain {snapshot.chainId}</p>
            <p className="mono mt-0.5 text-[9px] text-mist">
              deployed {new Date(DEPLOYMENT.deployedAt).toUTCString()}
            </p>
            <p className="mono mt-0.5 text-[9px] text-mist">
              commit {shortHash(DEPLOYMENT.deployedCommit, 7)} · evidence {new Date(snapshot.finishedAt).toUTCString()}
            </p>
          </div>
          <a
            href="https://github.com/hoveiser/sybil-shield/blob/main/docs/evidence.md"
            target="_blank"
            rel="noreferrer"
            className="col-span-2 rounded-xl border border-cyan/20 bg-cyan/5 p-3 text-xs text-cyan transition hover:bg-cyan/10"
          >
            Full transaction table and vault audit on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, href, icon }: { label: string; value: string; href?: string; icon?: ReactNode }) {
  const content = (
    <>
      <p className="label flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="mono mt-1 truncate text-xs text-white/80">{value}</p>
    </>
  );
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="rounded-xl border border-edge/60 bg-white/[0.015] p-3 transition hover:border-cyan/30">
        {content}
      </a>
    );
  }
  return <div className="rounded-xl border border-edge/60 bg-white/[0.015] p-3">{content}</div>;
}
