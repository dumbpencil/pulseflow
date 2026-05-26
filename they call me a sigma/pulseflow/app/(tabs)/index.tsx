import React, { useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lightning, Thermometer, Snowflake } from 'phosphor-react-native';
import GBottomSheet from '@gorhom/bottom-sheet';
import { RecoveryScoreArc } from '../../src/components/charts/RecoveryScoreArc';
import { WeeklyActivityBars } from '../../src/components/charts/WeeklyActivityBars';
import { DeviceStatusWidget } from '../../src/components/device/DeviceStatusWidget';
import { BottomSheet } from '../../src/components/ui/BottomSheet';
import { useRecoveryScore } from '../../src/hooks/useRecoveryScore';
import { useWeeklySummary } from '../../src/hooks/useWeeklySummary';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { spacing } from '../../src/constants/spacing';
import { useSessionStore } from '../../src/stores/sessionStore';

type Modality = 'vibration' | 'thermal' | 'cold';

const MODALITIES: { key: Modality; label: string; icon: React.ElementType }[] = [
  { key: 'vibration', label: 'Vibration', icon: Lightning },
  { key: 'thermal', label: 'Thermal', icon: Thermometer },
  { key: 'cold', label: 'Cold', icon: Snowflake },
];

export default function HubScreen() {
  const router = useRouter();
  const sheetRef = useRef<GBottomSheet>(null);
  const { score, today } = useRecoveryScore();
  const weeklySummary = useWeeklySummary();
  const startSession = useSessionStore((s) => s.startSession);

  function handleStartSession(modality: Modality) {
    startSession(modality);
    sheetRef.current?.close();
    router.push('/session');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Recovery Hub</Text>

        <View style={styles.arcWrap}>
          <RecoveryScoreArc score={score} variant="hero" />
          {today && (
            <View style={styles.streakRow}>
              <Text style={styles.streakLabel}>DAY</Text>
              <Text style={styles.streakValue}>{today.streakDay}</Text>
              <Text style={styles.streakLabel}>STREAK</Text>
            </View>
          )}
        </View>

        <DeviceStatusWidget onConnectPress={() => router.push('/pairing')} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THIS WEEK</Text>
          <WeeklyActivityBars data={weeklySummary} />
        </View>

        <TouchableOpacity
          style={styles.startButton}
          onPress={() => sheetRef.current?.expand()}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>Start Session</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomSheet ref={sheetRef} snapPoints={['40%']}>
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Choose Modality</Text>
          <View style={styles.modalityRow}>
            {MODALITIES.map(({ key, label, icon: Icon }) => (
              <TouchableOpacity
                key={key}
                style={styles.modalityTile}
                onPress={() => handleStartSession(key)}
                activeOpacity={0.8}
              >
                <Icon size={28} color={colors.accent.primary} weight="bold" />
                <Text style={styles.modalityLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.deep },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  screenTitle: {
    fontFamily: fonts.condensed,
    fontSize: 28,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  arcWrap: { alignItems: 'center', gap: spacing.sm },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  streakLabel: {
    fontFamily: fonts.condensed,
    fontSize: 11,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  streakValue: {
    fontFamily: fonts.mono,
    fontSize: 22,
    color: colors.accent.primary,
  },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontFamily: fonts.condensed,
    fontSize: 11,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  startButton: {
    backgroundColor: colors.accent.primary,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  startButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.background.deep,
    letterSpacing: 0.5,
  },
  sheetContent: { padding: spacing.xl, gap: spacing.lg },
  sheetTitle: {
    fontFamily: fonts.condensed,
    fontSize: 20,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  modalityRow: { flexDirection: 'row', gap: spacing.md },
  modalityTile: {
    flex: 1,
    backgroundColor: colors.background.elevated,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalityLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text.primary,
  },
});
