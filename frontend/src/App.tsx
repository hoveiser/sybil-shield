import confetti from "canvas-confetti";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Cpu,
  Loader2,
  Lock,
  ScanEye,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ActivityFeed } from "./components/ActivityFeed";
import { ConsensusDrawer } from "./components/ConsensusDrawer";
import { EvidenceStrip } from "./components/EvidenceStrip";
import { Footer } from "./components/Footer";
import { GuardLab } from "./components/GuardLab";
import { Header } from "./components/Header";
import { Leaderboard } from "./components/Leaderboard";
import { LogoMark } from "./components/Logo";
import { PassportCard } from "./components/PassportCard";
import { Simulator } from "./components/Simulator";
import { TrustGraph } from "./components/TrustGraph";
import { VaultLedger } from "./components/VaultLedger";
import { WalletPanel } from "./components/WalletPanel";
import { formatTime, sstLabel } from "./lib/format";
import {
  SNAPSHOT,
  faucetSst,
  loadDashboard,
  loadPassport,
  loadPromptPreview,
  verifyOnchainSource,
  type SourceCheck,
} from "./lib/genlayer";
import { sound } from "./lib/sound";
import type { Dashboard, PassportRecord, PromptPreview } from "./lib/types";
import { burnerWallet, connectMetaMask, loadBurnerAccount, type WalletState } from "./lib/wallet";

const SPARK_COLORS = ["#22D3EE", "#A78BFA", "#A3E635", "#FBBF24"];

