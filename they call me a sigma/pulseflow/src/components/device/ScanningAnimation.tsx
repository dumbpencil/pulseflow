import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

const RING_COUNT = 3;
const BASE_SIZE = 60;
const RING_GAP = 36;

function Ring({ index }: { index: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    const delay = index * 400;
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1 + (index + 1) * 0.4, {
          duration: 1600,
          easing: Easing.out(Easing.quad),
        }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 1600, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
  }, [index]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const size = BASE_SIZE + index * RING_GAP;

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          position: 'absolute',
        },
        animStyle,
      ]}
    />
  );
}

export function ScanningAnimation() {
  return (
    <View style={styles.container}>
      {Array.from({ length: RING_COUNT }, (_, i) => (
        <Ring key={i} index={i} />
      ))}
      <View style={styles.center} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: BASE_SIZE + RING_COUNT * RING_GAP + 40,
    height: BASE_SIZE + RING_COUNT * RING_GAP + 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderWidth: 1.5,
    borderColor: colors.accent.primary,
  },
  center: {
    width: BASE_SIZE,
    height: BASE_SIZE,
    borderRadius: BASE_SIZE / 2,
    backgroundColor: `${colors.accent.primary}22`,
    borderWidth: 2,
    borderColor: colors.accent.primary,
  },
});
