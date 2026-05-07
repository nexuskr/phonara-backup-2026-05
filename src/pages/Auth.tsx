import { Navigate, useSearchParams } from "react-router-dom";

// Demo mock-auth page is disabled. All traffic routed to the real SecureAuth.
export default function Auth() {
  const [params] = useSearchParams();
  const qs = params.toString();
  return <Navigate to={`/secure-auth${qs ? `?${qs}` : ""}`} replace />;
}
