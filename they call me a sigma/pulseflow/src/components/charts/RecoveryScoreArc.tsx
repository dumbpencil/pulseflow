import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, recoveryColor } from '../../constants/colors';
import { fonts } from '../../constants/fonts';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Variant = 'hero' | 'summary';

type Props = {
  score: number;
  variant?: Variant;
};

const SIZE = { hero: 220, summary: 140 };
const STROKE = { hero: 12, summary: 8 };

function polarToXY(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
): string {
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function RecoveryScoreArc({ score, variant = 'hero' }: Props) {
  const size = SIZE[variant];
  const stroke = STROKE[variant];
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - stroke - 4;

  const START = -135;
  const END = 135;
  const TOTAL = END - START;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(score / 100, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [score]);

  const trackPath = arcPath(cx, cy, r, START, END);
  const accentColor = recoveryColor(score);

  const animatedProps = useAnimatedProps(() => {
    const sweepDeg = START + TOTAL * progress.value;
    return {
      d: arcPath(cx, cy, r, START, Math.max(START + 1, sweepDeg)),
    };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Path
          d={trackPath}
          stroke={colors.background.elevated}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
        <AnimatedPath
          animatedProps={animatedProps}
          stroke={accentColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
      <Text style={[styles.score, variant === 'summary' && styles.scoreSmall]}>
        {score}
      </Text>
      <Text style={[styles.label, variant === 'summary' && styles.labelSmall]}>
        RECOVERY
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  score: {
    fontFamily: fonts.mono,
    fontSize: 48,
    color: colors.text.primary,
    lineHeight: 52,
  },
  scoreSmall: { fontSize: 30, lineHeight: 34 },
  label: {
    fontFamily: fonts.condensed,
    fontSize: 13,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  labelSmall: { fontSize: 10 },
});
