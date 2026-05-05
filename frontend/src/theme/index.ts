export const colors = {
  // Primary — vert frais
  primary: '#2D7D46',
  primaryDark: '#1a5c30',
  primaryLight: '#E8F5EC',
  primaryMid: '#4CAF6A',

  // Accent — orange terre pour l'anti-gaspi / urgence
  accent: '#E8833A',
  accentLight: '#FDF0E6',

  // Neutrals
  background: '#F6F7F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2EE',
  border: '#E4E8E2',
  borderLight: '#EEF0EC',

  // Text
  textPrimary: '#111B0E',
  textSecondary: '#5A6B56',
  textTertiary: '#9BA89A',
  textInverse: '#FFFFFF',

  // Status
  success: '#2D7D46',
  warning: '#E8833A',
  error: '#D93025',
  info: '#1A73E8',

  // Tab bar
  tabActive: '#2D7D46',
  tabInactive: '#9BA89A',

  // Shadows
  shadow: 'rgba(17, 27, 14, 0.06)',
  shadowDark: 'rgba(17, 27, 14, 0.12)',
};

export const Typography = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 36,

  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,

  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const Shadows = {
  card: {
    shadowColor: '#111B0E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#111B0E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  button: {
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  fab: {
    shadowColor: '#2D7D46',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
};

export const Layout = {
  screenPadding: Spacing.lg,
  cardPadding: Spacing.lg,
  sectionSpacing: Spacing.xl,
  gridGap: Spacing.md,
};

export const CommonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  button: {
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.sm,
    paddingVertical: 13,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.base,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: colors.textPrimary,
    marginBottom: Spacing.md,
  },
  pill: {
    borderRadius: BorderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: colors.primaryLight,
  },
  pillText: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    color: colors.primary,
  },
};

export default {
  colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
  CommonStyles,
};
