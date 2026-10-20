import { createAccount, generatePrivateKey } from "genlayer-js";
import type { GlAccount } from "./genlayer";

const BURNER_KEY = "sybilshield.burner.privateKey";
const BURNER_LABEL = "sybilshield.burner.createdAt";

export interface WalletState {
  kind: "burner" | "metamask";
  address: string;
  account: GlAccount;
}

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function hasMetaMask(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum?.isMetaMask);
}

export function loadBurnerAccount(): GlAccount {
  let privateKey = window.localStorage.getItem(BURNER_KEY);
  if (!privateKey || !privateKey.startsWith("0x") || privateKey.length !== 66) {
    privateKey = generatePrivateKey();
    window.localStorage.setItem(BURNER_KEY, privateKey);
    window.localStorage.setItem(BURNER_LABEL, new Date().toISOString());
  }
  return createAccount(privateKey as `0x${string}`);
}

export function burnerWallet(): WalletState {
  const account = loadBurnerAccount();
  return { kind: "burner", address: account.address, account };
}

export function burnerCreatedAt(): string | null {
  return window.localStorage.getItem(BURNER_LABEL);
}

export function forgetBurner(): void {
  window.localStorage.removeItem(BURNER_KEY);
  window.localStorage.removeItem(BURNER_LABEL);
}

const CHAIN_ID_HEX = "0xF22F";

async function ensureStudionet(provider: EthereumProvider): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_ID_HEX }],
    });
  } catch {
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_ID_HEX,
          chainName: "GenLayer Studio",
          nativeCurrency: { name: "GEN Token", symbol: "GEN", decimals: 18 },
          rpcUrls: ["https://studio.genlayer.com/api"],
          blockExplorerUrls: [],
        },
      ],
    });
  }
}

export async function connectMetaMask(): Promise<WalletState> {
  const provider = window.ethereum;
  if (!provider) {
    throw new Error("MetaMask is not installed in this browser.");
  }
  await ensureStudionet(provider);
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error("MetaMask returned no account.");
  }
  const address = accounts[0];
  return {
    kind: "metamask",
    address,
    // MetaMask signs through the injected provider, so the account object only
    // carries the address identity for display and read calls.
    account: { address } as unknown as GlAccount,
  };
}

export function truncatedKeyWarning(): string {
  return "The burner key is generated in this browser and stored in localStorage. Use it for the studionet demo only.";
}
