import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = '@clipapp_device_id';

export interface DeviceInfo {
  // Unique device identifier (persisted)
  deviceId: string;

  // Device name (e.g., "iPhone 14 Pro", "Samsung Galaxy S23")
  deviceName: string;

  // Device brand (e.g., "Apple", "Samsung", "Google")
  brand: string | null;

  // Device model identifier (e.g., "iPhone14,2")
  modelId: string | null;

  // Device model name (e.g., "iPhone 14 Pro")
  modelName: string | null;

  // OS name (e.g., "iOS", "Android")
  osName: string;

  // OS version (e.g., "16.0", "13")
  osVersion: string | null;

  // Device type
  deviceType: 'phone' | 'tablet' | 'desktop' | 'tv' | 'unknown';

  // Is physical device (not simulator/emulator)
  isPhysicalDevice: boolean;

  // App version
  appVersion: string | null;

  // App build number
  appBuildNumber: string | null;
}

/**
 * Get or create a persistent unique device ID
 */
export async function getDeviceId(): Promise<string> {
  try {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate new UUID for this device
      deviceId = uuidv4();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to a generated ID (won't persist across reinstalls)
    return uuidv4();
  }
}

/**
 * Get device type as a readable string
 */
function getDeviceType(): 'phone' | 'tablet' | 'desktop' | 'tv' | 'unknown' {
  switch (Device.deviceType) {
    case Device.DeviceType.PHONE:
      return 'phone';
    case Device.DeviceType.TABLET:
      return 'tablet';
    case Device.DeviceType.DESKTOP:
      return 'desktop';
    case Device.DeviceType.TV:
      return 'tv';
    default:
      return 'unknown';
  }
}

/**
 * Generate a human-readable device name
 */
function generateDeviceName(): string {
  const modelName = Device.modelName;
  const brand = Device.brand;

  if (modelName) {
    return modelName;
  }

  if (brand) {
    return `${brand} ${Platform.OS === 'ios' ? 'iPhone' : 'Device'}`;
  }

  return Platform.OS === 'ios' ? 'iPhone' : 'Android Device';
}

/**
 * Get complete device information
 */
export async function getDeviceInfo(): Promise<DeviceInfo> {
  const deviceId = await getDeviceId();

  return {
    deviceId,
    deviceName: generateDeviceName(),
    brand: Device.brand,
    modelId: Device.modelId,
    modelName: Device.modelName,
    osName: Device.osName || Platform.OS,
    osVersion: Device.osVersion,
    deviceType: getDeviceType(),
    isPhysicalDevice: Device.isDevice,
    appVersion: Application.nativeApplicationVersion,
    appBuildNumber: Application.nativeBuildVersion,
  };
}

/**
 * Get a short device description for display
 * e.g., "iPhone 14 Pro (iOS 16.0)"
 */
export async function getDeviceDescription(): Promise<string> {
  const info = await getDeviceInfo();
  const osInfo = info.osVersion ? `${info.osName} ${info.osVersion}` : info.osName;
  return `${info.deviceName} (${osInfo})`;
}

/**
 * Get device info synchronously (without device ID)
 * Useful when you need immediate access to device details
 */
export function getDeviceInfoSync(): Omit<DeviceInfo, 'deviceId'> {
  return {
    deviceName: generateDeviceName(),
    brand: Device.brand,
    modelId: Device.modelId,
    modelName: Device.modelName,
    osName: Device.osName || Platform.OS,
    osVersion: Device.osVersion,
    deviceType: getDeviceType(),
    isPhysicalDevice: Device.isDevice,
    appVersion: Application.nativeApplicationVersion,
    appBuildNumber: Application.nativeBuildVersion,
  };
}
