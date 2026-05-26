import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lightning, Thermometer, Snowflake, ArrowUp, ArrowDown } from 'phosphor-react-native';
import GBottomSheet from '@gorhom/bottom-sheet';
import { RecoveryScoreArc } from '../../src/components/charts/RecoveryScoreArc';
import { SorenessTrendChart } from '../../src/components/charts/SorenessTrendChart';
import { BottomSheet } from '../../src/components/ui/BottomSheet';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { useSessionHistory } from '../../src/hooks/useSessionHistory';
import { useSorenessInsight } from '../../src/hooks/useSorenessInsight';
import { useReadinessStore } from '../../src/stores/readinessStore';
import { useRecoveryScore } from '../../src/hooks/useRecoveryScore';
import { DailyReadiness, RecoverySession } from '../../src/types';
import { colors, sorenessColor } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { spacing } from '../../src/constants/spacing';
import { formatRelativeDate, formatDuration } from '../../src/utils/date';

type Filter = 'week' | 'month' | 'all';

const MODALITY_ICONS: Record<string, React.ElementType> = {
  vibration: Lightning,
  thermal: Thermometer,
  cold: Snowflake,
};

function SessionRow({ session }: { session: RecoverySession }) {
  const Icon = MODALITY_ICONS[session.modality] ?? Lightning;
  const positive = session.recoveryDelta >= 0;
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.iconWrap}>
        <Icon size={18} color={colors.accent.primary} weight="bold" />
      </View>
      <View style={rowStyles.info}>
        <Text style={rowStyles.date}>{formatRelativeDate(session.date)}</Text>
        <Text style={rowStyles.meta}>
          {session.modality} · {formatDuration(session.durationMinutes)}
        </Text>
      </View>
      <View style={rowStyles.deltaWrap}>
        {positive ? (
          <ArrowUp size={12} color={colors.accent.primary} weight="bold" />
        ) : (
          <ArrowDown size={12} color={colors.accent.danger} weight="bold" />
        )}
        <Text style={[rowStyles.delta, { color: positive ? colors.accent.primary : colors.accent.danger }]}>
          {Math.abs(session.recoveryDelta).toFixed(1)}
        </Text>
      </View>
      <View style={rowStyles.soreness}>
        <View style={[rowStyles.dot, { backgroundColor: sorenessColor(session.sorenessScore) }]} />
        <Text style={rowStyles.sorenessVal}>{session.sorenessScore}</Text>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  date: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text.primary },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.text.secondary, marginTop: 2 },
  deltaWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  delta: { fontFamily: fonts.mono, fontSize: 12 },
  soreness: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 32 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sorenessVal: { fontFamily: fonts.mono, fontSize: 13, color: colors.text.secondary },
});

export default function HistoryScreen() {
  const [filter, setFilter] = useState<Filter>('week');
  const [selectedDay, setSelectedDay] = useState<DailyReadiness | null>(null);
  const sheetRef = useRef<GBottomSheet>(null);
  const { sessions } = useSessionHistory(filter);
  const insight = useSorenessInsight();
  const history = useReadinessStore((s) => s.history);
  const { score } = useRecoveryScore();

  function handleDayPress(readiness: DailyReadiness) {
    setSelectedDay(readiness);
    sheetRef.current?.expand();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => <SessionRow session={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.screenTitle}>History</Text>
            <View style={styles.arcRow}>
              <RecoveryScoreArc score={score} variant="summary" />
              <View style={styles.insightCard}>
                <Text style={styles.insightLabel}>INSIGHT</Text>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            </View>
            <Text style={styles.sectionLabel}>7-DAY SORENESS</Text>
            <SorenessTrendChart data={history} onDayPress={handleDayPress} />
            <View style={styles.filters}>
              {(['week', 'month', 'all'] as Filter[]).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.pill, filter === f && styles.pillActive]}
                  onPress={() => setFilter(f)}
                >
                  <Text style={[styles.pillLabel, filter === f && styles.pillLabelActive]}>
                    {f === 'week' ? 'Week' : f === 'month' ? 'Month' : 'All'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.sectionLabel}>SESSIONS</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            headline="No sessions yet"
            body="Start a recovery session from the Hub to see your history here."
          />
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <BottomSheet ref={sheetRef} snapPoints={['35%']}>
        {selectedDay && (
          <View style={styles.dayDetail}>
            <Text style={styles.dayDetailTitle}>{formatRelativeDate(selectedDay.date)}</Text>
            <View style={styles.dayStats}>
              <View style={styles.dayStat}>
                <Text style={styles.dayStatLabel}>RECOVERY</Text>
                <Text style={styles.dayStatValue}>{selectedDay.recoveryScore}</Text>
              </View>
              <View style={styles.dayStat}>
                <Text style={styles.dayStatLabel}>SORENESS</Text>
                <Text style={[styles.dayStatValue, { color: sorenessColor(selectedDay.sorenessScore) }]}>
                  {selectedDay.sorenessScore}
                </Text>
              </View>
              <View style={styles.dayStat}>
                <Text style={styles.dayStatLabel}>SLEEP</Text>
                <Text style={styles.dayStatValue}>{selectedDay.sleepQuality}/5</Text>
              </View>
              <View style={styles.dayStat}>
                <Text style={styles.dayStatLabel}>STREAK</Text>
                <Text style={styles.dayStatValue}>{selectedDay.streakDay}</Text>
              </View>
            </View>
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.deep },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.lg, marginBottom: spacing.md },
  screenTitle: {
    fontFamily: fonts.condensed,
    fontSize: 28,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  arcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  insightCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  insightLabel: {
    fontFamily: fonts.condensed,
    fontSize: 10,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  insightText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.primary,
    lineHeight: 18,
  },
  sectionLabel: {
    fontFamily: fonts.condensed,
    fontSize: 11,
    color: colors.text.secondary,
    letterSpacing: 2,
  },
  filters: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
  },
  pillActive: { backgroundColor: `${colors.accent.primary}22` },
  pillLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.text.secondary },
  pillLabelActive: { color: colors.accent.primary },
  separator: { height: 1, backgroundColor: colors.border },
  dayDetail: { padding: spacing.xl, gap: spacing.lg },
  dayDetailTitle: {
    fontFamily: fonts.condensed,
    fontSize: 22,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  dayStats: { flexDirection: 'row', justifyContent: 'space-around' },
  dayStat: { alignItems: 'center', gap: spacing.xs },
  dayStatLabel: {
    fontFamily: fonts.condensed,
    fontSize: 10,
    color: colors.text.secondary,
    letterSpacing: 1.5,
  },
  dayStatValue: {
    fontFamily: fonts.mono,
    fontSize: 28,
    color: colors.text.primary,
  },
});
