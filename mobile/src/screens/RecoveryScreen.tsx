import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { useAppContext } from '../context/AppContext';
import { logSleep, getRecoveryScore, getWeeklyInsights } from '../api/client';
import NeoButton from '../components/NeoButton';
import NeoInput from '../components/NeoInput';
import NeoCard from '../components/NeoCard';

const SCORE_COLORS: Record<string, string> = {
  green: Colors.green,
  yellow: Colors.accent,
  red: Colors.red,
};

const SCORE_BG: Record<string, string> = {
  green: Colors.greenLight,
  yellow: Colors.accentLight,
  red: Colors.redLight,
};

const SCORE_EMOJI: Record<string, string> = {
  green: '🟢',
  yellow: '🟡',
  red: '🔴',
};

const SLEEP_PRESETS = [5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

export default function RecoveryScreen() {
  const { user } = useAppContext();
  const [sleepHours, setSleepHours] = useState('');
  const [sleepLoading, setSleepLoading] = useState(false);
  const [recovery, setRecovery] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [recRes, insRes] = await Promise.all([
        getRecoveryScore(user.user_id),
        getWeeklyInsights(user.user_id),
      ]);
      setRecovery(recRes.data);
      setInsights(insRes.data);
    } catch (e) {
      console.warn('Recovery fetch error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogSleep = async () => {
    if (!user || !sleepHours) {
      Alert.alert('Missing', 'Please enter sleep hours.');
      return;
    }
    setSleepLoading(true);
    try {
      await logSleep(user.user_id, Number(sleepHours));
      setSleepHours('');
      await fetchData();
      Alert.alert('Done', 'Sleep logged successfully!');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to log sleep.');
    } finally {
      setSleepLoading(false);
    }
  };

  const patternData: any[] = insights?.pattern_data ?? [];
  const maxCalories = Math.max(...patternData.map((d: any) => d.calories_burned), 1);
  const maxSleep = Math.max(...patternData.map((d: any) => d.sleep), 1);

  return (
    <ScrollView
      style={styles.bg}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: Colors.purpleLight }]}>
          <Text style={styles.badgeText}>RECOVERY & INSIGHTS</Text>
        </View>
        <Text style={styles.title}>Rest &{'\n'}Recovery 💤</Text>
      </View>

      {/* Sleep Logger */}
      <NeoCard title="Log Sleep" accent={Colors.purple}>
        <Text style={styles.hint}>How many hours did you sleep last night?</Text>

        {/* Sleep Presets */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {SLEEP_PRESETS.map((h) => (
            <TouchableOpacity
              key={h}
              style={[styles.sleepChip, sleepHours === String(h) && styles.sleepChipActive]}
              onPress={() => setSleepHours(String(h))}
            >
              <Text style={[styles.sleepChipText, sleepHours === String(h) && styles.sleepChipTextActive]}>
                {h}h
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sleepRow}>
          <NeoInput
            placeholder="e.g. 7.5"
            value={sleepHours}
            onChangeText={setSleepHours}
            keyboardType="decimal-pad"
            containerStyle={{ flex: 1, marginBottom: 0, marginRight: Spacing.md }}
          />
          <NeoButton
            title="Log Sleep 💤"
            onPress={handleLogSleep}
            loading={sleepLoading}
            variant="secondary"
            size="md"
          />
        </View>
      </NeoCard>

      {/* Recovery Score */}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing.xxl }} />
      ) : recovery ? (
        <NeoCard title="Recovery Score" accent={SCORE_COLORS[recovery.score] ?? Colors.green}>
          <View style={[styles.scoreBlock, { backgroundColor: SCORE_BG[recovery.score] ?? Colors.greenLight }]}>
            <Text style={styles.scoreEmoji}>{SCORE_EMOJI[recovery.score] ?? '🟢'}</Text>
            <Text style={[styles.scoreLabel, { color: SCORE_COLORS[recovery.score] ?? Colors.green }]}>
              {recovery.label}
            </Text>
          </View>

          <View style={styles.scoreDetails}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreProp}>💤 Sleep</Text>
              <Text style={styles.scoreVal}>{recovery.sleep_hours}h</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreProp}>🏋️ Intensity</Text>
              <Text style={styles.scoreVal}>{recovery.last_intensity ?? 'none'}</Text>
            </View>
          </View>

          <View style={styles.reasonBox}>
            <Text style={styles.reasonText}>{recovery.reason}</Text>
          </View>
        </NeoCard>
      ) : null}

      {/* Weekly Insights */}
      {insights && (
        <NeoCard title="Weekly Insights" accent={Colors.accent}>
          <View style={styles.insightStats}>
            <View style={styles.insightStat}>
              <Text style={styles.insightStatVal}>{insights.days_logged}</Text>
              <Text style={styles.insightStatLbl}>Days Logged</Text>
            </View>
            <View style={styles.insightDivider} />
            <View style={styles.insightStat}>
              <Text style={[styles.insightStatVal, { color: Colors.primary }]}>
                {insights.avg_calories_burned?.toFixed(0)}
              </Text>
              <Text style={styles.insightStatLbl}>Avg Cal Burned</Text>
            </View>
            <View style={styles.insightDivider} />
            <View style={styles.insightStat}>
              <Text style={[styles.insightStatVal, { color: Colors.secondary }]}>
                {insights.avg_protein_consumed?.toFixed(0)}g
              </Text>
              <Text style={styles.insightStatLbl}>Avg Protein</Text>
            </View>
          </View>

          {insights.best_day && (
            <View style={styles.bestDayBanner}>
              <Text style={styles.bestDayText}>🏆 Best Day: {insights.best_day}</Text>
            </View>
          )}

          {/* Mini Bar Chart */}
          <Text style={styles.chartTitle}>7-Day Calories Burned</Text>
          <View style={styles.barChart}>
            {patternData.map((d: any) => {
              const heightPct = maxCalories > 0 ? (d.calories_burned / maxCalories) : 0;
              const date = new Date(d.date);
              const dayLabel = date.toLocaleDateString('en', { weekday: 'short' });
              return (
                <View key={d.date} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPct * 100}%` as any,
                          backgroundColor: heightPct > 0.7 ? Colors.primary : heightPct > 0.3 ? Colors.accent : Colors.borderLight,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>

          {/* Sleep Chart */}
          <Text style={styles.chartTitle}>Sleep Hours</Text>
          <View style={styles.barChart}>
            {patternData.map((d: any) => {
              const heightPct = maxSleep > 0 ? (d.sleep / maxSleep) : 0;
              const date = new Date(d.date);
              const dayLabel = date.toLocaleDateString('en', { weekday: 'short' });
              return (
                <View key={d.date} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPct * 100}%` as any,
                          backgroundColor: d.sleep >= 7 ? Colors.purple : d.sleep >= 6 ? Colors.accent : Colors.red,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </NeoCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  header: { marginBottom: Spacing.xxl },
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.lg,
    shadowColor: Colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  badgeText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.fontWeightBlack, color: Colors.text, letterSpacing: 2 },
  title: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightBlack, color: Colors.text, lineHeight: 34 },
  hint: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginBottom: Spacing.md },

  presetScroll: { marginBottom: Spacing.md },
  sleepChip: {
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    backgroundColor: Colors.cardAlt,
  },
  sleepChipActive: { backgroundColor: Colors.purple, borderColor: Colors.border },
  sleepChipText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, fontWeight: Typography.fontWeightMedium },
  sleepChipTextActive: { color: Colors.textInverse, fontWeight: Typography.fontWeightBold },
  sleepRow: { flexDirection: 'row', alignItems: 'center' },

  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  scoreEmoji: { fontSize: 32 },
  scoreLabel: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBlack },

  scoreDetails: { gap: Spacing.sm, marginBottom: Spacing.lg },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreProp: { fontSize: Typography.fontSizeMD, color: Colors.textSecondary, fontWeight: Typography.fontWeightMedium },
  scoreVal: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text },

  reasonBox: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  reasonText: { fontSize: Typography.fontSizeSM, color: Colors.text, lineHeight: 20, fontStyle: 'italic' },

  insightStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  insightStat: { alignItems: 'center', flex: 1 },
  insightStatVal: { fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBlack, color: Colors.text },
  insightStatLbl: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.3 },
  insightDivider: { width: 2, backgroundColor: Colors.borderLight },

  bestDayBanner: {
    backgroundColor: Colors.accentLight,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bestDayText: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightBold, color: Colors.text },

  chartTitle: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  barChart: {
    flexDirection: 'row',
    height: 80,
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: Colors.cardAlt,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: 4 },
  barLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 4 },
});
