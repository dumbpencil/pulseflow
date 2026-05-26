import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export function Separator() {
  return <View style={styles.line} />;
}

const styles = StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: colors.background.elevated,
  },
});
