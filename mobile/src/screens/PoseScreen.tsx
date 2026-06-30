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
import { Colors, Typography, Spacing, BorderRadius } from '../theme';
import { useAppContext } from '../context/AppContext';
import { getPoseFeedback } from '../api/client';
import NeoButton from '../components/NeoButton';
import NeoInput from '../components/NeoInput';
import NeoCard from '../components/NeoCard';

// Backend enum only supports these two exercises
const EXERCISES = [
  {
    key: 'squat',
    label: 'Squat',
    emoji: '🦵',
    tips: 'Lower hips until thighs are parallel to the floor. Keep chest up and core tight.',
  },
  {
    key: 'bicep_curl',
    label: 'Bicep Curl',
    emoji: '💪',
    tips: 'Keep upper body still — no swinging. Slow 3-second lowering phase for best results.',
  },
];

const ANGLE_PRESETS: Record<string, { knee: string; elbow: string; back: string }> = {
  squat: { knee: '100', elbow: '90', back: '75' },
  bicep_curl: { knee: '180', elbow: '60', back: '90' },
};

export default function PoseScreen() {
  const { user } = useAppContext();
  const [selectedEx, setSelectedEx] = useState('squat');
  const [kneeAngle, setKneeAngle] = useState('120');
  const [elbowAngle, setElbowAngle] = useState('90');
  const [backAngle, setBackAngle] = useState('75');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const selectExercise = (key: string) => {
    setSelectedEx(key);
    const preset = ANGLE_PRESETS[key];
    if (preset) {
      setKneeAngle(preset.knee);
      setElbowAngle(preset.elbow);
      setBackAngle(preset.back);
    }
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!user) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await getPoseFeedback(
        user.user_id,
        selectedEx,
        Number(kneeAngle),
        Number(elbowAngle),
        Number(backAngle)
      );
      setResult(res.data);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to analyze pose.');
    } finally {
      setLoading(false);
    }
  };

  const selectedExData = EXERCISES.find((e) => e.key === selectedEx);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.bg} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AI POSE ANALYSIS</Text>
          </View>
          <Text style={styles.title}>Pose{'\n'}Feedback 🎯</Text>
          <Text style={styles.subtitle}>Enter your joint angles to get real-time form corrections.</Text>
        </View>

        {/* Exercise Selector */}
        <NeoCard title="Select Exercise" accent={Colors.primary}>
          <View style={styles.exGrid}>
            {EXERCISES.map((ex) => (
              <TouchableOpacity
                key={ex.key}
                style={[styles.exItem, selectedEx === ex.key && styles.exItemActive]}
                onPress={() => selectExercise(ex.key)}
              >
                <Text style={styles.exEmoji}>{ex.emoji}</Text>
                <Text style={[styles.exLabel, selectedEx === ex.key && styles.exLabelActive]}>
                  {ex.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedExData && (
            <View style={styles.tipBox}>
              <Text style={styles.tipText}>💡 {selectedExData.tips}</Text>
            </View>
          )}
        </NeoCard>

        {/* Angle Inputs */}
        <NeoCard title="Joint Angles" accent={Colors.secondary}>
          <Text style={styles.angleHint}>Enter angles in degrees (0-180°)</Text>

          <View style={styles.angleVisual}>
            {[
              { label: 'Knee', value: kneeAngle, color: Colors.primary },
              { label: 'Elbow', value: elbowAngle, color: Colors.secondary },
              { label: 'Back', value: backAngle, color: Colors.purple },
            ].map((a) => (
              <View key={a.label} style={styles.angleGauge}>
                <View
                  style={[
                    styles.angleCircle,
                    { borderColor: a.color, backgroundColor: a.color + '20' },
                  ]}
                >
                  <Text style={[styles.angleVal, { color: a.color }]}>{a.value}°</Text>
                </View>
                <Text style={styles.angleLabel}>{a.label}</Text>
              </View>
            ))}
          </View>

          <NeoInput
            label="Knee Angle (°)"
            placeholder="90 - 180"
            value={kneeAngle}
            onChangeText={setKneeAngle}
            keyboardType="decimal-pad"
          />
          <NeoInput
            label="Elbow Angle (°)"
            placeholder="0 - 180"
            value={elbowAngle}
            onChangeText={setElbowAngle}
            keyboardType="decimal-pad"
          />
          <NeoInput
            label="Back Angle (°)"
            placeholder="0 - 180"
            value={backAngle}
            onChangeText={setBackAngle}
            keyboardType="decimal-pad"
          />

          <NeoButton
            title="Analyze Pose 🎯"
            onPress={handleAnalyze}
            loading={loading}
            variant="primary"
            size="lg"
            fullWidth
          />
        </NeoCard>

        {/* Result */}
        {result && (
          <NeoCard
            title={result.is_correct ? '✅ Form Check' : '⚠️ Correction Needed'}
            accent={result.is_correct ? Colors.green : Colors.red}
          >
            <View
              style={[
                styles.feedbackBanner,
                { backgroundColor: result.is_correct ? Colors.greenLight : Colors.redLight },
              ]}
            >
              <Text style={styles.feedbackIcon}>{result.is_correct ? '✅' : '⚠️'}</Text>
              <Text style={styles.feedbackMain}>{result.feedback}</Text>
            </View>

            {!result.is_correct && result.correction && (
              <View style={styles.correctionBox}>
                <Text style={styles.correctionTitle}>How to fix:</Text>
                <Text style={styles.correctionText}>{result.correction}</Text>
              </View>
            )}
          </NeoCard>
        )}

        {/* Info Card */}
        <NeoCard title="How It Works" accent={Colors.accent} style={{ marginTop: Spacing.sm }}>
          {[
            { icon: '📐', text: 'Measure joint angles using a goniometer or pose estimation app' },
            { icon: '📊', text: 'Input the angles for knee, elbow, and back' },
            { icon: '🤖', text: 'Our AI analyzes your form against optimal ranges' },
            { icon: '✅', text: 'Get instant corrective feedback' },
          ].map((item) => (
            <View key={item.text} style={styles.infoRow}>
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <Text style={styles.infoText}>{item.text}</Text>
            </View>
          ))}
        </NeoCard>
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
    backgroundColor: Colors.primaryLight,
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
  badgeText: { fontSize: Typography.fontSizeXS, fontWeight: Typography.fontWeightBlack, color: Colors.primary, letterSpacing: 2 },
  title: { fontSize: Typography.fontSize2XL, fontWeight: Typography.fontWeightBlack, color: Colors.text, lineHeight: 34 },
  subtitle: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginTop: Spacing.sm, lineHeight: 20 },

  exGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  exItem: {
    alignItems: 'center',
    width: '30%',
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    backgroundColor: Colors.cardAlt,
  },
  exItemActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.border,
    shadowColor: Colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  exEmoji: { fontSize: 24, marginBottom: Spacing.xs },
  exLabel: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, textAlign: 'center', fontWeight: Typography.fontWeightMedium },
  exLabelActive: { color: Colors.primary, fontWeight: Typography.fontWeightBold },

  tipBox: {
    backgroundColor: Colors.accentLight,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  tipText: { fontSize: Typography.fontSizeSM, color: Colors.text, fontStyle: 'italic' },

  angleHint: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginBottom: Spacing.lg },
  angleVisual: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.xl },
  angleGauge: { alignItems: 'center', gap: Spacing.sm },
  angleCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  angleVal: { fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightBlack },
  angleLabel: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, fontWeight: Typography.fontWeightBold, textTransform: 'uppercase' },

  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  feedbackIcon: { fontSize: 28 },
  feedbackMain: { flex: 1, fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBold, color: Colors.text },

  correctionBox: {
    backgroundColor: Colors.cardAlt,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
  },
  correctionTitle: { fontSize: Typography.fontSizeSM, fontWeight: Typography.fontWeightBlack, color: Colors.text, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  correctionText: { fontSize: Typography.fontSizeMD, color: Colors.text, lineHeight: 22 },

  infoRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md, alignItems: 'flex-start' },
  infoIcon: { fontSize: 18, marginTop: 1 },
  infoText: { flex: 1, fontSize: Typography.fontSizeSM, color: Colors.textSecondary, lineHeight: 20 },
});
