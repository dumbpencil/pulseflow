import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { spacing } from '../../src/constants/spacing';

const FEATURES = [
  { icon: '⚡', label: 'Track recovery sessions' },
  { icon: '📊', label: 'Monitor soreness trends' },
  { icon: '🔗', label: 'Connect your PulseFlow Wrap' },
  { icon: '👥', label: 'Coach team dashboards' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.wordmark}>PULSEFLOW</Text>
          <Text style={styles.tagline}>Athlete Recovery, Optimized.</Text>
        </View>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          label="Get Started"
          onPress={() => router.push('/onboarding/connect')}
        />
        <Button
          label="Skip for now"
          variant="ghost"
          onPress={async () => {
            const SecureStore = await import('expo-secure-store');
            await SecureStore.setItemAsync('onboarding_complete', 'true');
            router.replace('/');
          }}
          style={styles.skipBtn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.deep },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl, gap: spacing.xxxl },
  hero: { alignItems: 'center', gap: spacing.sm },
  wordmark: {
    fontFamily: fonts.condensed,
    fontSize: 44,
    color: colors.accent.primary,
    letterSpacing: 8,
  },
  tagline: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text.secondary,
  },
  features: { gap: spacing.lg },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: { fontSize: 22 },
  featureLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.text.primary,
  },
  footer: { padding: spacing.xl, gap: spacing.sm },
  skipBtn: { marginTop: spacing.xs },
});
