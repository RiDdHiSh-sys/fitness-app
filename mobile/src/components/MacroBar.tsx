import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../theme';

interface MacroBarProps {
  label: string;
  consumed: number;
  total: number;
  unit?: string;
  color?: string;
}

export default function MacroBar({
  label,
  consumed,
  total,
  unit = 'g',
  color = Colors.primary,
}: MacroBarProps) {
  const pct = total > 0 ? Math.min((consumed / total) * 100, 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.values}>
          <Text style={{ color }}>{consumed.toFixed(0)}</Text>
          <Text style={styles.separator}>/</Text>
          {total.toFixed(0)}{unit}
        </Text>
      </View>

      {/* Track */}
      <View style={styles.track}>
        {/* Fill */}
        <View
          style={[
            styles.fill,
            { width: `${pct}%` as any, backgroundColor: color },
          ]}
        />
      </View>

      <Text style={styles.pct}>{pct.toFixed(0)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  values: {
    fontSize: Typography.fontSizeSM,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeightMedium,
  },
  separator: {
    color: Colors.textMuted,
    marginHorizontal: 2,
  },
  track: {
    height: 10,
    backgroundColor: Colors.cardAlt,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  pct: {
    fontSize: Typography.fontSizeXS,
    color: Colors.textMuted,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
});
