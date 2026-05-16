import { lazy, Suspense } from "react";
import { CHERRY_SAKURA_THEME } from "@/components/slots/themes";
import SakuraPetalCanvas from "@/components/slots/SakuraPetalCanvas";
import SakuraPaytableSheet from "@/components/slots/SakuraPaytableSheet";
import SakuraMaxWinOverlay from "@/components/celebration/SakuraMaxWinOverlay";

const SlotSignatureWrapper = lazy(() => import("@/components/slots/SlotSignatureWrapper"));

export default function CherrySakura500Page() {
  return (
    <Suspense fallback={null}>
      <SlotSignatureWrapper
        slotId="cherry_sakura"
        theme={CHERRY_SAKURA_THEME}
        Background={SakuraPetalCanvas}
        PaytableSheet={SakuraPaytableSheet}
        MaxWinOverlay={SakuraMaxWinOverlay}
        flareColors={{ left: "rgba(249,168,212,0.22)", right: "rgba(163,230,187,0.18)" }}
        signatureLabel="Cherry Sakura · Signature"
        accentDotColor="rgba(249,168,212,1)"
        themeKey="sakura"
      />
    </Suspense>
  );
}
