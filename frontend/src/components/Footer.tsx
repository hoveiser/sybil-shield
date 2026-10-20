import { ExternalLink, Github, ShieldCheck } from "lucide-react";
import { shortHash } from "../lib/format";
import { DEPLOYMENT, SNAPSHOT } from "../lib/genlayer";
import { Wordmark } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-14 border-t border-edge/60 bg-ink/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-white/45">
            A staked cross platform credential and anti sybil trust graph passport. Built on GenLayer, where the
            evidence review is the consensus, not a backend opinion.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip border-lime/25 bg-lime/5 text-lime">
              <ShieldCheck size={11} /> 4 way sha256 {SNAPSHOT.sourceIdentity.four_way_match ? "match" : "open"}
            </span>
            <span className="chip border-edge bg-white/[0.02] text-mist">studionet · 61999</span>
          </div>
        </div>

        <div>
          <p className="label">Project</p>
          <div className="mt-3 space-y-2 text-xs text-white/55">
            <a className="flex items-center gap-2 hover:text-cyan" href="https://github.com/hoveiser/sybil-shield" target="_blank" rel="noreferrer">
              <Github size={12} /> Source repository
            </a>
            <a className="flex items-center gap-2 hover:text-cyan" href="https://github.com/hoveiser/sybil-shield/blob/main/docs/evidence.md" target="_blank" rel="noreferrer">
              <ExternalLink size={12} /> Transaction evidence
            </a>
            <a className="flex items-center gap-2 hover:text-cyan" href="https://github.com/hoveiser/sybil-shield/blob/main/contracts/sybil_shield.py" target="_blank" rel="noreferrer">
              <ExternalLink size={12} /> Contract source
            </a>
            <a className="flex items-center gap-2 hover:text-cyan" href="https://github.com/hoveiser/sybil-shield/releases/tag/studionet-v1" target="_blank" rel="noreferrer">
              <ExternalLink size={12} /> Tag studionet-v1
            </a>
          </div>
        </div>

        <div>
          <p className="label">Deployment</p>
          <div className="mt-3 space-y-2 text-[10px] text-white/45">
            <p className="mono break-all">{DEPLOYMENT.address}</p>
            <p className="mono break-all">deploy {shortHash(DEPLOYMENT.deployTx, 8)}</p>
            <p className="mono break-all">source {shortHash(DEPLOYMENT.sourceSha256, 10)}</p>
            <p>Deployed {new Date(DEPLOYMENT.deployedAt).toUTCString()}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-edge/50 px-4 py-4 text-center text-[10px] text-white/30 sm:px-6 lg:px-8">
        SybilShield · no owner key, no admin bypass, no deterministic badge approval
      </div>
    </footer>
  );
}
