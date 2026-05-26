import { BleManager, Device, State } from 'react-native-ble-plx';
import {
  BLEAdapter,
  BLEDevice,
  BluetoothOffError,
  DeviceNotFoundError,
  PairingFailedError,
} from './BLEAdapter';
import { DeviceState } from '../../types';
import { PULSEFLOW_SERVICE_UUID } from '../../constants/ble';

export class RealBLEAdapter implements BLEAdapter {
  private manager: BleManager;
  private connectedDevice: Device | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  async isBluetoothEnabled(): Promise<boolean> {
    const state = await this.manager.state();
    return state === State.PoweredOn;
  }

  startScan(onDevice: (device: BLEDevice) => void): void {
    this.manager.startDeviceScan(
      [PULSEFLOW_SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error || !device) return;
        if (device.name?.startsWith('PulseFlow')) {
          onDevice({
            id: device.id,
            name: device.name ?? device.id,
            rssi: device.rssi ?? -100,
          });
        }
      }
    );
  }

  stopScan(): void {
    this.manager.stopDeviceScan();
  }

  async connect(deviceId: string): Promise<DeviceState> {
    try {
      const enabled = await this.isBluetoothEnabled();
      if (!enabled) throw new BluetoothOffError();

      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;

      return {
        connected: true,
        batteryPercent: null,
        firmwareVersion: null,
        lastSyncTimestamp: new Date().toISOString(),
        rssi: device.rssi ?? null,
        simulated: false,
      };
    } catch (error) {
      if (error instanceof BluetoothOffError) throw error;
      throw new PairingFailedError();
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
  }
}
