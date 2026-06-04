import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.NODE_ENV === "development";

const config: CapacitorConfig = {
  appId: "com.elbold.app",
  appName: "ELBOLD",
  // webDir is required by Capacitor but unused when server.url is set
  webDir: "out",
  server: {
    // In development: point to local Next.js server for live reload
    // In production: point to the hosted Next.js deployment
    url: isDev
      ? "http://192.168.1.1:3000"  // Replace with your machine's local IP
      : "https://elbold.com",
    cleartext: isDev,
    androidScheme: "https",
    iosScheme: "https",
    hostname: "elbold.com",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0f",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#0B1F4D",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#0a0a0f",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
    minWebViewVersion: 55,
    backgroundColor: "#0a0a0f",
    allowMixedContent: isDev,
  },
  ios: {
    contentInset: "always",
    scrollEnabled: true,
  },
};

export default config;
