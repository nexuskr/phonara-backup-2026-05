/**
 * Centralized helper to force a wallet/balance re-fetch immediately after any
 * RPC that changes the user's balance (mission/quest/attendance/trade/etc.).
 *
 * This is the canonical SSOT refresh path for client-side wallet views.
 */

export function refreshWallet() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("wallet:refresh"));
  }
}
