import { lazy, Suspense } from "react";
import { PIRATE_CURSE_THEME } from "@/components/slots/themes";
import PirateOceanCanvas from "@/components/slots/PirateOceanCanvas";
import PiratePaytableSheet from "@/components/slots/PiratePaytableSheet";
import PirateMaxWinOverlay from "@/components/celebration/PirateMaxWinOverlay";

const SlotSignatureWrapper = lazy(() => import("@/components/slots/SlotSignatureWrapper"));

export default function PiratesCurse1500Page() {
  return (
    <Suspense fallback={null}>
      <SlotSignatureWrapper
        slotId="pirate_curse"
        theme={PIRATE_CURSE_THEME}
        Background={PirateOceanCanvas}
        PaytableSheet={PiratePaytableSheet}
        MaxWinOverlay={PirateMaxWinOverlay}
        flareColors={{ left: "rgba(185,28,28,0.22)", right: "rgba(234,179,8,0.18)" }}
        signatureLabel="Pirate's Curse · Signature"
        accentDotColor="rgba(234,179,8,1)"
        themeKey="pirate"
      />
    </Suspense>
  );
}
