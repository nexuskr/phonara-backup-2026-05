import { lazy, Suspense } from "react";
import { NEON_TOKYO_THEME } from "@/components/slots/themes";
import NeonGridCanvas from "@/components/slots/NeonGridCanvas";
import NeonPaytableSheet from "@/components/slots/NeonPaytableSheet";
import NeonMaxWinOverlay from "@/components/celebration/NeonMaxWinOverlay";

const SlotSignatureWrapper = lazy(() => import("@/components/slots/SlotSignatureWrapper"));

export default function NeonTokyo88Page() {
  return (
    <Suspense fallback={null}>
      <SlotSignatureWrapper
        slotId="neon_tokyo_88"
        theme={NEON_TOKYO_THEME}
        Background={NeonGridCanvas}
        PaytableSheet={NeonPaytableSheet}
        MaxWinOverlay={NeonMaxWinOverlay}
        flareColors={{
          left: "rgba(244,114,182,0.20)",
          right: "rgba(34,211,238,0.18)",
        }}
        signatureLabel="Neon Tokyo · Signature"
        accentDotColor="rgba(244,114,182,1)"
        themeKey="neon"
      />
    </Suspense>
  );
}
