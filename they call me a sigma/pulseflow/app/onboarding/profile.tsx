import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { useProfileStore } from '../../src/stores/profileStore';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { spacing } from '../../src/constants/spacing';

const SPORTS = [
  'Basketball', 'Swimming', 'Track', 'Volleyball',
  'Soccer', 'Gymnastics', 'Football', 'Tennis',
];

const GOALS = [
  'Reduce soreness', 'Improve sleep',
  'Build streak', 'Enhance performance', 'Faster recovery',
];

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const saveProfile = useProfileStore((s) => s.saveProfile);
  const [sport, setSport] = useState('');
  const [goals, setGoals] = useState<string[]>([]);

  function toggleGoal(g: string) {
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }

  async function handleFinish() {
    saveProfile({
      id: 'self',
      name: 'Athlete',
      teamSchool: '',
      sport,
      goals,
      planTier: 'free',
    });

    await Notifications.requestPermissionsAsync();
    await SecureStore.setItemAsync('onboarding_complete', 'true');
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.step}>STEP 3 OF 3</Text>
        <Text style={styles.title}>Your Sport & Goals</Text>

        <Text style={styles.sectionLabel}>SPORT</Text>
        <View style={styles.grid}>
          {SPORTS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, sport === s && styles.chipActive]}
              onPress={() => setSport(s)}
            >
              <Text style={[styles.chipLabel, sport === s && styles.chipLabelActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>GOALS (pick any)</Text>
        <View style={styles.goalsWrap}>
          {GOALS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, goals.includes(g) && styles.chipActive]}
              onPress={() => toggleGoal(g)}
            >
              <Text style={[styles.chipLabel, goals.includes(g) && styles.chipLabelActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.notifNote}>
          We'll ask for notification permission to send daily recovery reminders.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Finish Setup" onPress={handleFinish} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.deep },
  content: { padding: spacing.xl, gap: spacing.lg },
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
  },
  sectionLabel: {
    fontFamily: fonts.condensed,
    fontSize: 11,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  goalsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: `${colors.accent.primary}22`,
    borderColor: colors.accent.primary,
  },
  chipLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.text.secondary,
  },
  chipLabelActive: { color: colors.accent.primary },
  notifNote: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  footer: { padding: spacing.xl },
});
