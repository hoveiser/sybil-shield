import { chains, createAccount, createClient } from "genlayer-js";
import deployment from "../deployments/studionet.json";
import snapshotData from "../data/snapshot.json";
import type {
  ActivityEntry,
  Config,
  ConsensusRun,
  Dashboard,
  LeaderRow,
  PassportRecord,
  PromptPreview,
  VaultState,
} from "./types";

export const CONTRACT_ADDRESS = deployment.address as `0x${string}`;
export const DEPLOYMENT = deployment;
export const SNAPSHOT = snapshotData as unknown as SnapshotShape;

export interface SnapshotShape {
  network: string;
  chainId: number;
  address: string;
  deployTx: string;
  sourceSha256: string;
  finishedAt: string;
  explorer: string;
  config: Config;
  vault: VaultState;
  leaders: LeaderRow[];
  activity: string[];
  consensus: ConsensusRun[];
  guards: {
    step: string;
    tx_hash: string;
    execution_result: string;
    expected_reason: string;
    verified: boolean;
  }[];
  signers: Record<string, string>;
  passports: Record<string, PassportRecord>;
  transactions: {
    step: string;
    tx_hash: string;
    status: string;
    execution_result: string;
    consensus_result: string;
    expected: string;
  }[];
  sourceIdentity: {
    hashes: Record<string, string | null>;
    matched_sources: string[];
    four_way_match: boolean;
  };
  sourceMatch: boolean;
}

export type GlAccount = ReturnType<typeof createAccount>;

type ReadClient = ReturnType<typeof createClient>;
let readClient: ReadClient | null = null;

function ensureReadClient(): ReadClient {
  if (!readClient) {
    readClient = createClient({ chain: chains.studionet });
  }
  return readClient;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 2, delay = 900): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await sleep(delay * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

export async function readView<T>(functionName: string, args: unknown[] = []): Promise<T> {
  const client = ensureReadClient();
  return withRetry(
    () =>
      client.readContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args: args as never[],
        jsonSafeReturn: true,
      }) as Promise<T>,
  );
}

export function parseActivity(entries: string[]): ActivityEntry[] {
  const parsed: ActivityEntry[] = [];
  for (const entry of entries) {
    try {
      const value = JSON.parse(entry) as ActivityEntry;
      if (value && typeof value.action === "string") parsed.push(value);
    } catch {
      // Ignore malformed rows instead of fabricating an entry.
    }
  }
  return parsed;
}

export async function loadDashboard(): Promise<Dashboard> {
  try {
    const config = await readView<Config>("get_config");
    const vault = await readView<VaultState>("get_vault_state");
    const leaders = await readView<LeaderRow[]>("get_leaderboard", [10]);
    const rawActivity = await readView<string[]>("get_activity", [24]);
    return {
      source: "live",
      config,
      vault,
      leaders,
      activity: parseActivity(rawActivity),
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("SybilShield live read failed, serving the verified snapshot", error);
    return {
      source: "cached",
      config: SNAPSHOT.config,
      vault: SNAPSHOT.vault,
      leaders: SNAPSHOT.leaders,
      activity: parseActivity(SNAPSHOT.activity),
      fetchedAt: SNAPSHOT.finishedAt,
    };
  }
}

export async function loadPassport(passportId: number): Promise<PassportRecord> {
  return readView<PassportRecord>("get_passport", [passportId]);
}

export async function loadPromptPreview(passportId: number): Promise<PromptPreview> {
  return readView<PromptPreview>("preview_consensus_prompt", [passportId]);
}

export async function loadAllPassports(count: number): Promise<PassportRecord[]> {
  const rows: PassportRecord[] = [];
  for (let index = 1; index <= count; index += 1) {
    rows.push(await readView<PassportRecord>("get_passport", [index]));
  }
  return rows;
}

export interface SourceCheck {
  onchainSha256: string;
  expectedSha256: string;
  match: boolean;
}

function bytesToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyOnchainSource(): Promise<SourceCheck> {
  const client = ensureReadClient();
  // genlayer-js decodes gen_getContractCode from base64 to the source text.
  const source = await client.getContractCode(CONTRACT_ADDRESS);
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const onchainSha256 = bytesToHex(digest);
  return {
    onchainSha256,
    expectedSha256: SNAPSHOT.sourceSha256,
    match: onchainSha256 === SNAPSHOT.sourceSha256,
  };
}

export interface WriteReceipt {
  hash: string;
  status: string;
  execution: string;
  consensus: string;
}

function receiptField(receipt: unknown, key: string): string {
  if (receipt && typeof receipt === "object" && key in receipt) {
    const value = (receipt as Record<string, unknown>)[key];
    if (value !== undefined && value !== null) return String(value);
  }
  return "unknown";
}

export async function writeWithWallet(
  wallet: { kind: "burner" | "metamask"; address: string; account: GlAccount },
  functionName: string,
  args: unknown[],
  value = 0n,
): Promise<WriteReceipt> {
  const client =
    wallet.kind === "metamask"
      ? createClient({
          chain: chains.studionet,
          provider: window.ethereum as never,
          account: wallet.address as never,
        })
      : createClient({ chain: chains.studionet, account: wallet.account });
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args: args as never[],
    value,
  });
  const receipt = await client.waitForTransactionReceipt({
    hash: hash as never,
    status: "FINALIZED" as never,
    interval: 4000,
    retries: 150,
  });
  return {
    hash: String(hash),
    status: receiptField(receipt, "status_name"),
    execution: receiptField(receipt, "tx_execution_result_name"),
    consensus: receiptField(receipt, "result_name"),
  };
}

export async function faucetSst(
  wallet: { kind: "burner" | "metamask"; address: string; account: GlAccount },
  amountSst = 400,
): Promise<WriteReceipt> {
  const amount = BigInt(Math.round(amountSst)) * 10n ** 18n;
  return writeWithWallet(wallet, "faucet_or_deposit", [amount]);
}

export function explorerTx(hash: string): string {
  return DEPLOYMENT.explorer + "/transactions/" + hash;
}
