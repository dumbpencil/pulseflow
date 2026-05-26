import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { X } from 'phosphor-react-native';
import { useSessionStore } from '../src/stores/sessionStore';
import { useReadinessStore } from '../src/stores/readinessStore';
import { useProfileStore } from '../src/stores/profileStore';
import { colors, sorenessColor } from '../src/constants/colors';
import { fonts } from '../src/constants/fonts';
import { spacing } from '../src/constants/spacing';

type Phase = 'active' | 'scoring';

export default function SessionScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('active');
  const [soreness, setSoreness] = useState(5);
  const tickElapsed = useSessionStore((s) => s.tickElapsed);
  const activeSession = useSessionStore((s) => s.activeSession);
  const endSession = useSessionStore((s) => s.endSession);
  const logReadiness = useReadinessStore((s) => s.logReadiness);
  const device = useProfileStore((s) => s.device);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const elapsed = activeSession?.elapsedSeconds ?? 0;
  const modality = activeSession?.modality ?? 'vibration';

  const MODALITY_LABELS: Record<string, string> = {
    vibration: 'Vibration',
    thermal: 'Thermal',
    cold: 'Cold',
  };

  useEffect(() => {
    timerRef.current = setInterval(() => tickElapsed(), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tickElapsed]);

  function formatElapsed(secs: number) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function handleEndSession() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('scoring');
  }

  async function handleFinish() {
    const session = endSession(soreness);
    if (session) {
      logReadiness({
        sorenessScore: soreness,
        sleepQuality: 3,
        deviceConnected: device.connected,
      });
    }
    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.modalityLabel}>{MODALITY_LABELS[modality]}</Text>
        {phase === 'active' && (
          <TouchableOpacity
            onPress={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              router.back();
            }}
            style={styles.closeBtn}
          >
            <X size={22} color={colors.text.secondary} weight="regular" />
          </TouchableOpacity>
        )}
      </View>

      {phase === 'active' && (
        <View style={styles.activeContent}>
          <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
          <Text style={styles.timerLabel}>ELAPSED</Text>

          <View style={styles.intensitySection}>
            <Text style={styles.intensityLabel}>INTENSITY</Text>
            <Text style={styles.intensityValue}>{activeSession?.intensity ?? 5}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={activeSession?.intensity ?? 5}
              onValueChange={(v) =>
                useSessionStore.getState().updateIntensity(Math.round(v))
              }
              minimumTrackTintColor={colors.accent.primary}
              maximumTrackTintColor={colors.background.elevated}
              thumbTintColor={colors.accent.primary}
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderEdge}>Low</Text>
              <Text style={styles.sliderEdge}>High</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
            <Text style={styles.endButtonText}>End Session</Text>
          </TouchableOpacity>
        </View>
      )}

      {phase === 'scoring' && (
        <View style={styles.scoringContent}>
          <Text style={styles.scoringTitle}>How sore do you feel?</Text>
          <Text style={styles.scoringSubtitle}>Rate your current soreness level</Text>

          <Text style={[styles.sorenessDisplay, { color: sorenessColor(soreness) }]}>
            {soreness}
          </Text>
          <Text style={styles.sorenessOutOf}>/10</Text>

          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={soreness}
            onValueChange={(v) => setSoreness(Math.round(v))}
            minimumTrackTintColor={sorenessColor(soreness)}
            maximumTrackTintColor={colors.background.elevated}
            thumbTintColor={sorenessColor(soreness)}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderEdge}>No pain</Text>
            <Text style={styles.sliderEdge}>Max pain</Text>
          </View>

          <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
            <Text style={styles.finishButtonText}>Save Session</Text>
          </TouchableOpacity>
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
  },
  modalityLabel: {
    fontFamily: fonts.condensed,
    fontSize: 16,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  closeBtn: { padding: spacing.sm },
  activeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  timer: {
    fontFamily: fonts.mono,
    fontSize: 72,
    color: colors.text.primary,
    letterSpacing: 4,
  },
  timerLabel: {
    fontFamily: fonts.condensed,
    fontSize: 11,
    color: colors.text.secondary,
    letterSpacing: 3,
    marginTop: -spacing.lg,
  },
  intensitySection: {
    width: '100%',
    gap: spacing.sm,
    alignItems: 'center',
  },
  intensityLabel: {
    fontFamily: fonts.condensed,
    fontSize: 11,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  intensityValue: {
    fontFamily: fonts.mono,
    fontSize: 36,
    color: colors.text.primary,
  },
  slider: { width: '100%', height: 40 },
  sliderLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.sm,
  },
  sliderEdge: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.text.secondary,
  },
  endButton: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  endButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    color: colors.text.primary,
  },
  scoringContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  scoringTitle: {
    fontFamily: fonts.condensed,
    fontSize: 26,
    color: colors.text.primary,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scoringSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  sorenessDisplay: {
    fontFamily: fonts.mono,
    fontSize: 80,
    lineHeight: 88,
    marginTop: spacing.lg,
  },
  sorenessOutOf: {
    fontFamily: fonts.mono,
    fontSize: 18,
    color: colors.text.secondary,
    marginTop: -spacing.md,
  },
  finishButton: {
    width: '100%',
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.accent.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  finishButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.background.deep,
    letterSpacing: 0.5,
  },
});
