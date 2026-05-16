import { lazy, Suspense } from "react";
import { PHARAOH_VAULT_THEME } from "@/components/slots/themes";
import PharaohSandCanvas from "@/components/slots/PharaohSandCanvas";
import PharaohPaytableSheet from "@/components/slots/PharaohPaytableSheet";
import PharaohMaxWinOverlay from "@/components/celebration/PharaohMaxWinOverlay";

const SlotSignatureWrapper = lazy(() => import("@/components/slots/SlotSignatureWrapper"));

export default function PharaohsVault2500Page() {
  return (
    <Suspense fallback={null}>
      <SlotSignatureWrapper
        slotId="pharaoh_vault"
        theme={PHARAOH_VAULT_THEME}
        Background={PharaohSandCanvas}
        PaytableSheet={PharaohPaytableSheet}
        MaxWinOverlay={PharaohMaxWinOverlay}
        flareColors={{ left: "rgba(234,179,8,0.20)", right: "rgba(16,185,129,0.18)" }}
        signatureLabel="Pharaoh's Vault · Signature"
        accentDotColor="rgba(234,179,8,1)"
        themeKey="pharaoh"
      />
    </Suspense>
  );
}
