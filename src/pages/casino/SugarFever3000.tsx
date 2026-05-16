// Sugar Fever 3000 — Signature Slot page.
import { lazy, Suspense } from "react";
import { SUGAR_FEVER_THEME } from "@/components/slots/themes";
import SugarFeverCanvas from "@/components/slots/SugarFeverCanvas";
import SugarFeverPaytableSheet from "@/components/slots/SugarFeverPaytableSheet";

const SlotSignatureWrapper = lazy(() => import("@/components/slots/SlotSignatureWrapper"));
const SugarFeverMaxWinOverlay = lazy(
  () => import("@/components/celebration/SugarFeverMaxWinOverlay"),
);

function MaxWinOverlayLazy(props: React.ComponentProps<typeof SugarFeverMaxWinOverlay>) {
  return (
    <Suspense fallback={null}>
      <SugarFeverMaxWinOverlay {...props} />
    </Suspense>
  );
}

export default function SugarFever3000Page() {
  return (
    <Suspense fallback={null}>
      <SlotSignatureWrapper
        slotId="sugar_fever"
        theme={SUGAR_FEVER_THEME}
        Background={SugarFeverCanvas}
        PaytableSheet={SugarFeverPaytableSheet}
        MaxWinOverlay={MaxWinOverlayLazy}
        flareColors={{
          left: "rgba(255,180,205,0.22)",
          right: "rgba(255,210,130,0.20)",
        }}
        signatureLabel="Sugar Fever · Signature"
        accentDotColor="rgba(255,180,205,1)"
        themeKey="olympus"
      />
    </Suspense>
  );
}
