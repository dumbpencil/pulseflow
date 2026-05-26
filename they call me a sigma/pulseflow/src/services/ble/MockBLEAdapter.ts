import { BLEAdapter, BLEDevice, PairingFailedError } from './BLEAdapter';
import { DeviceState } from '../../types';

export class MockBLEAdapter implements BLEAdapter {
  private scanTimer: ReturnType<typeof setTimeout> | null = null;

  async isBluetoothEnabled(): Promise<boolean> {
    return true;
  }

  startScan(onDevice: (device: BLEDevice) => void): void {
    this.scanTimer = setTimeout(() => {
      onDevice({
        id: 'mock-device-A4',
        name: 'PulseFlow Wrap #A4',
        rssi: -65,
      });
    }, 2000);
  }

  stopScan(): void {
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }

  async connect(_deviceId: string): Promise<DeviceState> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      connected: true,
      batteryPercent: 78,
      firmwareVersion: '2.1.4',
      lastSyncTimestamp: new Date().toISOString(),
      rssi: -65,
      simulated: true,
    };
  }

  async disconnect(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}
