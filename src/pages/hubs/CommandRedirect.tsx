import { Navigate } from "react-router-dom";
/** /command 정식 라우트 — 기존 Dashboard 컴포넌트로 위임 */
export default function CommandRedirect() {
  return <Navigate to="/dashboard" replace />;
}
