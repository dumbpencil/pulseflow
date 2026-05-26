import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Separator } from '../../src/components/ui/Separator';
import { useProfileStore } from '../../src/stores/profileStore';
import { useSessionStore } from '../../src/stores/sessionStore';
import { csvExport } from '../../src/utils/export';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { spacing } from '../../src/constants/spacing';

const SPORTS = ['Basketball', 'Swimming', 'Track', 'Volleyball', 'Soccer', 'Gymnastics', 'Football', 'Tennis', 'Baseball', 'Softball'];
const GOALS = ['Reduce soreness', 'Improve sleep', 'Build streak', 'Enhance performance', 'Faster recovery'];

function SettingsRow({
  label,
  value,
  onPress,
  right,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={rowStyles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={rowStyles.label}>{label}</Text>
      {right ?? (value ? <Text style={rowStyles.value}>{value}</Text> : null)}
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background.card,
  },
  label: { fontFamily: fonts.sans, fontSize: 15, color: colors.text.primary },
  value: { fontFamily: fonts.sans, fontSize: 14, color: colors.text.secondary },
});

export default function SettingsScreen() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const device = useProfileStore((s) => s.device);
  const resetDevice = useProfileStore((s) => s.resetDevice);
  const sessions = useSessionStore((s) => s.sessions);
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then((perm) => {
      setNotifEnabled(perm.granted);
    });
  }, []);

  async function handleExport() {
    try {
      await csvExport(sessions);
    } catch {
      Alert.alert('Export Failed', 'Could not export your data.');
    }
  }

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('auth_token');
          router.replace('/login');
        },
      },
    ]);
  }

  function handleResetDevice() {
    Alert.alert('Reset Device', 'Disconnect and reset device data?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => resetDevice(),
      },
    ]);
  }

  const sections = [
    {
      title: 'PROFILE',
      data: [
        {
          key: 'name',
          label: 'Name',
          value: profile?.name ?? 'Not set',
        },
        {
          key: 'sport',
          label: 'Sport',
          value: profile?.sport ?? 'Not set',
        },
        {
          key: 'plan',
          label: 'Plan',
          right: (
            <Badge
              label={profile?.planTier === 'premium' ? 'Premium' : 'Free'}
              variant={profile?.planTier === 'premium' ? 'primary' : 'neutral'}
            />
          ),
        },
        {
          key: 'goals',
          label: 'Goals',
          value: profile?.goals.slice(0, 2).join(', ') ?? 'None',
        },
      ],
    },
    {
      title: 'DEVICE',
      data: [
        {
          key: 'firmware',
          label: 'Firmware',
          value: device.firmwareVersion ?? 'Not connected',
        },
        {
          key: 'connect',
          label: 'Manage Device',
          onPress: () => router.push('/pairing'),
          value: device.connected ? 'Connected' : 'Connect →',
        },
        {
          key: 'reset',
          label: 'Reset Device',
          onPress: handleResetDevice,
          right: <Text style={styles.destructiveValue}>Reset</Text>,
        },
      ],
    },
    {
      title: 'NOTIFICATIONS',
      data: [
        {
          key: 'notif',
          label: 'Daily Reminders',
          right: (
            <Switch
              value={notifEnabled}
              onValueChange={async (v) => {
                if (v) {
                  const result = await Notifications.requestPermissionsAsync();
                  setNotifEnabled(result.granted);
                } else {
                  setNotifEnabled(false);
                }
              }}
              trackColor={{ false: colors.background.elevated, true: colors.accent.primary }}
              thumbColor={colors.text.primary}
            />
          ),
        },
      ],
    },
    {
      title: 'DATA',
      data: [
        {
          key: 'export',
          label: 'Export Data (CSV)',
          onPress: handleExport,
          value: 'Export →',
        },
        {
          key: 'logout',
          label: 'Sign Out',
          onPress: handleLogout,
          right: <Text style={styles.destructiveValue}>Sign Out</Text>,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.key}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <SettingsRow
            label={item.label}
            value={'value' in item ? (item.value as string) : undefined}
            onPress={'onPress' in item ? (item.onPress as () => void) : undefined}
            right={'right' in item ? item.right : undefined}
          />
        )}
        SectionSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <Text style={styles.screenTitle}>Settings</Text>
        }
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.deep },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xs },
  screenTitle: {
    fontFamily: fonts.condensed,
    fontSize: 28,
    color: colors.text.primary,
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontFamily: fonts.condensed,
    fontSize: 11,
    color: colors.text.secondary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  destructiveValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.accent.danger,
  },
});
