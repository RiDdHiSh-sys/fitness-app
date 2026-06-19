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
import { logMeal, MealItem } from '../api/client';
import NeoButton from '../components/NeoButton';
import NeoInput from '../components/NeoInput';
import NeoCard from '../components/NeoCard';

const MEAL_PRESETS = [
  { name: 'Oatmeal with protein', calories: 350, protein_g: 30, carbs_g: 45, fat_g: 5, emoji: '🥣' },
  { name: 'Banana', calories: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.3, emoji: '🍌' },
  { name: 'Grilled Chicken (100g)', calories: 165, protein_g: 31, carbs_g: 0, fat_g: 3.6, emoji: '🍗' },
  { name: 'Brown Rice (1 cup)', calories: 216, protein_g: 5, carbs_g: 45, fat_g: 1.8, emoji: '🍚' },
  { name: 'Eggs (2)', calories: 140, protein_g: 12, carbs_g: 1, fat_g: 9, emoji: '🥚' },
  { name: 'Protein Shake', calories: 180, protein_g: 30, carbs_g: 10, fat_g: 2, emoji: '🥤' },
  { name: 'Almonds (30g)', calories: 174, protein_g: 6.3, carbs_g: 5.9, fat_g: 15, emoji: '🥜' },
  { name: 'Sweet Potato', calories: 130, protein_g: 3, carbs_g: 30, fat_g: 0.1, emoji: '🍠' },
];

interface FoodItemForm {
  name: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
}

const defaultItem = (): FoodItemForm => ({
  name: '',
  calories: '',
  protein_g: '',
  carbs_g: '',
  fat_g: '',
});

