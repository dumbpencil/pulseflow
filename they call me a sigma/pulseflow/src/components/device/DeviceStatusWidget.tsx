import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BatteryHigh, WifiHigh, Link, LinkBreak } from 'phosphor-react-native';
import { useProfileStore } from '../../stores/profileStore';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { Badge } from '../ui/Badge';

type Props = {
  onConnectPress: () => void;
};

export function DeviceStatusWidget({ onConnectPress }: Props) {
  const device = useProfileStore((s) => s.device);

  if (!device.connected) {
    return (
      <TouchableOpacity style={styles.container} onPress={onConnectPress} activeOpacity={0.8}>
        <LinkBreak size={20} color={colors.text.secondary} weight="regular" />
        <Text style={styles.disconnectedText}>No device connected</Text>
        <Text style={styles.connectCta}>Connect →</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Link size={16} color={colors.accent.primary} weight="bold" />
        <Text style={styles.connectedLabel}>PulseFlow Wrap</Text>
        {device.simulated && <Badge label="Simulated" variant="simulated" />}
      </View>
      <View style={styles.statsRow}>
        {device.batteryPercent !== null && (
          <View style={styles.stat}>
            <BatteryHigh size={14} color={colors.text.secondary} weight="regular" />
            <Text style={styles.statValue}>{device.batteryPercent}%</Text>
          </View>
        )}
        {device.firmwareVersion && (
          <Text style={styles.firmware}>fw {device.firmwareVersion}</Text>
        )}
        {device.lastSyncTimestamp && (
          <Text style={styles.sync}>
            synced{' '}
            {new Date(device.lastSyncTimestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  connectedLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  disconnectedText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  connectCta: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.accent.primary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.text.secondary,
  },
  firmware: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.text.secondary,
  },
  sync: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.text.secondary,
  },
});
