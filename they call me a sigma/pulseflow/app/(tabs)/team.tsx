import React, { useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GBottomSheet from '@gorhom/bottom-sheet';
import { SorenessTrendChart } from '../../src/components/charts/SorenessTrendChart';
import { BottomSheet } from '../../src/components/ui/BottomSheet';
import { MOCK_ATHLETES } from '../../src/constants/mockAthletes';
import { MockAthlete, DailyReadiness } from '../../src/types';
import { upsertCoachNote, getCoachNote } from '../../src/db/coachNoteRepository';
import { todayISO } from '../../src/utils/date';
import { colors, sorenessColor, recoveryColor } from '../../src/constants/colors';
import { fonts } from '../../src/constants/fonts';
import { spacing } from '../../src/constants/spacing';

type SortKey = 'score' | 'soreness' | 'streak';

function AthleteRow({
  athlete,
  onPress,
}: {
  athlete: MockAthlete;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={rowStyles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={rowStyles.avatar}>
        <Text style={rowStyles.initials}>
          {athlete.name.split(' ').map((n) => n[0]).join('')}
        </Text>
      </View>
      <View style={rowStyles.info}>
        <Text style={rowStyles.name}>{athlete.name}</Text>
        <Text style={rowStyles.sport}>{athlete.sport}</Text>
      </View>
      <Text style={[rowStyles.score, { color: recoveryColor(athlete.recoveryScore) }]}>
        {athlete.recoveryScore}
      </Text>
      <View style={[rowStyles.dot, { backgroundColor: sorenessColor(athlete.sorenessScore) }]} />
      <Text style={rowStyles.streak}>{athlete.streakDay}d</Text>
    </TouchableOpacity>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.text.primary,
  },
  info: { flex: 1 },
  name: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.text.primary },
  sport: { fontFamily: fonts.sans, fontSize: 12, color: colors.text.secondary, marginTop: 1 },
  score: { fontFamily: fonts.mono, fontSize: 18, minWidth: 36, textAlign: 'right' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  streak: { fontFamily: fonts.mono, fontSize: 12, color: colors.text.secondary, minWidth: 28, textAlign: 'right' },
});

export default function TeamScreen() {
  const [sort, setSort] = useState<SortKey>('score');
  const [selected, setSelected] = useState<MockAthlete | null>(null);
  const [note, setNote] = useState('');
  const sheetRef = useRef<GBottomSheet>(null);

  const sorted = useMemo(() => {
    const copy = [...MOCK_ATHLETES];
    if (sort === 'score') return copy.sort((a, b) => b.recoveryScore - a.recoveryScore);
    if (sort === 'soreness') return copy.sort((a, b) => b.sorenessScore - a.sorenessScore);
    return copy.sort((a, b) => b.streakDay - a.streakDay);
  }, [sort]);

  async function openAthlete(athlete: MockAthlete) {
    setSelected(athlete);
    const result = getCoachNote(athlete.id, todayISO());
    if (result.ok && result.value) {
      setNote(result.value.note);
    } else {
      setNote('');
    }
    sheetRef.current?.expand();
  }

  function saveNote() {
    if (!selected) return;
    upsertCoachNote({ athleteId: selected.id, date: todayISO(), note });
  }

  const readinessData: DailyReadiness[] = selected
    ? selected.sevenDaySoreness.map((soreness, i) => ({
        date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
        recoveryScore: 100 - soreness * 8,
        sorenessScore: soreness,
        sleepQuality: 3,
        streakDay: i,
      }))
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={sorted}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <AthleteRow athlete={item} onPress={() => openAthlete(item)} />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Team</Text>
            <View style={styles.headerRow}>
              <View style={styles.sortPills}>
                {(['score', 'soreness', 'streak'] as SortKey[]).map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={[styles.pill, sort === k && styles.pillActive]}
                    onPress={() => setSort(k)}
                  >
                    <Text style={[styles.pillLabel, sort === k && styles.pillLabelActive]}>
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.colHeaders}>
                <Text style={styles.colLabel}>REC</Text>
                <Text style={styles.colLabel}>SOR</Text>
                <Text style={styles.colLabel}>STK</Text>
              </View>
            </View>
          </View>
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <BottomSheet ref={sheetRef} snapPoints={['65%']}>
        {selected && (
          <View style={styles.sheetContent}>
            <Text style={styles.athleteName}>{selected.name}</Text>
            <Text style={styles.athleteSport}>{selected.sport}</Text>
            <Text style={styles.sectionLabel}>7-DAY SORENESS</Text>
            <SorenessTrendChart data={readinessData} />
            <Text style={styles.sectionLabel}>COACH NOTE — TODAY</Text>
            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              onBlur={saveNote}
              multiline
              placeholder="Add a note for this athlete..."
              placeholderTextColor={colors.text.secondary}
            />
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background.deep },
  list: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.md, marginBottom: spacing.md },
  screenTitle: {
    fontFamily: fonts.condensed,
    fontSize: 28,
    color: colors.text.primary,
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortPills: { flexDirection: 'row', gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    backgroundColor: colors.background.elevated,
  },
  pillActive: { backgroundColor: `${colors.accent.primary}22` },
  pillLabel: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.text.secondary },
  pillLabelActive: { color: colors.accent.primary },
  colHeaders: { flexDirection: 'row', gap: spacing.md },
  colLabel: {
    fontFamily: fonts.condensed,
    fontSize: 10,
    color: colors.text.secondary,
    letterSpacing: 1.5,
    minWidth: 28,
    textAlign: 'right',
  },
  separator: { height: 1, backgroundColor: colors.border },
  sheetContent: { padding: spacing.xl, gap: spacing.md },
  athleteName: {
    fontFamily: fonts.condensed,
    fontSize: 24,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  athleteSport: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: -spacing.sm,
  },
  sectionLabel: {
    fontFamily: fonts.condensed,
    fontSize: 10,
    color: colors.text.secondary,
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
  noteInput: {
    backgroundColor: colors.background.elevated,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.text.primary,
    fontFamily: fonts.sans,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
