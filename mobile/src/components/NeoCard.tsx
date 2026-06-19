import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, NeoCard } from '../theme';

interface NeoCardProps {
  children: React.ReactNode;
  title?: string;
  accent?: string;
  style?: ViewStyle;
  noPadding?: boolean;
}

export default function NeoCardComponent({
  children,
  title,
  accent = Colors.primary,
  style,
  noPadding = false,
}: NeoCardProps) {
  return (
    <View style={[styles.card, style]}>
      {title && (
        <View style={[styles.titleBar, { backgroundColor: accent }]}>
          <Text style={styles.title}>{title}</Text>
        </View>
      )}
      <View style={noPadding ? undefined : styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    ...NeoCard,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  titleBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
    color: Colors.text,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    padding: Spacing.lg,
  },
});
