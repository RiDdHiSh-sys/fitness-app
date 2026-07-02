import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { useAppContext } from '../context/AppContext';
import { logWorkout, Exercise } from '../api/client';
import NeoButton from '../components/NeoButton';
import NeoInput from '../components/NeoInput';
import NeoCard from '../components/NeoCard';

const AI_EXERCISES = [
  { key: 'squat', label: 'Squat', emoji: '🦵' },
  { key: 'bicep_curl', label: 'Bicep Curl', emoji: '💪' },
];

const EXERCISE_PRESETS = [
  { name: 'squat', met_value: 5.0, emoji: '🦵' },
  { name: 'bench_press', met_value: 5.0, emoji: '🏋️' },
  { name: 'deadlift', met_value: 6.0, emoji: '💪' },
  { name: 'running', met_value: 8.0, emoji: '🏃' },
  { name: 'cycling', met_value: 7.5, emoji: '🚴' },
  { name: 'bicep_curl', met_value: 3.5, emoji: '💪' },
  { name: 'pull_up', met_value: 8.0, emoji: '🔼' },
  { name: 'push_up', met_value: 3.8, emoji: '⬇️' },
  { name: 'plank', met_value: 3.0, emoji: '🧘' },
  { name: 'jump_rope', met_value: 11.0, emoji: '⚡' },
];

const INTENSITY_COLORS: Record<string, string> = {
  low: Colors.green,
  medium: Colors.accent,
  high: Colors.primary,
};

interface ExerciseForm {
  name: string;
  sets: string;
  reps: string;
  weight_kg: string;
  met_value: string;
  duration_minutes: string;
}

const defaultExercise = (): ExerciseForm => ({
  name: '',
  sets: '3',
  reps: '10',
  weight_kg: '20',
  met_value: '5.0',
  duration_minutes: '',
});

