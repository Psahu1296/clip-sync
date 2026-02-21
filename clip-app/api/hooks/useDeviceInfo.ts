import { useEffect, useState } from 'react';
import { DeviceInfo, getDeviceInfo, getDeviceInfoSync } from '@/utils/device';

interface UseDeviceInfoReturn {
  /** Complete device info (null until loaded) */
  deviceInfo: DeviceInfo | null;
  /** Whether device info is loading */
  isLoading: boolean;
  /** Synchronous device info (without deviceId) */
  syncInfo: Omit<DeviceInfo, 'deviceId'>;
  /** Refresh device info */
  refresh: () => Promise<void>;
}

/**
 * Hook to access device information
 */
export function useDeviceInfo(): UseDeviceInfoReturn {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDeviceInfo = async () => {
    setIsLoading(true);
    try {
      const info = await getDeviceInfo();
      setDeviceInfo(info);
    } catch (error) {
      console.error('Error loading device info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  return {
    deviceInfo,
    isLoading,
    syncInfo: getDeviceInfoSync(),
    refresh: loadDeviceInfo,
  };
}
