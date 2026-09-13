/**
 * EAS — Earn And Save
 * Design tokens: brand colours, typography, spacing
 */

export const Colors = {
  // Brand
  primary: "#0B7A3B",
  primaryDark: "#085C2C",
  primaryLight: "#12A653",
  accent: "#F5A623",

  // Neutral
  ink: "#0F172A",
  subtext: "#475569",
  muted: "#94A3B8",
  border: "#E2E8F0",
  surface: "#FFFFFF",
  bg: "#F8FAFC",

  // Semantic
  error: "#DC2626",
  errorLight: "#FEF2F2",
  success: "#16A34A",
  successLight: "#DCFCE7",

  // OTP box
  otpIdle: "#EFF6FF",
  otpActive: "#0B7A3B",
  otpFilled: "#F0FDF4",
} as const;

export const Typography = {
  displayLg: { fontSize: 36, fontWeight: "800" as const, letterSpacing: -0.5 },
  displayMd: { fontSize: 28, fontWeight: "700" as const },
  titleLg: { fontSize: 22, fontWeight: "700" as const },
  titleMd: { fontSize: 18, fontWeight: "600" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  bodyMd: { fontSize: 15, fontWeight: "500" as const },
  bodySm: { fontSize: 14, fontWeight: "400" as const },
  caption: { fontSize: 12, fontWeight: "400" as const },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/** React Native Paper theme overrides */
export const paperTheme = {
  colors: {
    primary: Colors.primary,
    secondary: Colors.accent,
    background: Colors.bg,
    surface: Colors.surface,
    error: Colors.error,
    onPrimary: "#FFFFFF",
    onSurface: Colors.ink,
  },
};
