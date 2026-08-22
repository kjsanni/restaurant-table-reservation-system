import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vibespot.business",
  appName: "Vibespot Business",
  webDir: "dist",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    url: "https://vibespotgh.com",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#4f46e5",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      spinnerColor: "#ffffff",
    },
  },
  ios: {
    contentInset: "always",
  },
  android: {
    contentInset: "always",
    allowMixedContent: false,
  },
};

export default config;
