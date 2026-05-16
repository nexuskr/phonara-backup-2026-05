// Olympus Legacy 5000 — flagship Signature Slot page.
import { lazy, Suspense } from "react";
import { OLYMPUS_LEGACY_THEME } from "@/components/slots/themes";
import OlympusLegacyCanvas from "@/components/slots/OlympusLegacyCanvas";
import OlympusLegacyPaytableSheet from "@/components/slots/OlympusLegacyPaytableSheet";

const SlotSignatureWrapper = lazy(() => import("@/components/slots/SlotSignatureWrapper"));
const OlympusLegacyMaxWinOverlay = lazy(
  () => import("@/components/celebration/OlympusLegacyMaxWinOverlay"),
);

function MaxWinOverlayLazy(props: React.ComponentProps<typeof OlympusLegacyMaxWinOverlay>) {
  return (
    <Suspense fallback={null}>
      <OlympusLegacyMaxWinOverlay {...props} />
    </Suspense>
  );
}

export default function OlympusLegacy5000Page() {
  return (
    <Suspense fallback={null}>
      <SlotSignatureWrapper
        slotId="olympus_legacy"
        theme={OLYMPUS_LEGACY_THEME}
        Background={OlympusLegacyCanvas}
        PaytableSheet={OlympusLegacyPaytableSheet}
        MaxWinOverlay={MaxWinOverlayLazy}
        flareColors={{
          left: "rgba(255,196,90,0.22)",
          right: "rgba(255,170,60,0.20)",
        }}
        signatureLabel="Olympus Legacy · Flagship"
        accentDotColor="rgba(255,196,90,1)"
        themeKey="olympus"
      />
    </Suspense>
  );
}