export default function MealScreen() {
  const { user } = useAppContext();
  const [items, setItems] = useState<FoodItemForm[]>([defaultItem()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

  const updateItem = (idx: number, field: keyof FoodItemForm, val: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const applyPreset = (idx: number, preset: typeof MEAL_PRESETS[0]) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = {
        name: preset.name,
        calories: String(preset.calories),
        protein_g: String(preset.protein_g),
        carbs_g: String(preset.carbs_g),
        fat_g: String(preset.fat_g),
      };
      return copy;
    });
  };

  const totals = items.reduce(
    (acc, it) => ({
      calories: acc.calories + (Number(it.calories) || 0),
      protein: acc.protein + (Number(it.protein_g) || 0),
      carbs: acc.carbs + (Number(it.carbs_g) || 0),
      fat: acc.fat + (Number(it.fat_g) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleLog = async () => {
    if (!user) return;
    const valid = items.every((it) => it.name && it.calories);
    if (!valid) {
      Alert.alert('Missing Info', 'Each food item needs a name and calories.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload: MealItem[] = items.map((it) => ({
        name: it.name,
        calories: Number(it.calories),
        protein_g: Number(it.protein_g) || 0,
        carbs_g: Number(it.carbs_g) || 0,
        fat_g: Number(it.fat_g) || 0,
        source: 'manual',
      }));
      const res = await logMeal(user.user_id, payload);
      setResult(res.data);
      setItems([defaultItem()]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to log meal.');
    } finally {
      setLoading(false);
    }
  };

  const MEAL_TYPES = [
    { key: 'breakfast', label: '🌅 Breakfast' },
    { key: 'lunch', label: '☀️ Lunch' },
    { key: 'dinner', label: '🌙 Dinner' },
    { key: 'snack', label: '🍎 Snack' },
  ] as const;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.bg} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>LOG MEAL</Text>
          </View>
          <Text style={styles.title}>Track Your{'\n'}Nutrition 🥗</Text>
        </View>

        {/* Meal Type Selector */}
        <View style={styles.mealTypeRow}>
          {MEAL_TYPES.map((mt) => (
            <TouchableOpacity
              key={mt.key}
              style={[styles.mealTypeChip, mealType === mt.key && styles.mealTypeActive]}
              onPress={() => setMealType(mt.key)}
            >
              <Text style={[styles.mealTypeText, mealType === mt.key && styles.mealTypeTextActive]}>
                {mt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live Total Bar */}
        <View style={styles.totalBar}>
          <View style={styles.totalItem}>
            <Text style={styles.totalVal}>{totals.calories.toFixed(0)}</Text>
            <Text style={styles.totalLbl}>kcal</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={[styles.totalVal, { color: Colors.secondary }]}>{totals.protein.toFixed(1)}g</Text>
            <Text style={styles.totalLbl}>protein</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={[styles.totalVal, { color: Colors.accent }]}>{totals.carbs.toFixed(1)}g</Text>
            <Text style={styles.totalLbl}>carbs</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={[styles.totalVal, { color: Colors.purple }]}>{totals.fat.toFixed(1)}g</Text>
            <Text style={styles.totalLbl}>fat</Text>
          </View>
        </View>

        {/* Result Banner */}
        {result && (
          <View style={styles.resultBanner}>
            <Text style={styles.resultTitle}>✅ Meal Logged!</Text>
            <Text style={styles.resultSub}>
              {result.total_calories} kcal · {result.total_protein}g protein
            </Text>
          </View>
        )}

        {/* Food Items */}
        {items.map((it, idx) => (
          <NeoCard key={idx} title={`Food Item ${idx + 1}`} accent={Colors.green}>
            {/* Quick presets */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
              {MEAL_PRESETS.map((p) => (
                <TouchableOpacity key={p.name} style={styles.presetChip} onPress={() => applyPreset(idx, p)}>
                  <Text>{p.emoji}</Text>
                  <Text style={styles.presetText}>{p.name.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <NeoInput
              label="Food Name"
              placeholder="e.g. Grilled Chicken"
              value={it.name}
              onChangeText={(v) => updateItem(idx, 'name', v)}
              containerStyle={{ marginTop: Spacing.md }}
            />

            <View style={styles.row}>
              <NeoInput label="Calories" placeholder="350" value={it.calories} onChangeText={(v) => updateItem(idx, 'calories', v)} keyboardType="decimal-pad" containerStyle={{ flex: 1, marginRight: Spacing.sm }} />
              <NeoInput label="Protein (g)" placeholder="30" value={it.protein_g} onChangeText={(v) => updateItem(idx, 'protein_g', v)} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
            </View>
            <View style={styles.row}>
              <NeoInput label="Carbs (g)" placeholder="45" value={it.carbs_g} onChangeText={(v) => updateItem(idx, 'carbs_g', v)} keyboardType="decimal-pad" containerStyle={{ flex: 1, marginRight: Spacing.sm }} />
              <NeoInput label="Fat (g)" placeholder="5" value={it.fat_g} onChangeText={(v) => updateItem(idx, 'fat_g', v)} keyboardType="decimal-pad" containerStyle={{ flex: 1 }} />
            </View>

            {items.length > 1 && (
              <NeoButton title="✕ Remove" onPress={() => setItems((p) => p.filter((_, i) => i !== idx))} variant="danger" size="sm" />
            )}
          </NeoCard>
        ))}

        {/* Add Item */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setItems((p) => [...p, defaultItem()])}>
          <Text style={styles.addBtnText}>+ Add Food Item</Text>
        </TouchableOpacity>

        <NeoButton title="Log Meal 🥗" onPress={handleLog} loading={loading} variant="primary" size="lg" fullWidth style={{ marginTop: Spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: Colors.bg },
  container: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  header: { marginBottom: Spacing.xl },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.green,
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

  mealTypeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' },
  mealTypeChip: {
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.cardAlt,
  },
  mealTypeActive: {
    backgroundColor: Colors.green,
    borderColor: Colors.border,
    shadowColor: Colors.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  mealTypeText: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary },
  mealTypeTextActive: { fontWeight: Typography.fontWeightBold, color: Colors.text },

  totalBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: Colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    justifyContent: 'space-between',
  },
  totalItem: { alignItems: 'center', flex: 1 },
  totalVal: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBlack, color: Colors.text },
  totalLbl: { fontSize: Typography.fontSizeXS, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  totalDivider: { width: 2, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.xs },

  resultBanner: {
    backgroundColor: Colors.greenLight,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    shadowColor: Colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  resultTitle: { fontSize: Typography.fontSizeLG, fontWeight: Typography.fontWeightBlack, color: Colors.text },
  resultSub: { fontSize: Typography.fontSizeSM, color: Colors.textSecondary, marginTop: Spacing.xs },

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
  presetText: { fontSize: Typography.fontSizeXS, color: Colors.text },

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
});
