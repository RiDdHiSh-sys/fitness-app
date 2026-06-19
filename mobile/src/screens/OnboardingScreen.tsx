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
import NeoButton from '../components/NeoButton';
import NeoInput from '../components/NeoInput';
import { createUser, UserPayload } from '../api/client';
import { useAppContext } from '../context/AppContext';

const GOALS = [
  { key: 'lose_weight', label: '🔥 Lose Weight', color: Colors.primary },
  { key: 'build_muscle', label: '💪 Gain Muscle', color: Colors.secondary },
  { key: 'maintain', label: '⚖️ Maintain', color: Colors.accent },
] as const;

export default function OnboardingScreen() {
  const { setUser } = useAppContext();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState<UserPayload['goal']>('maintain');

  const handleCreate = async () => {
    if (!name || !age || !weight || !height) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    
    if (Number(age) <= 0 || Number(age) > 120) {
      Alert.alert('Invalid Age', 'Please enter a valid age (1-120).');
      return;
    }
    if (Number(weight) <= 0 || Number(weight) > 500) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight in kg (max 500).');
      return;
    }
    if (Number(height) <= 0 || Number(height) > 300) {
      Alert.alert('Invalid Height', 'Please enter a valid height in cm (max 300).');
      return;
    }

    setLoading(true);
    try {
      const res = await createUser({
        name,
        age: Number(age),
        weight_kg: Number(weight),
        height_cm: Number(height),
        goal,
      });
      setUser({
        user_id: res.data.user_id,
        name,
        age: Number(age),
        weight_kg: Number(weight),
        height_cm: Number(height),
        goal,
      });
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to create profile.');
    } finally {
      setLoading(false);
    }
  };

  const bmi = weight && height
    ? (Number(weight) / Math.pow(Number(height) / 100, 2)).toFixed(1)
    : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.bg}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FITNESS AI</Text>
          </View>
          <Text style={styles.headline}>Your Body,{'\n'}Your Journey 🏋️</Text>
          <Text style={styles.sub}>
            Set up your profile to get personalized workout plans and nutrition insights.
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Profile Setup</Text>
            <Text style={styles.stepDot}>Step 1 of 1</Text>
          </View>

          <View style={styles.cardBody}>
            <NeoInput
              label="Full Name"
              placeholder="e.g. Jane Doe"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <View style={styles.row}>
              <NeoInput
                label="Age"
                placeholder="28"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                containerStyle={{ flex: 1, marginRight: Spacing.sm }}
              />
              <NeoInput
                label="Weight (kg)"
                placeholder="65"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                containerStyle={{ flex: 1 }}
              />
            </View>

            <NeoInput
              label="Height (cm)"
              placeholder="168"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
            />

            {bmi && (
              <View style={styles.bmiChip}>
                <Text style={styles.bmiLabel}>BMI</Text>
                <Text style={styles.bmiValue}>{bmi}</Text>
              </View>
            )}

            {/* Goal Selector */}
            <Text style={styles.goalLabel}>Your Goal</Text>
            <View style={styles.goalRow}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.key}
                  style={[
                    styles.goalChip,
                    goal === g.key && {
                      backgroundColor: g.color,
                      borderColor: Colors.border,
                    },
                  ]}
                  onPress={() => setGoal(g.key)}
                >
                  <Text
                    style={[
                      styles.goalText,
                      goal === g.key && { color: Colors.text, fontWeight: Typography.fontWeightBold },
                    ]}
                  >
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <NeoButton
              title={loading ? 'Creating...' : 'Start My Journey →'}
              onPress={handleCreate}
              loading={loading}
              variant="primary"
              size="lg"
              fullWidth
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: '🤖', text: 'AI Coaching & Chat' },
            { icon: '📊', text: 'Macro Tracking' },
            { icon: '💤', text: 'Recovery Insights' },
            { icon: '🎯', text: 'Pose Feedback' },
          ].map((f) => (
            <View key={f.text} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },

  header: { marginBottom: Spacing.xxl, marginTop: Spacing.xl },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent,
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
  badgeText: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.text,
    letterSpacing: 2,
  },
  headline: {
    fontSize: Typography.fontSize3XL,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.text,
    lineHeight: 42,
    marginBottom: Spacing.md,
  },
  sub: {
    fontSize: Typography.fontSizeMD,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xxl,
    shadowColor: Colors.border,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  cardTitle: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.textInverse,
  },
  stepDot: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textInverse,
    fontWeight: Typography.fontWeightBold,
    opacity: 0.8,
  },
  cardBody: { padding: Spacing.xl },

  row: { flexDirection: 'row' },

  bmiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.secondaryLight,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    shadowColor: Colors.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  bmiLabel: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bmiValue: {
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBlack,
    color: Colors.secondary,
  },

  goalLabel: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  goalRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  goalChip: {
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardAlt,
  },
  goalText: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
  },

  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  featureItem: {
    alignItems: 'center',
    width: '40%',
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    shadowColor: Colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  featureIcon: { fontSize: 28, marginBottom: Spacing.xs },
  featureText: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
