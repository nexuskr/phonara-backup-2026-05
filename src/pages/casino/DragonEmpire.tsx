import { lazy, Suspense } from "react";
import { DRAGON_THEME } from "@/components/slots/themes";
import DragonEmberCanvas from "@/components/slots/DragonEmberCanvas";
import DragonPaytableSheet from "@/components/slots/DragonPaytableSheet";
import DragonMaxWinOverlay from "@/components/celebration/DragonMaxWinOverlay";

const SlotSignatureWrapper = lazy(() => import("@/components/slots/SlotSignatureWrapper"));

export default function DragonEmpirePage() {
  return (
    <Suspense fallback={null}>
      <SlotSignatureWrapper
        slotId="dragon_empire"
        theme={DRAGON_THEME}
        Background={DragonEmberCanvas}
        PaytableSheet={DragonPaytableSheet}
        MaxWinOverlay={DragonMaxWinOverlay}
        flareColors={{ left: "rgba(239,68,68,0.20)", right: "rgba(251,191,36,0.20)" }}
        signatureLabel="Dragon Empire · Signature"
        accentDotColor="rgba(249,115,22,1)"
        themeKey="dragon"
      />
    </Suspense>
  );
}
