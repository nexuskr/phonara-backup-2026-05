const config = {
  appId: "com.phonara.app",
  appName: "PHONARA",
  webDir: "dist",

  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#0a0a0f",
      showSpinner: false,
    },
  },
};

export default config;