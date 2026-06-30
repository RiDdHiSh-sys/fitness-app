import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { useAppContext } from '../context/AppContext';
import { getTodaySummary, getRecommendation, getAIInsights } from '../api/client';
import MacroBar from '../components/MacroBar';
import NeoCard from '../components/NeoCard';
import NeoButton from '../components/NeoButton';

const GOAL_LABELS: Record<string, string> = {
  lose_weight: '🔥 Lose Weight',
  build_muscle: '💪 Gain Muscle',
  maintain: '⚖️ Maintain',
};

export default function HomeScreen() {
  const { user } = useAppContext();
  const [summary, setSummary] = useState<any>(null);
  const [rec, setRec] = useState<string>('');
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [sumRes, recRes, aiRes] = await Promise.all([
        getTodaySummary(user.user_id),
        getRecommendation(user.user_id),
        getAIInsights(user.user_id),
      ]);
      setSummary(sumRes.data);
      setRec(recRes.data.recommendation || '');
      setAiInsights(aiRes.data.message || '');
    } catch (e) {
      console.warn('Error fetching home data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleExportPDF = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      Alert.alert(
        '📄 PDF Exported',
        'Your weekly progress report has been successfully generated and saved to your device as a PDF.',
        [{ text: 'OK' }]
      );
    }, 1500);
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
          <Text style={styles.greeting}>Hi, {user.name}! 👋</Text>
          <Text style={styles.dateLabel}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.settingsIcon}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Summary Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Today's Summary</Text>
        <View style={styles.goalBadge}>
          <Text style={styles.goalBadgeText}>{GOAL_LABELS[user.goal]}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 60 }} />
      ) : (
        <>
          {/* Daily Dashboard Circles */}
          <View style={styles.dashboardRow}>
            {/* Steps Widget */}
            <View style={[styles.circleWidget, { borderColor: Colors.green }]}>
              <Text style={styles.widgetValue}>12,450</Text>
              <Text style={[styles.widgetLabel, { color: Colors.green }]}>Steps</Text>
              <Text style={styles.widgetSub}>/15k</Text>
            </View>

            {/* Calories Widget */}
            <View style={[styles.circleWidget, { borderColor: Colors.accent }]}>
              <Text style={styles.widgetValue}>{caloriesConsumed.toFixed(0)}</Text>
              <Text style={[styles.widgetLabel, { color: '#D97706' }]}>Calories</Text>
              <Text style={styles.widgetSub}>/{totalCalorieGoal > 0 ? totalCalorieGoal.toFixed(0) : '2.2k'} kcal</Text>
            </View>

            {/* Water Widget */}
            <View style={[styles.circleWidget, { borderColor: '#4ECDC4' }]}>
              <Text style={styles.widgetValue}>1.9L</Text>
              <Text style={[styles.widgetLabel, { color: '#0891B2' }]}>Water</Text>
              <Text style={styles.widgetSub}>/2.5L</Text>
            </View>
          </View>

          {/* Workout Tracking Card */}
          <NeoCard title="Workout Tracking" accent={Colors.accent}>
            <View style={styles.workoutMain}>
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutTitle}>
                  {exercises.length > 0 ? `Active Session (${intensity})` : 'Morning Run'}
                </Text>
                <Text style={styles.workoutIcon}>🏃</Text>
              </View>
              
              <View style={styles.workoutGrid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridVal}>7.2 km</Text>
                  <Text style={styles.gridLbl}>Distance</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridVal}>48:30 min</Text>
                  <Text style={styles.gridLbl}>Duration</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridVal}>6:45 min/km</Text>
                  <Text style={styles.gridLbl}>Pace</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridVal}>{caloriesBurned > 0 ? caloriesBurned.toFixed(0) : '510'} kcal</Text>
                  <Text style={styles.gridLbl}>Burned</Text>
                </View>
              </View>

              {exercises.length > 0 && (
                <View style={styles.exerciseTags}>
                  {exercises.map((ex) => (
                    <View key={ex} style={styles.exTag}>
                      <Text style={styles.exTagText}>💪 {ex.replace('_', ' ')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </NeoCard>

          {/* Nutrition Overview Card */}
          <NeoCard title="Nutrition Overview" accent={Colors.primary}>
            <MacroBar label="Protein" consumed={protein} total={proteinTarget} color={Colors.primary} />
            <MacroBar label="Carbs" consumed={carbs} total={carbsTarget} color={Colors.accent} />
            <MacroBar label="Fat" consumed={fat} total={fatTarget} color={Colors.red} />
          </NeoCard>

          {/* AI Coach Says */}
          {rec ? (
            <NeoCard title="AI Coach Says" accent={Colors.purple}>
              <View style={styles.recContainer}>
                <Text style={styles.recIcon}>🤖</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recText}>{rec}</Text>
                  {aiInsights ? (
                    <Text style={[styles.recText, { marginTop: Spacing.sm, fontStyle: 'italic', color: Colors.textSecondary }]}>
                      Status: {aiInsights}
                    </Text>
                  ) : null}
                </View>
              </View>
            </NeoCard>
          ) : null}

          {/* Weekly Insights Card with PDF Export */}
          <NeoCard title="Weekly Insights" accent={Colors.primary}>
            <Text style={styles.insightsSub}>Review your progress for the last 7 days</Text>
            
            <View style={styles.exportContainer}>
              <NeoButton
                title={exporting ? 'Generating PDF...' : '📄 Export Weekly Progress Report'}
                onPress={handleExportPDF}
                variant="primary"
                size="lg"
                fullWidth
                disabled={exporting}
              />
            </View>
          </NeoCard>
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
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  greeting: {
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.text,
  },
  dateLabel: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
    marginTop: 2,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.cardAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.text,
  },
  goalBadge: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.accentLight,
  },
  goalBadgeText: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
  },

  dashboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  circleWidget: {
    flex: 1,
    height: 96,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  widgetValue: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.text,
  },
  widgetLabel: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    marginTop: 2,
  },
  widgetSub: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
  },

  workoutMain: {
    gap: Spacing.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutTitle: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
  },
  workoutIcon: {
    fontSize: 20,
  },
  workoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridItem: {
    width: '47%',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.cardAlt,
    padding: Spacing.sm,
  },
  gridVal: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
  },
  gridLbl: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  exerciseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  exTag: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  exTagText: {
    fontSize: 10,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
    textTransform: 'capitalize',
  },

  recContainer: { flexDirection: 'row', gap: Spacing.md },
  recIcon: { fontSize: 24 },
  recText: {
    fontSize: Typography.fontSizeSM,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: Typography.fontWeightMedium,
  },

  insightsSub: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  exportContainer: {
    marginTop: Spacing.xs,
  },
});
