import { useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { BLEAdapter, BLEDevice, BluetoothOffError, DeviceNotFoundError, PairingFailedError } from '../services/ble/BLEAdapter';
import { MockBLEAdapter } from '../services/ble/MockBLEAdapter';
import { RealBLEAdapter } from '../services/ble/RealBLEAdapter';
import { useProfileStore } from '../stores/profileStore';

export type PairingState =
  | { status: 'idle' }
  | { status: 'scanning'; devices: BLEDevice[] }
  | { status: 'found'; devices: BLEDevice[] }
  | { status: 'connecting'; deviceId: string }
  | { status: 'connected' }
  | { status: 'error'; type: 'bluetooth_off' | 'not_found' | 'pairing_failed' };

let adapterInstance: BLEAdapter | null = null;

function getAdapter(): BLEAdapter {
  if (!adapterInstance) {
    adapterInstance =
      Platform.OS === 'ios' || Platform.OS === 'android'
        ? new RealBLEAdapter()
        : new MockBLEAdapter();
  }
  return adapterInstance;
}

export function useBLE() {
  const setDevice = useProfileStore((s) => s.setDevice);
  const adapterRef = useRef<BLEAdapter>(getAdapter());

  const startScan = useCallback(
    (onStateChange: (state: PairingState) => void) => {
      onStateChange({ status: 'scanning', devices: [] });
      const discovered: BLEDevice[] = [];

      adapterRef.current.startScan((device) => {
        if (!discovered.find((d) => d.id === device.id)) {
          discovered.push(device);
        }
        onStateChange({ status: 'found', devices: [...discovered] });
      });
    },
    []
  );

  const stopScan = useCallback(() => {
    adapterRef.current.stopScan();
  }, []);

  const connect = useCallback(
    async (
      deviceId: string,
      onStateChange: (state: PairingState) => void
    ) => {
      onStateChange({ status: 'connecting', deviceId });
      try {
        const enabled = await adapterRef.current.isBluetoothEnabled();
        if (!enabled) {
          onStateChange({ status: 'error', type: 'bluetooth_off' });
          return;
        }
        const deviceState = await adapterRef.current.connect(deviceId);
        setDevice(deviceState);
        onStateChange({ status: 'connected' });
      } catch (err) {
        if (err instanceof BluetoothOffError) {
          onStateChange({ status: 'error', type: 'bluetooth_off' });
        } else if (err instanceof DeviceNotFoundError) {
          onStateChange({ status: 'error', type: 'not_found' });
        } else {
          onStateChange({ status: 'error', type: 'pairing_failed' });
        }
      }
    },
    [setDevice]
  );

  const disconnect = useCallback(async () => {
    await adapterRef.current.disconnect();
    useProfileStore.getState().resetDevice();
  }, []);

  return { startScan, stopScan, connect, disconnect };
}
