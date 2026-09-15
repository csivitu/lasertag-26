export const THEME = {
  colors: {
    bg: "#09090B",
    surface: "#141417",
    surfaceSubtle: "#1C1C21",
    border: "#27272A",
    borderHover: "#3F3F46",
    accent: "#10B981",
    accentBg: "rgba(16, 185, 129, 0.12)",
    textPrimary: "#FAFAFA",
    textSecondary: "#A1A1AA",
    textMuted: "#71717A",
    danger: "#F43F5E",
    amber: "#F59E0B",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    one: 4,
    two: 8,
    three: 12,
    four: 16,
    five: 20,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
};

export const Colors = {
  light: {
    text: THEME.colors.textPrimary,
    background: THEME.colors.bg,
    tint: THEME.colors.accent,
    icon: THEME.colors.textSecondary,
    tabIconDefault: THEME.colors.textMuted,
    tabIconSelected: THEME.colors.accent,
    textSecondary: THEME.colors.textSecondary,
    border: THEME.colors.border,
  },
  dark: {
    text: THEME.colors.textPrimary,
    background: THEME.colors.bg,
    tint: THEME.colors.accent,
    icon: THEME.colors.textSecondary,
    tabIconDefault: THEME.colors.textMuted,
    tabIconSelected: THEME.colors.accent,
    textSecondary: THEME.colors.textSecondary,
    border: THEME.colors.border,
  },
};

export const Spacing = THEME.spacing;
export const Fonts = {
  sans: "System",
  mono: "System",
};
export type ThemeColor = keyof typeof Colors.light;
export const MaxContentWidth = 1200;
