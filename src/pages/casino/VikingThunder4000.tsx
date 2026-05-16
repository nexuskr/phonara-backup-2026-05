import { lazy, Suspense } from "react";
import CasinoLayout from "@/components/casino/CasinoLayout";
import { VIKING_THUNDER_THEME } from "@/components/slots/themes";
import Disclaimer from "@/components/Disclaimer";
import { useRequireAuth } from "@/hooks/use-require-auth";

const OlympusSlot = lazy(() => import("@/components/slots/OlympusSlot"));

export default function VikingThunder4000Page() {
  const user = useRequireAuth();
  if (!user) return null;
  return (
    <CasinoLayout backTo="/casino" backLabel="슬롯 로비로">
      <div className="container py-4 space-y-4">
        <Suspense fallback={null}>
          <OlympusSlot theme={VIKING_THUNDER_THEME} />
        </Suspense>
        <Disclaimer />
      </div>
    </CasinoLayout>
  );
}
