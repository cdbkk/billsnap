// BillSnap Theme - Emerald Ledger
// Professional finance aesthetic with Thai prosperity vibes
// Green = money/growth, Gold = prosperity

export const Colors = {
  // Primary - Emerald (main brand, CTAs)
  primary: '#00A86B',
  primaryDark: '#008F5B',
  primaryLight: '#E8F5E9',
  primaryMuted: '#C8E6C9',

  // Secondary - Deep Charcoal (headers, emphasis)
  secondary: '#263238',
  secondaryLight: '#37474F',

  // Accent - Gold (highlights, special elements)
  accent: '#FBC02D',
  accentDark: '#F9A825',
  accentLight: '#FFF8E1',

  // Status colors
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#F44336',
  errorLight: '#FFEBEE',

  // Payment status badges
  paid: '#4CAF50',
  paidBg: '#E8F5E9',
  pending: '#FF9800',
  pendingBg: '#FFF3E0',
  refunded: '#F44336',
  refundedBg: '#FFEBEE',

  // Neutrals
  white: '#FFFFFF',
  background: '#F5F7F8',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E0E0E0',
  borderLight: '#EEEEEE',

  // Text
  textPrimary: '#212121',
  textSecondary: '#757575',
  textMuted: '#9E9E9E',
  textOnPrimary: '#FFFFFF',

  // Receipt specific
  receiptPaper: '#FFFEF7',
  receiptBorder: '#E0E0E0',
  receiptText: '#212121',
  watermark: 'rgba(0, 168, 107, 0.08)',

  // Skeleton loading
  skeleton: '#E0E0E0',
  skeletonHighlight: '#F5F5F5',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 26,
  heading: 32,
} as const;

// Touch targets - 48px minimum, 56px for primary CTAs
export const TouchTarget = {
  minimum: 48,
  primary: 56,
  icon: 48,
} as const;

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  // Special shadow for FAB with brand color
  fab: {
    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

// Animation timing
export const Animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

// Active state scale for touch feedback
export const ActiveScale = 0.96;

// Typography presets
export const typography = {
  // Headings
  h1: { fontSize: FontSize.heading, fontWeight: '700' as const, color: Colors.textPrimary },
  h2: { fontSize: FontSize.xxl, fontWeight: '700' as const, color: Colors.textPrimary },
  h3: { fontSize: FontSize.xl, fontWeight: '600' as const, color: Colors.textPrimary },
  title: { fontSize: FontSize.lg, fontWeight: '600' as const, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, fontWeight: '400' as const, color: Colors.textSecondary },

  // Body text
  body: { fontSize: FontSize.md, fontWeight: '400' as const, color: Colors.textPrimary, lineHeight: 22 },
  bodySmall: { fontSize: FontSize.sm, fontWeight: '400' as const, color: Colors.textSecondary, lineHeight: 18 },

  // Labels and captions
  label: { fontSize: FontSize.sm, fontWeight: '600' as const, color: Colors.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  caption: { fontSize: FontSize.xs, fontWeight: '400' as const, color: Colors.textMuted },

  // Special
  price: { fontSize: FontSize.lg, fontWeight: '700' as const, color: Colors.textPrimary },
  priceSmall: { fontSize: FontSize.md, fontWeight: '600' as const, color: Colors.textPrimary },
  button: { fontSize: FontSize.md, fontWeight: '600' as const },

  // Thai text needs more line height
  thai: { lineHeight: 28 },
} as const;

// Component-specific styles
export const componentStyles = {
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  cardElevated: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  input: {
    minHeight: 52,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
} as const;

// Legacy exports for backwards compatibility
export const colors = Colors;
export const spacing = Spacing;
export const radius = BorderRadius;
export const shadows = {
  card: Shadows.md,
  header: Shadows.sm,
};

// Alias for backward compatibility
export const brand = Colors.primary;
