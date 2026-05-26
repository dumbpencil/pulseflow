import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';
import { colors, sorenessColor } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { spacing } from '../../constants/spacing';
import { DailyReadiness } from '../../types';
import { formatDisplayDate } from '../../utils/date';

type Props = {
  data: DailyReadiness[];
  onDayPress?: (readiness: DailyReadiness) => void;
};

export function SorenessTrendChart({ data, onDayPress }: Props) {
  const chartData = data.map((d, i) => ({
    x: i + 1,
    y: d.sorenessScore,
    date: d.date,
    readiness: d,
  }));

  const barColors = chartData.map((d) => sorenessColor(d.y));

  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No soreness data yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VictoryChart
        height={160}
        padding={{ top: 8, bottom: 32, left: 24, right: 16 }}
        domainPadding={{ x: 12 }}
      >
        <VictoryAxis
          tickFormat={(t: number) => {
            const item = chartData[t - 1];
            if (!item) return '';
            const parts = item.date.split('-');
            return `${parts[1]}/${parts[2]}`;
          }}
          style={{
            axis: { stroke: 'none' },
            tickLabels: {
              fill: colors.text.secondary,
              fontSize: 10,
              fontFamily: fonts.mono,
            },
          }}
        />
        <VictoryBar
          data={chartData}
          style={{
            data: {
              fill: ({ datum }: any) => sorenessColor(datum.y),
              rx: 4,
            },
          }}
          events={[
            {
              target: 'data',
              eventHandlers: {
                onPress: (_: any, props: any) => {
                  onDayPress?.(props.datum.readiness);
                },
              },
            },
          ]}
        />
      </VictoryChart>
      <View style={styles.xLabels}>
        {data.map((d) => (
          <Text key={d.date} style={styles.xLabel}>
            {formatDisplayDate(d.date)}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  empty: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.secondary,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  xLabel: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.text.secondary,
  },
});
