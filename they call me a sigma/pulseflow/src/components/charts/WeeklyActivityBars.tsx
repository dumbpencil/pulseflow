import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis } from 'victory-native';
import { colors, sorenessColor } from '../../constants/colors';
import { fonts } from '../../constants/fonts';
import { DaySummary } from '../../hooks/useWeeklySummary';

type Props = {
  data: DaySummary[];
};

export function WeeklyActivityBars({ data }: Props) {
  const max = Math.max(...data.map((d) => d.totalMinutes), 1);

  const chartData = data.map((d, i) => ({
    x: i + 1,
    y: d.totalMinutes,
    color:
      d.totalMinutes > 0
        ? sorenessColor(d.avgSoreness)
        : colors.background.elevated,
    label: d.date.split('-')[2],
  }));

  return (
    <View style={styles.container}>
      <VictoryChart
        height={120}
        horizontal
        padding={{ top: 4, bottom: 4, left: 28, right: 16 }}
        domain={{ y: [0, max] }}
        domainPadding={{ x: 8 }}
      >
        <VictoryAxis
          style={{
            axis: { stroke: 'none' },
            tickLabels: {
              fill: colors.text.secondary,
              fontSize: 10,
              fontFamily: fonts.mono,
            },
          }}
          tickFormat={(_: any, i: number) => {
            const item = data[i];
            if (!item) return '';
            const parts = item.date.split('-');
            return `${parts[1]}/${parts[2]}`;
          }}
        />
        <VictoryBar
          data={chartData}
          style={{
            data: {
              fill: ({ datum }: any) => datum.color,
              rx: 3,
            },
          }}
        />
      </VictoryChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
});
