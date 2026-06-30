import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

interface NeoButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const VARIANT_COLORS = {
  primary: { bg: Colors.primary, text: Colors.textInverse },
  secondary: { bg: Colors.secondary, text: Colors.text },
  accent: { bg: Colors.accent, text: Colors.text },
  ghost: { bg: Colors.card, text: Colors.text },
  danger: { bg: Colors.red, text: Colors.textInverse },
};

const SIZE_STYLES = {
  sm: { paddingH: 12, paddingV: 8, fontSize: Typography.fontSizeSM },
  md: { paddingH: 20, paddingV: 12, fontSize: Typography.fontSizeMD },
  lg: { paddingH: 28, paddingV: 16, fontSize: Typography.fontSizeLG },
};

export default function NeoButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: NeoButtonProps) {
  const variantStyle = VARIANT_COLORS[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: disabled ? Colors.borderLight : variantStyle.bg,
          paddingHorizontal: sizeStyle.paddingH,
          paddingVertical: sizeStyle.paddingV,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.7 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            { color: variantStyle.text, fontSize: sizeStyle.fontSize },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    // Neobrutalism offset shadow
    shadowColor: Colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  text: {
    fontWeight: Typography.fontWeightBold,
    letterSpacing: 0.3,
  },
});
