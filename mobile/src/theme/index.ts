// ─── Light Neobrutalism Design Tokens ────────────────────────────────────────
export const Colors = {
  // Backgrounds
  bg: '#FFFBF5',
  card: '#FFFFFF',
  cardAlt: '#F5F0E8',

  // Brand / Accent
  primary: '#FF6B35',      // energetic orange
  primaryLight: '#FFE4D6',
  secondary: '#4ECDC4',    // teal
  secondaryLight: '#D6F5F3',
  accent: '#FFE66D',       // yellow highlight
  accentLight: '#FFF9D6',
  purple: '#845EC2',
  purpleLight: '#E8DCFF',
  green: '#06D6A0',
  greenLight: '#D6FFF5',
  red: '#EF233C',
  redLight: '#FFD6DB',

  // Text
  text: '#1A1A2E',
  textSecondary: '#6B6B8A',
  textMuted: '#A0A0B8',
  textInverse: '#FFFFFF',

  // Borders (neobrutalism heavy borders)
  border: '#1A1A2E',
  borderLight: '#D0CCC4',

  // Shadows (flat offset shadows)
  shadow: '#1A1A2E',
};

export const Typography = {
  fontSizeXS: 11,
  fontSizeSM: 13,
  fontSizeMD: 15,
  fontSizeLG: 18,
  fontSizeXL: 22,
  fontSize2XL: 28,
  fontSize3XL: 36,

  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
  fontWeightBlack: '900' as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Neobrutalism card style
export const NeoCard = {
  backgroundColor: Colors.card,
  borderWidth: 2,
  borderColor: Colors.border,
  borderRadius: BorderRadius.md,
  // iOS shadow
  shadowColor: Colors.shadow,
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  // Android
  elevation: 4,
};

export const NeoButton = {
  borderWidth: 2,
  borderColor: Colors.border,
  borderRadius: BorderRadius.sm,
  shadowColor: Colors.shadow,
  shadowOffset: { width: 3, height: 3 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 3,
};
