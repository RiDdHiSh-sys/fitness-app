import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { useAppContext } from '../context/AppContext';
import { getTodaySummary, getRecommendation } from '../api/client';
import MacroBar from '../components/MacroBar';
import NeoCard from '../components/NeoCard';

const INTENSITY_COLORS: Record<string, string> = {
  low: Colors.green,
  medium: Colors.accent,
  high: Colors.primary,
};

const GOAL_LABELS: Record<string, string> = {
  lose_weight: '🔥 Lose Weight',
  build_muscle: '💪 Gain Muscle',
  maintain: '⚖️ Maintain',
};

export default function HomeScreen() {
  const { user } = useAppContext();
  const [summary, setSummary] = useState<any>(null);
  const [rec, setRec] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [sumRes, recRes] = await Promise.all([
        getTodaySummary(user.user_id),
        getRecommendation(user.user_id),
      ]);
      setSummary(sumRes.data);
      setRec(recRes.data.recommendation || '');
    } catch (e) {
      console.warn('Error fetching home data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (!user) return null;

  const hourOfDay = new Date().getHours();
  const greeting =
    hourOfDay < 12 ? 'Good Morning' : hourOfDay < 17 ? 'Good Afternoon' : 'Good Evening';

  const caloriesConsumed = summary?.meals?.calories_consumed ?? 0;
  const caloriesBurned = summary?.workout?.calories_burned ?? 0;
  const caloriesRemaining = summary?.remaining?.calories ?? 0;
  const totalCalorieGoal = caloriesConsumed + caloriesRemaining;

  const protein = summary?.meals?.protein ?? 0;
  const carbs = summary?.meals?.carbs ?? 0;
  const fat = summary?.meals?.fat ?? 0;
  const proteinTarget = protein + (summary?.remaining?.protein ?? 0);
  const carbsTarget = carbs + (summary?.remaining?.carbs ?? 0);
  const fatTarget = fat + (summary?.remaining?.fat ?? 0);

  const intensity = summary?.workout?.intensity_score ?? 'none';
  const exercises: string[] = summary?.workout?.exercises ?? [];
  const sleepHours = summary?.sleep_hours ?? 0;

  return (
    <ScrollView
      style={styles.bg}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      {/* Greeting Banner */}
      <View style={styles.banner}>
        <View>
          <Text style={styles.greeting}>{greeting},</Text>
          <Text style={styles.userName}>{user.name} 👋</Text>
        </View>
        <View style={[styles.goalBadge, { backgroundColor: Colors.accent }]}>
          <Text style={styles.goalBadgeText}>{GOAL_LABELS[user.goal]}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : (
        <>
          {/* Calorie Ring Card */}
          <NeoCard title="Today's Calories" accent={Colors.primary}>
            <View style={styles.calRow}>
              <View style={styles.calCircle}>
                <Text style={styles.calBig}>{caloriesConsumed.toFixed(0)}</Text>
                <Text style={styles.calSub}>consumed</Text>
              </View>

              <View style={styles.calStats}>
                <View style={[styles.statChip, { backgroundColor: Colors.redLight }]}>
                  <Text style={styles.statEmoji}>🔥</Text>
                  <View>
                    <Text style={styles.statVal}>{caloriesBurned.toFixed(0)}</Text>
                    <Text style={styles.statLbl}>burned</Text>
                  </View>
                </View>

                <View style={[styles.statChip, { backgroundColor: Colors.greenLight }]}>
                  <Text style={styles.statEmoji}>🎯</Text>
                  <View>
                    <Text style={styles.statVal}>{caloriesRemaining.toFixed(0)}</Text>
                    <Text style={styles.statLbl}>remaining</Text>
                  </View>
                </View>

                <View style={[styles.statChip, { backgroundColor: Colors.accentLight }]}>
                  <Text style={styles.statEmoji}>💤</Text>
                  <View>
                    <Text style={styles.statVal}>{sleepHours}h</Text>
                    <Text style={styles.statLbl}>sleep</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Net calories progress */}
            <MacroBar
              label="Calorie Goal"
              consumed={caloriesConsumed}
              total={totalCalorieGoal}
              unit=" kcal"
              color={Colors.primary}
            />
          </NeoCard>

          {/* Macros Card */}
          <NeoCard title="Macros Breakdown" accent={Colors.secondary}>
            <MacroBar label="Protein" consumed={protein} total={proteinTarget} color={Colors.secondary} />
            <MacroBar label="Carbs" consumed={carbs} total={carbsTarget} color={Colors.accent} />
            <MacroBar label="Fat" consumed={fat} total={fatTarget} color={Colors.purple} />
          </NeoCard>

          {/* Workout Card */}
          <NeoCard title="Workout" accent={Colors.accent}>
            <View style={styles.workoutRow}>
              {intensity !== 'none' ? (
                <View
                  style={[
                    styles.intensityBadge,
                    { backgroundColor: INTENSITY_COLORS[intensity] ?? Colors.secondary },
                  ]}
                >
                  <Text style={styles.intensityText}>{intensity.toUpperCase()} INTENSITY</Text>
                </View>
              ) : (
                <Text style={styles.noWorkout}>No workout logged today</Text>
              )}
            </View>

            {exercises.length > 0 && (
              <View style={styles.exerciseTags}>
                {exercises.map((ex) => (
                  <View key={ex} style={styles.exTag}>
                    <Text style={styles.exTagText}>💪 {ex}</Text>
                  </View>
                ))}
              </View>
            )}
          </NeoCard>

          {/* AI Recommendation Card */}
          {rec ? (
            <NeoCard title="AI Coach Says" accent={Colors.purple}>
              <View style={styles.recContainer}>
                <Text style={styles.recIcon}>🤖</Text>
                <Text style={styles.recText}>{rec}</Text>
              </View>
            </NeoCard>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },

  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xxl,
    marginTop: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
  },
  userName: {
    fontSize: Typography.fontSize2XL,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.text,
  },
  goalBadge: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    shadowColor: Colors.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  goalBadgeText: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
  },

  calRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.md },
  calCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  calBig: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.primary,
  },
  calSub: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, marginTop: 2 },
  calStats: { flex: 1, gap: Spacing.sm },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statEmoji: { fontSize: 16 },
  statVal: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.text },
  statLbl: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary },

  workoutRow: { marginBottom: Spacing.md },
  intensityBadge: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    shadowColor: Colors.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  intensityText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.text,
    letterSpacing: 1,
  },
  noWorkout: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  exerciseTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  exTag: {
    backgroundColor: Colors.secondaryLight,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  exTagText: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
  },

  recContainer: { flexDirection: 'row', gap: Spacing.md },
  recIcon: { fontSize: 28, marginTop: -4 },
  recText: {
    flex: 1,
    fontSize: Typography.fontSizeMD,
    color: Colors.text,
    lineHeight: 22,
    fontWeight: Typography.fontWeightMedium,
  },
});