export default function WorkoutScreen() {
  const { user } = useAppContext();
  const navigation = useNavigation<any>();
  const [exercises, setExercises] = useState<ExerciseForm[]>([defaultExercise()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedAiEx, setSelectedAiEx] = useState('squat');

  const updateExercise = (idx: number, field: keyof ExerciseForm, val: string) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const removeExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePreset = (idx: number, preset: typeof EXERCISE_PRESETS[0]) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], name: preset.name, met_value: String(preset.met_value) };
      return copy;
    });
  };

  const handleLog = async () => {
    if (!user) return;
    const valid = exercises.every((e) => e.name && e.sets && e.reps && e.weight_kg);
    if (!valid) {
      Alert.alert('Missing Info', 'Please fill all exercise fields and names.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const payload: Exercise[] = exercises.map((e) => ({
        name: e.name,
        sets: Number(e.sets),
        reps: Number(e.reps),
        weight_kg: Number(e.weight_kg),
        met_value: Number(e.met_value),
        ...(e.duration_minutes ? { duration_minutes: Number(e.duration_minutes) } : {}),
      }));
      const res = await logWorkout(user.user_id, payload);
      setResult(res.data);
      setExercises([defaultExercise()]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to log workout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.bg} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>LOG WORKOUT</Text>
          </View>
          <Text style={styles.title}>Today's{'\n'}Training 💪</Text>
        </View>

        {/* Result Banner */}
        {result && (
          <View style={[styles.resultBanner, { backgroundColor: INTENSITY_COLORS[result.intensity_score] ?? Colors.green }]}>
            <Text style={styles.resultTitle}>✅ Workout Logged!</Text>
            <View style={styles.resultRow}>
              <View style={styles.resultStat}>
                <Text style={styles.resultStatVal}>{result.total_calories_burned?.toFixed(1)}</Text>
                <Text style={styles.resultStatLbl}>kcal burned</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultStat}>
                <Text style={styles.resultStatVal}>{result.intensity_score?.toUpperCase()}</Text>
                <Text style={styles.resultStatLbl}>intensity</Text>
              </View>
            </View>
          </View>
        )}

        {/* AI Real-Time Workout */}
        <NeoCard title="AI Live Form Check 🤖" accent={Colors.primary} style={{ marginBottom: Spacing.xl }}>
          <Text style={styles.aiSubtitle}>
            Perform exercises in front of your camera and get real-time feedback on your form and posture.
          </Text>
          
          <View style={styles.aiGrid}>
            {AI_EXERCISES.map((ex) => {
              const isActive = selectedAiEx === ex.key;
              return (
                <TouchableOpacity
                  key={ex.key}
                  style={[styles.aiItem, isActive && styles.aiItemActive]}
                  onPress={() => setSelectedAiEx(ex.key)}
                >
                  <Text style={styles.aiEmoji}>{ex.emoji}</Text>
                  <Text style={[styles.aiLabel, isActive && styles.aiLabelActive]}>
                    {ex.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <NeoButton
            title="Start AI Workout 🚀"
            onPress={() => {
              navigation.navigate('Pose', { exercise: selectedAiEx });
            }}
            variant="primary"
            size="lg"
            fullWidth
            style={{ marginTop: Spacing.xs }}
          />
        </NeoCard>

        {/* Section Header for Logging */}
        <View style={{ marginBottom: Spacing.lg }}>
          <Text style={{ fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBlack, color: Colors.text }}>
            Log Manual Workout
          </Text>
        </View>

        {/* Exercises */}
        {exercises.map((ex, idx) => (
          <NeoCard key={idx} title={`Exercise ${idx + 1}`} accent={Colors.secondary}>
            {/* Preset chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {EXERCISE_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.name}
                  style={[
                    styles.presetChip,
                    ex.name === p.name && { backgroundColor: Colors.secondary, borderColor: Colors.border },
                  ]}
                  onPress={() => handlePreset(idx, p)}
                >
                  <Text style={styles.presetEmoji}>{p.emoji}</Text>
                  <Text style={[styles.presetText, ex.name === p.name && { fontWeight: Typography.fontWeightBold }]}>
                    {p.name.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <NeoInput
              label="Exercise Name"
              placeholder="e.g. squat"
              value={ex.name}
              onChangeText={(v) => updateExercise(idx, 'name', v)}
              autoCapitalize="none"
              containerStyle={{ marginTop: Spacing.md }}
            />

            <View style={styles.row}>
              <NeoInput label="Sets" value={ex.sets} onChangeText={(v) => updateExercise(idx, 'sets', v)} keyboardType="numeric" containerStyle={{ flex: 1, marginRight: Spacing.sm }} />
              <NeoInput label="Reps" value={ex.reps} onChangeText={(v) => updateExercise(idx, 'reps', v)} keyboardType="numeric" containerStyle={{ flex: 1 }} />
            </View>
            <View style={styles.row}>
              <NeoInput label="Weight (kg)" value={ex.weight_kg} onChangeText={(v) => updateExercise(idx, 'weight_kg', v)} keyboardType="decimal-pad" containerStyle={{ flex: 1, marginRight: Spacing.sm }} />
              <NeoInput label="MET Value" value={ex.met_value} onChangeText={(v) => updateExercise(idx, 'met_value', v)} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
            </View>
            <NeoInput
              label="Duration (min, optional)"
              placeholder="auto-calculated if empty"
              value={ex.duration_minutes}
              onChangeText={(v) => updateExercise(idx, 'duration_minutes', v)}
              keyboardType="decimal-pad"
            />

            {exercises.length > 1 && (
              <NeoButton title="✕ Remove" onPress={() => removeExercise(idx)} variant="danger" size="sm" />
            )}
          </NeoCard>
        ))}

        {/* Add Exercise */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setExercises((p) => [...p, defaultExercise()])}
        >
          <Text style={styles.addBtnText}>+ Add Another Exercise</Text>
        </TouchableOpacity>

        <NeoButton
          title="Log Workout 🏋️"
          onPress={handleLog}
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth
          style={{ marginTop: Spacing.lg }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  header: { marginBottom: Spacing.xxl },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary,
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

  resultBanner: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
    shadowColor: Colors.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  resultTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBlack, color: Colors.text, marginBottom: Spacing.md },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  resultStat: { alignItems: 'center' },
  resultStatVal: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightBlack, color: Colors.text },
  resultStatLbl: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  resultDivider: { width: 2, height: 40, backgroundColor: Colors.border },

  presetScroll: { marginBottom: Spacing.sm },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    backgroundColor: Colors.cardAlt,
  },
  presetEmoji: { fontSize: 14 },
  presetText: { fontSize: Typography.fontSizeXS, color: Colors.text, textTransform: 'capitalize' },

  row: { flexDirection: 'row' },

  addBtn: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    borderStyle: 'dashed',
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.card,
  },
  addBtnText: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBold, color: Colors.textSecondary },

  aiSubtitle: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  aiGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  aiItem: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    backgroundColor: Colors.cardAlt,
  },
  aiItemActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.border,
    shadowColor: Colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  aiEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  aiLabel: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
  },
  aiLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeightBold,
  },
});
