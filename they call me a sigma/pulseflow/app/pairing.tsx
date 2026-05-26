import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, WifiHigh, WifiMedium, WifiLow, WifiSlash } from 'phosphor-react-native';
import { ScanningAnimation } from '../src/components/device/ScanningAnimation';
import { Button } from '../src/components/ui/Button';
import { useBLE, PairingState } from '../src/hooks/useBLE';
import { BLEDevice } from '../src/services/ble/BLEAdapter';
import { rssiToSignalTier } from '../src/services/ble/BLEAdapter';
import { colors } from '../src/constants/colors';
import { fonts } from '../src/constants/fonts';
import { spacing } from '../src/constants/spacing';

const SIGNAL_ICONS = {
  excellent: WifiHigh,
  good: WifiMedium,
  weak: WifiLow,
  very_weak: WifiSlash,
};

function DeviceItem({
  device,
  onPress,
}: {
  device: BLEDevice;
  onPress: () => void;
}) {
  const tier = rssiToSignalTier(device.rssi);
  const Icon = SIGNAL_ICONS[tier];
  return (
    <TouchableOpacity style={deviceStyles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={deviceStyles.info}>
        <Text style={deviceStyles.name}>{device.name}</Text>
        <Text style={deviceStyles.id}>{device.id.slice(0, 8).toUpperCase()}</Text>
      </View>
      <Icon size={18} color={colors.text.secondary} weight="regular" />
      <Text style={deviceStyles.rssi}>{device.rssi} dBm</Text>
      <Text style={deviceStyles.connect}>Connect</Text>
    </TouchableOpacity>
  );
}

const deviceStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: 10,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  info: { flex: 1 },
  name: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text.primary },
  id: { fontFamily: fonts.mono, fontSize: 10, color: colors.text.secondary, marginTop: 2 },
  rssi: { fontFamily: fonts.mono, fontSize: 11, color: colors.text.secondary },
  connect: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.accent.primary },
});

export default function PairingScreen() {
  const router = useRouter();
  const { startScan, stopScan, connect } = useBLE();
  const [state, setState] = useState<PairingState>({ status: 'idle' });

  const handleStartScan = useCallback(() => {
    startScan(setState);
  }, [startScan]);

  const handleConnect = useCallback(
    (deviceId: string) => {
      stopScan();
      connect(deviceId, (newState) => {
        setState(newState);
        if (newState.status === 'connected') {
          setTimeout(() => router.back(), 1200);
        }
      });
    },
    [connect, stopScan, router]
  );

  const devices =
    state.status === 'scanning' || state.status === 'found'
      ? state.devices
      : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Connect Device</Text>
        <TouchableOpacity onPress={router.back} style={styles.closeBtn}>
          <X size={22} color={colors.text.secondary} weight="regular" />
        </TouchableOpacity>
      </View>

      {state.status === 'idle' && (
        <View style={styles.idleContent}>
          <Text style={styles.body}>
            Make sure your PulseFlow Wrap is turned on and nearby.
          </Text>
          <Button label="Start Scanning" onPress={handleStartScan} style={styles.actionBtn} />
        </View>
      )}

      {(state.status === 'scanning' || state.status === 'found') && (
        <View style={styles.scanContent}>
          <ScanningAnimation />
          <Text style={styles.scanLabel}>
            {state.status === 'scanning' ? 'Scanning…' : `${devices.length} device${devices.length !== 1 ? 's' : ''} found`}
          </Text>
          {devices.length > 0 && (
            <FlatList
              data={devices}
              keyExtractor={(d) => d.id}
              renderItem={({ item }) => (
                <DeviceItem device={item} onPress={() => handleConnect(item.id)} />
              )}
              style={styles.deviceList}
            />
          )}
        </View>
      )}

      {state.status === 'connecting' && (
        <View style={styles.centeredContent}>
          <ScanningAnimation />
          <Text style={styles.scanLabel}>Connecting…</Text>
        </View>
      )}

      {state.status === 'connected' && (
        <View style={styles.centeredContent}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successLabel}>Connected!</Text>
          <Text style={styles.body}>Your PulseFlow Wrap is ready.</Text>
        </View>
      )}

      {state.status === 'error' && (
        <View style={styles.errorContent}>
          {state.type === 'bluetooth_off' && (
            <>
              <Text style={styles.errorTitle}>Bluetooth is Off</Text>
              <Text style={styles.errorBody}>
                Enable Bluetooth in your device settings, then try again.
              </Text>
            </>
          )}
          {state.type === 'not_found' && (
            <>
              <Text style={styles.errorTitle}>Device Not Found</Text>
              <Text style={styles.errorBody}>
                Make sure your wrap is powered on and in pairing mode.
              </Text>
            </>
          )}
          {state.type === 'pairing_failed' && (
            <>
              <Text style={styles.errorTitle}>Connection Failed</Text>
              <Text style={styles.errorBody}>
                Something went wrong while pairing. Try moving closer to the device.
              </Text>
            </>
          )}
          <Button
            label="Try Again"
            onPress={() => setState({ status: 'idle' })}
            style={styles.actionBtn}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.deep },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.condensed,
    fontSize: 24,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  closeBtn: { padding: spacing.sm },
  idleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  scanContent: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  scanLabel: {
    fontFamily: fonts.condensed,
    fontSize: 18,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  deviceList: { width: '100%' },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionBtn: { minWidth: 200 },
  successIcon: { fontSize: 56, color: colors.accent.primary },
  successLabel: {
    fontFamily: fonts.condensed,
    fontSize: 28,
    color: colors.accent.primary,
    letterSpacing: 1,
  },
  errorTitle: {
    fontFamily: fonts.condensed,
    fontSize: 22,
    color: colors.accent.danger,
    letterSpacing: 0.5,
  },
  errorBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});
