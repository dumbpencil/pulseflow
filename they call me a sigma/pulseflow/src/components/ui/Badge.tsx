import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fonts } from '../../constants/fonts';

type Variant = 'primary' | 'warning' | 'danger' | 'neutral' | 'simulated';

type Props = {
  label: string;
  variant?: Variant;
  style?: ViewStyle;
};

export function Badge({ label, variant = 'neutral', style }: Props) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  primary: { backgroundColor: `${colors.accent.primary}22` },
  warning: { backgroundColor: `${colors.accent.warning}22` },
  danger: { backgroundColor: `${colors.accent.danger}22` },
  neutral: { backgroundColor: colors.background.elevated },
  simulated: { backgroundColor: `${colors.accent.warning}22`, borderWidth: 1, borderColor: colors.accent.warning },

  label: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 0.5 },
  primaryLabel: { color: colors.accent.primary },
  warningLabel: { color: colors.accent.warning },
  dangerLabel: { color: colors.accent.danger },
  neutralLabel: { color: colors.text.secondary },
  simulatedLabel: { color: colors.accent.warning },
});
