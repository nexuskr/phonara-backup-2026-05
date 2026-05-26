import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { APP_ROUTES } from "@/shared/constants/routes";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppRouteLoader } from "@/app/route-loader";

const Auth = lazy(() => import("@/pages/Auth"));
const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const AuthCallback = lazy(() => import("@/pages/auth/AuthCallback"));
const HomePage = lazy(() => import("@/features/home"));
const Referral = lazy(() => import("@/features/referral"));
const Wallet = lazy(() => import("@/features/wallet"));
const Earn = lazy(() => import("@/features/earn"));
const TradingArenaBybit = lazy(() => import("@/features/trading"));

export function AppRouter() {
  return (
    <>
      <Suspense fallback={<AppRouteLoader />}>
        <Routes>
          <Route
            path={APP_ROUTES.root}
            element={<Navigate to={APP_ROUTES.auth} replace />}
          />

          <Route path={APP_ROUTES.auth} element={<Auth />}>
            <Route index element={<LoginPage />} />
            <Route path="callback" element={<AuthCallback />} />
          </Route>

          <Route
            path={APP_ROUTES.home}
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_ROUTES.trading}
            element={
              <ProtectedRoute>
                <TradingArenaBybit />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_ROUTES.earn}
            element={
              <ProtectedRoute>
                <Earn />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_ROUTES.wallet}
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path={APP_ROUTES.referral}
            element={
              <ProtectedRoute>
                <Referral />
              </ProtectedRoute>
            }
          />

          <Route
            path={APP_ROUTES.games}
            element={<Navigate to={APP_ROUTES.home} replace />}
          />
          <Route path="*" element={<Navigate to={APP_ROUTES.auth} replace />} />
        </Routes>
      </Suspense>

      <Toaster
        position="top-center"
        richColors
        closeButton
        duration={2400}
        className="toaster-phonara"
      />
    </>
  );
}