function initialPassportCache(): Record<number, PassportRecord> {
  const cache: Record<number, PassportRecord> = {};
  for (const value of Object.values(SNAPSHOT.passports)) {
    cache[value.passport_id] = value;
  }
  return cache;
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export default function App() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [selectedId, setSelectedId] = useState(1);
  const [passportCache, setPassportCache] = useState<Record<number, PassportRecord>>(initialPassportCache);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [preview, setPreview] = useState<PromptPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(sound.enabled);
  const [sourceCheck, setSourceCheck] = useState<SourceCheck | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    loadDashboard().then((data) => {
      if (alive) setDashboard(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedPassport = passportCache[selectedId] ?? SNAPSHOT.passports.alpha;
  const selectedRow = dashboard?.leaders.find((row) => row.passport_id === selectedId);
  const guardPassport = useMemo(() => {
    const challenged = Object.values(passportCache).find(
      (item) => item.challenge_open || item.status === "CHALLENGED",
    );
    return challenged ?? selectedPassport;
  }, [passportCache, selectedPassport]);

  const selectPassport = useCallback(
    async (id: number) => {
      sound.click();
      setSelectedId(id);
      if (!passportCache[id]) {
        try {
          const record = await loadPassport(id);
          setPassportCache((previous) => ({ ...previous, [id]: record }));
        } catch {
          setToast({ kind: "err", text: "Could not read passport " + id + " from studionet." });
        }
      }
    },
    [passportCache],
  );

  const openInspector = async () => {
    sound.whoosh();
    setDrawerOpen(true);
    if (preview && preview.passport_id === selectedId) return;
    setPreviewLoading(true);
    try {
      const loaded = await loadPromptPreview(selectedId);
      setPreview(loaded);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleSound = () => {
    const next = !soundOn;
    sound.setEnabled(next);
    setSoundOn(next);
  };

  const handleVerifySource = async () => {
    if (verifying) return;
    setVerifying(true);
    try {
      const check = await verifyOnchainSource();
      setSourceCheck(check);
      if (check.match) {
        sound.verified();
        confetti({ particleCount: 110, spread: 75, origin: { y: 0.65 }, colors: SPARK_COLORS });
        setToast({ kind: "ok", text: "On chain contract code matches the recorded source hash." });
      } else {
        sound.error();
        setToast({ kind: "err", text: "On chain code hash does not match the recorded source." });
      }
    } catch (error) {
      sound.error();
      setToast({ kind: "err", text: "Source verification failed: " + errorText(error) });
    } finally {
      setVerifying(false);
    }
  };

  const handleBurner = () => {
    try {
      const next = burnerWallet();
      setWallet(next);
      setWalletMessage("Burner ready. " + next.address);
      setWalletOpen(false);
      sound.chime();
      setToast({ kind: "ok", text: "Burner wallet generated in this browser." });
    } catch (error) {
      setWalletMessage(errorText(error));
    }
  };

  const handleMetaMask = async () => {
    try {
      const next = await connectMetaMask();
      setWallet(next);
      setWalletMessage("MetaMask connected on GenLayer Studio.");
      setWalletOpen(false);
      sound.chime();
      setToast({ kind: "ok", text: "MetaMask connected." });
    } catch (error) {
      setWalletMessage(errorText(error));
      sound.error();
    }
  };

  const handleFaucet = async () => {
    if (!wallet || walletBusy) return;
    setWalletBusy(true);
    setWalletMessage("Sending faucet_or_deposit(400 SST)...");
    try {
      const receipt = await faucetSst(wallet, 400);
      setWalletMessage("Faucet finalized " + receipt.hash + " (" + receipt.execution + ")");
      sound.chime();
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 }, colors: SPARK_COLORS });
      setToast({ kind: "ok", text: "Faucet transaction finalized on studionet." });
      const refreshed = await loadDashboard();
      setDashboard(refreshed);
    } catch (error) {
      setWalletMessage("Faucet failed: " + errorText(error));
      sound.error();
      setToast({ kind: "err", text: "Faucet failed: " + errorText(error) });
    } finally {
      setWalletBusy(false);
    }
  };

  const burnerAddress = useMemo(() => {
    try {
      return loadBurnerAccount().address;
    } catch {
      return "";
    }
  }, []);

  if (!dashboard) {
    return <Splash />;
  }

  const vault = dashboard.vault;
  const guardCount = SNAPSHOT.guards.filter((guard) => guard.verified).length;

  return (
    <div id="top" className="relative min-h-screen overflow-x-hidden">
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-40" />
      <Header
        source={dashboard.source}
        wallet={wallet}
        soundOn={soundOn}
        onOpenWallet={() => {
          sound.click();
          setWalletOpen(true);
        }}
        onToggleSound={toggleSound}
      />

      {dashboard.source === "cached" && (
        <div className="relative border-b border-amber/20 bg-amber/5 px-4 py-2 text-center text-[11px] text-amber/80">
          studionet reads were rate limited. Showing the verified snapshot from {formatTime(dashboard.fetchedAt)}.
        </div>
      )}

      <main className="relative">
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
          <div className="grid items-start gap-6 lg:grid-cols-[1.02fr_1.05fr]">
            <div className="animate-float">
              <span className="chip border-cyan/25 bg-cyan/5 text-cyan">
                <Sparkles size={12} /> GenLayer x staked identity
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
                Prove you are human.
                <br />
                <span className="bg-gradient-to-r from-cyan via-violet to-cyan bg-clip-text text-transparent">
                  Stake if you are not.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55">
                SybilShield turns a handle into a staked credential passport. Peers put real SST behind you,
                validators independently read your public proof page, and a discrete trust band decides whether
                your stake unlocks or gets slashed.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#simulator" className="btn-primary" onClick={() => sound.click()}>
                  <Zap size={15} /> Open the simulator
                </a>
                <button type="button" onClick={openInspector} className="btn-ghost">
                  <ScanEye size={15} /> Inspect the consensus
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <HeroStat label="Vault custody" value={`${sstLabel(vault.vault_custody_balance, 0)} SST`} tone="text-cyan" icon={<Lock size={12} />} />
                <HeroStat label="Active passports" value={String(vault.active_count)} tone="text-lime" icon={<BadgeCheck size={12} />} />
                <HeroStat label="Guard rollbacks" value={`${guardCount} / 3`} tone="text-amber" icon={<Shield size={12} />} />
                <HeroStat label="Source match" value={`${SNAPSHOT.sourceIdentity.matched_sources.length} / 4`} tone="text-violet" icon={<Cpu size={12} />} />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-[10px] text-white/35">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-lime" /> no owner key
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock size={12} className="text-cyan" /> 100% of liabilities stay in vault custody
                </span>
                <span className="flex items-center gap-1.5">
                  <Swords size={12} className="text-rose" /> adversarial counterparties assumed
                </span>
              </div>
            </div>

            <PassportCard passport={selectedPassport} row={selectedRow} source={dashboard.source} />
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            <TrustGraph passport={selectedPassport} />
            <Leaderboard rows={dashboard.leaders} selectedId={selectedId} onSelect={selectPassport} />
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <Simulator passport={selectedPassport} vault={vault} />
        </section>

        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
            <VaultLedger vault={vault} />
            <ActivityFeed entries={dashboard.activity} />
          </div>
        </section>

        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <GuardLab
            passport={guardPassport}
            fingerprints={Object.values(passportCache).map((item) => item.identity_fingerprint)}
            onchain={SNAPSHOT.guards}
          />
        </section>

        <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
          <EvidenceStrip snapshot={SNAPSHOT} sourceCheck={sourceCheck} verifying={verifying} onVerify={handleVerifySource} />
        </section>

        <section className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="panel flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan/25 bg-cyan/10 text-cyan">
                <ArrowDown size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Read the full audit trail</p>
                <p className="mt-0.5 text-[11px] text-white/45">
                  Every finalized transaction, guard rollback and vault invariant, verified through the consensus data contract.
                </p>
              </div>
            </div>
            <a
              href="https://github.com/hoveiser/sybil-shield/blob/main/docs/evidence.md"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost text-xs"
            >
              Open evidence <ArrowRight size={13} />
            </a>
          </div>
        </section>
      </main>

      <Footer />

      <WalletPanel
        open={walletOpen}
        wallet={wallet}
        burnerAddress={burnerAddress}
        busy={walletBusy}
        message={walletMessage}
        onClose={() => setWalletOpen(false)}
        onBurner={handleBurner}
        onMetaMask={handleMetaMask}
        onDisconnect={() => {
          setWallet(null);
          setWalletMessage("Wallet disconnected.");
          sound.click();
        }}
        onFaucet={handleFaucet}
      />

      <ConsensusDrawer
        open={drawerOpen}
        passport={selectedPassport}
        config={dashboard.config}
        preview={preview}
        loading={previewLoading}
        runs={SNAPSHOT.consensus}
        transactions={SNAPSHOT.transactions}
        onClose={() => setDrawerOpen(false)}
      />

      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] max-w-sm">
          <div
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs shadow-2xl backdrop-blur-xl ${
              toast.kind === "ok"
                ? "border-lime/30 bg-lime/10 text-lime"
                : toast.kind === "err"
                  ? "border-rose/30 bg-rose/10 text-rose"
                  : "border-edge bg-panel/90 text-white/70"
            }`}
          >
            {toast.kind === "ok" ? <ShieldCheck size={14} className="mt-0.5" /> : <Shield size={14} className="mt-0.5" />}
            <span className="leading-relaxed">{toast.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroStat({ label, value, tone, icon }: { label: string; value: string; tone: string; icon: ReactNode }) {
  return (
    <div className="rounded-xl border border-edge/70 bg-white/[0.02] p-3">
      <p className="label flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className={`mono mt-1 text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-md p-8 text-center">
        <div className="mx-auto w-fit animate-pulseRing">
          <LogoMark size={64} />
        </div>
        <p className="mt-5 text-sm font-semibold text-white">Reading the studionet trust graph</p>
        <p className="mt-1 text-[11px] text-white/40">get_config, get_vault_state, get_leaderboard, get_activity</p>
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-cyan">
          <Loader2 size={13} className="animate-spin" /> four reads, no ABI override
        </div>
      </div>
    </div>
  );
}
