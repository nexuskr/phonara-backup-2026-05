export const APP_ROUTES = {
  root: "/",
  auth: "/auth",
  authCallback: "/auth/callback",
  home: "/home",
  trading: "/trading",
  earn: "/earn",
  wallet: "/wallet",
  referral: "/referral",
  games: "/games",
} as const;

export type AppRoute = (typeof APP_ROUTES)[keyof typeof APP_ROUTES];
