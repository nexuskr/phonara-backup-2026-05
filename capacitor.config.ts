import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.phonara.app",
  appName: "PHONARA",
  webDir: "dist",
  // Lovable 프리뷰 서버 URL 제거 (독립 배포를 위해 삭제)
  ios: { contentInset: "always" },
  android: { allowMixedContent: true, captureInput: true },
  plugins: {
    PushNotifications: { presentationOptions: ["badge", "sound", "alert"] },
    SplashScreen: { launchShowDuration: 600, backgroundColor: "#0a0a0f", showSpinner: false },
  },
};

export default config;