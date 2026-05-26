import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { fonts } from '../../constants/fonts';
import { Button } from './Button';

type Props = {
  icon?: React.ReactNode;
  headline: string;
  body?: string;
  ctaLabel?: string;
  onCta?: () => void;
};

export function EmptyState({ icon, headline, body, ctaLabel, onCta }: Props) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text style={styles.headline}>{headline}</Text>
      {body && <Text style={styles.body}>{body}</Text>}
      {ctaLabel && onCta && (
        <Button label={ctaLabel} onPress={onCta} style={styles.cta} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconWrap: {
    marginBottom: spacing.sm,
    opacity: 0.4,
  },
  headline: {
    fontFamily: fonts.condensed,
    fontSize: 20,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  cta: {
    marginTop: spacing.sm,
    minWidth: 160,
  },
});
