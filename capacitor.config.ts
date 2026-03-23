import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const isDev = process.env.NODE_ENV !== 'production';
const serverUrl = process.env.CAPACITOR_SERVER_URL || (isDev ? 'http://localhost:3000' : undefined);

const config: CapacitorConfig = {
  appId: 'ar.com.autogestor.app',
  appName: 'Autogestor',
  webDir: 'out',
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: true,
        },
      }
    : {}),
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#030712', // gray-950 to match app theme
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#030712',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#030712',
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#030712',
    preferredContentMode: 'mobile',
  },
};

export default config;
