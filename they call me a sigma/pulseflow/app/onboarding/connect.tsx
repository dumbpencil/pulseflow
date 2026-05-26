import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WifiHigh, WifiMedium, WifiLow } from 'phosphor-react-native';
import { ScanningAnimation } from '../../src/components/device/ScanningAnimation';
import { Button } from '../../src/components/ui/Button';
import { useBLE, PairingState } from '../../src/hooks/useBLE';
import { BLEDevice, rssiToSignalTier } from '../../src/services/ble/BLEAdapter';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { spacing } from '../../src/constants/spacing';

export default function OnboardingConnectScreen() {
  const router = useRouter();
  const { startScan, stopScan, connect } = useBLE();
  const [state, setState] = useState<PairingState>({ status: 'idle' });

  const handleScan = useCallback(() => {
    startScan(setState);
  }, [startScan]);

  const handleConnect = useCallback(
    (deviceId: string) => {
      stopScan();
      connect(deviceId, (s) => {
        setState(s);
        if (s.status === 'connected') {
          setTimeout(() => router.push('/onboarding/profile'), 1200);
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
      <View style={styles.content}>
        <Text style={styles.step}>STEP 2 OF 3</Text>
        <Text style={styles.title}>Connect Your Wrap</Text>
        <Text style={styles.body}>
          Power on your PulseFlow Wrap and keep it within range.
        </Text>

        {(state.status === 'scanning' || state.status === 'found') && (
          <>
            <ScanningAnimation />
            <Text style={styles.scanStatus}>
              {state.status === 'scanning' ? 'Searching…' : `Found ${devices.length} device(s)`}
            </Text>
          </>
        )}
        {state.status === 'connecting' && (
          <>
            <ScanningAnimation />
            <Text style={styles.scanStatus}>Connecting…</Text>
          </>
        )}
        {state.status === 'connected' && (
          <Text style={styles.connected}>Device Connected ✓</Text>
        )}
        {state.status === 'error' && (
          <Text style={styles.error}>
            {state.type === 'bluetooth_off'
              ? 'Bluetooth is off. Enable it and try again.'
              : 'Could not connect. Try again.'}
          </Text>
        )}

        {devices.length > 0 && (
          <FlatList
            data={devices}
            keyExtractor={(d) => d.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.deviceRow}
                onPress={() => handleConnect(item.id)}
              >
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.connectLabel}>Tap to connect</Text>
              </TouchableOpacity>
            )}
            style={styles.deviceList}
          />
        )}
      </View>

      <View style={styles.footer}>
        {state.status === 'idle' || state.status === 'error' ? (
          <Button label="Scan for Devices" onPress={handleScan} />
        ) : null}
        <Button
          label="Skip"
          variant="ghost"
          onPress={() => router.push('/onboarding/profile')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.deep },
  content: { flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  step: {
    fontFamily: fonts.condensed,
    fontSize: 11,
    color: colors.accent.primary,
    letterSpacing: 3,
  },
  title: {
    fontFamily: fonts.condensed,
    fontSize: 28,
    color: colors.text.primary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  scanStatus: {
    fontFamily: fonts.condensed,
    fontSize: 16,
    color: colors.text.secondary,
    letterSpacing: 1,
  },
  connected: {
    fontFamily: fonts.condensed,
    fontSize: 20,
    color: colors.accent.primary,
    letterSpacing: 1,
  },
  error: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.accent.danger,
    textAlign: 'center',
  },
  deviceList: { width: '100%' },
  deviceRow: {
    backgroundColor: colors.background.card,
    borderRadius: 10,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  deviceName: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text.primary },
  connectLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.accent.primary },
  footer: { padding: spacing.xl, gap: spacing.sm },
});
