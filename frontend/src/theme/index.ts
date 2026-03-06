/**
 * Yondly Design System
 * Central theme configuration for consistent styling across the app
 */

export const colors = {
    // Primary - Green brand color
    primary: '#4C7B4B',
    primaryDark: '#1f5421',
    primaryLight: '#e8f5e9', // Light green background

    // Neutrals
    background: '#f8f9fa',
    surface: '#ffffff',
    border: '#e0e0e0',

    // Text
    textPrimary: '#1a1a1a',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textInverse: '#ffffff',

    // Status
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowDark: 'rgba(0, 0, 0, 0.12)',
};

export const Typography = {
    // Font Sizes
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,

    // Font Weights
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,

    // Line Heights
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
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
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
};

export const Shadows = {
    card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    elevated: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 4,
    },
    button: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
};

export const Layout = {
    screenPadding: Spacing.lg,
    cardPadding: Spacing.lg,
    sectionSpacing: Spacing.xl,
    gridGap: Spacing.md,
};

// Common component styles
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
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
    },
    buttonSecondary: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        fontSize: Typography.base,
        color: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.border,
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
