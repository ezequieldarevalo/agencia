import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';

/**
 * Initialize Capacitor native plugins.
 * Call this once from the root client component.
 */
export async function initCapacitor() {
  if (!Capacitor.isNativePlatform()) return;

  // Mark body for native-specific CSS
  document.body.classList.add('capacitor');

  // Status bar: dark content on dark background
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#030712' });
  } catch {
    // StatusBar not available on this platform
  }

  // Keyboard: scroll into view when keyboard opens
  try {
    Keyboard.addListener('keyboardWillShow', () => {
      document.body.classList.add('keyboard-open');
    });
    Keyboard.addListener('keyboardWillHide', () => {
      document.body.classList.remove('keyboard-open');
    });
  } catch {
    // Keyboard plugin not available
  }

  // Handle back button on Android
  try {
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch {
    // App plugin not available
  }

  // Hide splash screen after app is ready
  try {
    await SplashScreen.hide();
  } catch {
    // SplashScreen not available
  }
}

/**
 * Check if running inside a native Capacitor shell.
 */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get the current platform: 'ios' | 'android' | 'web'
 */
export function getPlatform(): string {
  return Capacitor.getPlatform();
}
