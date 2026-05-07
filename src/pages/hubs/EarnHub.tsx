import { Navigate } from "react-router-dom";
/** /earn → /missions (현재 미션 페이지가 메인 허브 컨텐츠) — HubTabs는 페이지 내부에서 노출 */
export default function EarnHub() {
  return <Navigate to="/missions" replace />;
}
