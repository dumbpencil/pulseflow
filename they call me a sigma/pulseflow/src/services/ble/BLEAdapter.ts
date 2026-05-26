import { DeviceState } from '../../types';

export type BLEDevice = {
  id: string;
  name: string;
  rssi: number;
};

export interface BLEAdapter {
  startScan(onDevice: (device: BLEDevice) => void): void;
  stopScan(): void;
  connect(deviceId: string): Promise<DeviceState>;
  disconnect(): Promise<void>;
  isBluetoothEnabled(): Promise<boolean>;
}

export class BluetoothOffError extends Error {
  constructor() {
    super('Bluetooth is turned off');
    this.name = 'BluetoothOffError';
  }
}

export class DeviceNotFoundError extends Error {
  constructor() {
    super('Device not found during scan');
    this.name = 'DeviceNotFoundError';
  }
}

export class PairingFailedError extends Error {
  constructor() {
    super('Failed to connect to device');
    this.name = 'PairingFailedError';
  }
}

export function rssiToSignalTier(
  rssi: number
): 'excellent' | 'good' | 'weak' | 'very_weak' {
  if (rssi > -60) return 'excellent';
  if (rssi > -75) return 'good';
  if (rssi > -85) return 'weak';
  return 'very_weak';
}
