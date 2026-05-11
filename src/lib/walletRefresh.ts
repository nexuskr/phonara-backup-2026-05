/**
 * Centralized helper to force a wallet/balance re-fetch immediately after any
 * RPC that changes the user's balance (mission/quest/attendance/trade/etc.).
 *
 * Triggers BOTH:
 *  - `useWallet` hook (via the `wallet:refresh` window event → reload())
 *  - legacy localDB store (via missions-rpc.refreshWallet → saveDB)
 *
 * This closes the gap between a successful RPC and the postgres_changes
 * realtime event (which can lag 0.5–2s).
 */
import { refreshWallet as syncLocalDB } from "@/lib/missions-rpc";

export function refreshWallet() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("wallet:refresh"));
  }
  // fire-and-forget: also reconcile the legacy localDB-backed user balance
  void syncLocalDB().catch(() => {});
}
