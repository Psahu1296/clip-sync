import { Platform } from 'react-native';
import { requireNativeModule, EventEmitter } from 'expo-modules-core';

const LINKING_ERROR =
  `The package 'clipboard-accessibility' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go (this requires a development build)\n';

interface PendingClip {
  content: string;
  timestamp: number;
}

// Try to get the native module, fallback to mock for Expo Go
let ClipboardAccessibilityModule: any;
let expoEventEmitter: EventEmitter | null = null;

// Position constants for floating button
export const FloatingButtonPosition = {
  TOP_LEFT: 0,
  TOP_RIGHT: 1,
  BOTTOM_LEFT: 2,
  BOTTOM_RIGHT: 3,
} as const;

export type FloatingButtonPositionType = typeof FloatingButtonPosition[keyof typeof FloatingButtonPosition];

try {
  ClipboardAccessibilityModule = requireNativeModule('ClipboardAccessibility');
  expoEventEmitter = new EventEmitter(ClipboardAccessibilityModule);
} catch (e) {
  ClipboardAccessibilityModule = {
    isServiceEnabled: async () => false,
    openAccessibilitySettings: () => {
      console.warn('Accessibility service requires a development build');
    },
    isOverlayPermissionGranted: async () => false,
    openOverlaySettings: () => {
      console.warn('Overlay permission requires a development build');
    },
    getFloatingButtonPosition: async () => FloatingButtonPosition.BOTTOM_RIGHT,
    setFloatingButtonPosition: () => {},
    getPendingClips: async () => [],
    clearPendingClips: () => {},
  };
}

class ClipboardAccessibility {
  /**
   * Check if the accessibility service is currently enabled
   */
  async isServiceEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      return await ClipboardAccessibilityModule.isServiceEnabled();
    } catch (error) {
      console.error('Error checking accessibility service status:', error);
      return false;
    }
  }

  /**
   * Open Android accessibility settings
   */
  openAccessibilitySettings(): void {
    if (Platform.OS !== 'android') {
      console.warn('Accessibility settings are only available on Android');
      return;
    }

    ClipboardAccessibilityModule.openAccessibilitySettings();
  }

  /**
   * Check if overlay (draw over apps) permission is granted
   */
  async isOverlayPermissionGranted(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return false;
    }

    try {
      return await ClipboardAccessibilityModule.isOverlayPermissionGranted();
    } catch (error) {
      console.error('Error checking overlay permission:', error);
      return false;
    }
  }

  /**
   * Open overlay permission settings
   */
  openOverlaySettings(): void {
    if (Platform.OS !== 'android') {
      console.warn('Overlay settings are only available on Android');
      return;
    }

    ClipboardAccessibilityModule.openOverlaySettings();
  }

  /**
   * Get the current floating button position
   * @returns Position constant (0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right)
   */
  async getFloatingButtonPosition(): Promise<FloatingButtonPositionType> {
    if (Platform.OS !== 'android') {
      return FloatingButtonPosition.BOTTOM_RIGHT;
    }

    try {
      return await ClipboardAccessibilityModule.getFloatingButtonPosition();
    } catch (error) {
      console.error('Error getting floating button position:', error);
      return FloatingButtonPosition.BOTTOM_RIGHT;
    }
  }

  /**
   * Set the floating button position
   * @param position Position constant (0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right)
   */
  setFloatingButtonPosition(position: FloatingButtonPositionType): void {
    if (Platform.OS !== 'android') {
      console.warn('Floating button settings are only available on Android');
      return;
    }

    try {
      ClipboardAccessibilityModule.setFloatingButtonPosition(position);
    } catch (error) {
      console.error('Error setting floating button position:', error);
    }
  }

  /**
   * Get clips that were captured while the app was in the background
   * @returns Array of pending clips with content and timestamp
   */
  async getPendingClips(): Promise<PendingClip[]> {
    if (Platform.OS !== 'android') {
      return [];
    }

    try {
      return await ClipboardAccessibilityModule.getPendingClips();
    } catch (error) {
      console.error('Error getting pending clips:', error);
      return [];
    }
  }

  /**
   * Clear pending clips after they've been processed
   */
  clearPendingClips(): void {
    if (Platform.OS !== 'android') {
      return;
    }

    try {
      ClipboardAccessibilityModule.clearPendingClips();
    } catch (error) {
      console.error('Error clearing pending clips:', error);
    }
  }

  /**
   * Listen for clipboard changes from the accessibility service
   * @param callback Function to call when clipboard changes
   * @returns Subscription object with remove() method
   */
  addClipboardListener(callback: (content: string) => void) {
    if (!expoEventEmitter || Platform.OS !== 'android') {
      console.warn('Clipboard accessibility requires a development build on Android');
      return {
        remove: () => {},
      };
    }

    const subscription = expoEventEmitter.addListener(
      'onClipboardChange',
      (event: { content: string; timestamp: number }) => {
        callback(event.content);
      }
    );

    return subscription;
  }
}

export default new ClipboardAccessibility();
