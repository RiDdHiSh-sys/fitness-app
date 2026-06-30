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
import { createUser, loginUser, oauthLogin, setAuthToken, getTodaySummary } from '../api/client';
import { useAppContext } from '../context/AppContext';

const GOALS = [
  { key: 'lose_weight', label: '🔥 Lose Weight', color: Colors.primary },
  { key: 'build_muscle', label: '💪 Gain Muscle', color: Colors.secondary },
  { key: 'maintain', label: '⚖️ Maintain', color: Colors.accent },
] as const;

export default function OnboardingScreen() {
  const { setUser } = useAppContext();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Authentication Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Profile Fields (for registration)
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState<'lose_weight' | 'build_muscle' | 'maintain'>('maintain');

  const loadSession = async (userId: string, token: string, userEmail: string) => {
    setAuthToken(token);
    try {
      const summaryRes = await getTodaySummary(userId);
      const summaryData = summaryRes.data;
      setUser({
        user_id: userId,
        name: summaryData.user?.name || name || userEmail.split('@')[0],
        age: Number(age) || 28,
        height_cm: Number(height) || 170,
        weight_kg: summaryData.user?.weight_kg ?? Number(weight) ?? 70.0,
        goal: summaryData.user?.goal ?? goal ?? 'maintain',
      });
    } catch (err) {
      setUser({
        user_id: userId,
        name: name || userEmail.split('@')[0],
        age: Number(age) || 28,
        height_cm: Number(height) || 170,
        weight_kg: Number(weight) || 70,
        goal: goal || 'maintain',
      });
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      const { access_token, user_id } = res.data;
      await loadSession(user_id, access_token, email);
    } catch (e: any) {
      Alert.alert('Login Failed', e?.response?.data?.detail || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !name || !age || !weight || !height) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      // 1. Create the user
      await createUser({
        email,
        password,
        name,
        age: Number(age),
        weight_kg: Number(weight),
        height_cm: Number(height),
        goal,
      });

      // 2. Perform auto-login to retrieve token
      const loginRes = await loginUser({ email, password });
      const { access_token, user_id } = loginRes.data;
      await loadSession(user_id, access_token, email);
    } catch (e: any) {
      Alert.alert('Registration Failed', e?.response?.data?.detail || 'Failed to create profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert(
      '🌐 Google Authentication',
      'Select a Google Account to sign in:',
      [
        {
          text: 'Jane Doe (jane@example.com)',
          onPress: () => performOAuth('mock-google-token-jane'),
        },
        {
          text: 'John Smith (john@example.com)',
          onPress: () => performOAuth('mock-google-token-john'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const performOAuth = async (mockToken: string) => {
    setLoading(true);
    try {
      const res = await oauthLogin({
        provider: 'google',
        token: mockToken,
        name: name || undefined,
        age: age ? Number(age) : undefined,
        weight_kg: weight ? Number(weight) : undefined,
        height_cm: height ? Number(height) : undefined,
        goal: goal || undefined,
      });
      const { access_token, user_id } = res.data;
      const parsedEmail = mockToken.replace('mock-google-token-', '') + '@example.com';
      await loadSession(user_id, access_token, parsedEmail);
    } catch (e: any) {
      Alert.alert('OAuth Failed', e?.response?.data?.detail || 'Google sign-in failed.');
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

        {/* Tab Selector */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>Register</Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{mode === 'login' ? 'Welcome Back' : 'Profile Setup'}</Text>
            <Text style={styles.stepDot}>{mode === 'login' ? '🔑 Login' : '📝 Step 1'}</Text>
          </View>

          <View style={styles.cardBody}>
            <NeoInput
              label="Email Address"
              placeholder="e.g. jane@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <NeoInput
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {mode === 'register' && (
              <>
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
              </>
            )}

            <NeoButton
              title={loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
              onPress={mode === 'login' ? handleEmailLogin : handleRegister}
              loading={loading}
              variant="primary"
              size="lg"
              fullWidth
              style={{ marginTop: Spacing.md }}
            />

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={loading}>
              <Text style={styles.googleIcon}>🌐</Text>
              <Text style={styles.googleBtnText}>Sign In with Google</Text>
            </TouchableOpacity>
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

  header: { marginBottom: Spacing.xl, marginTop: Spacing.xl },
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

  modeTabs: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.cardAlt,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  modeTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: Colors.textInverse,
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
    color: Colors.text,
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

  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  orText: {
    fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold,
    color: Colors.textMuted,
    marginHorizontal: Spacing.md,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    shadowColor: Colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  googleIcon: {
    fontSize: 20,
  },
  googleBtnText: {
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
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
