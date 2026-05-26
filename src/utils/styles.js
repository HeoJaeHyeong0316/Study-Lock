import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#3B5BFC',
  primaryLight: '#EEF1FF',
  primaryDark: '#2541D4',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  text: '#0F172A',
  textSub: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  card: '#FFFFFF',
  cyan: '#06B6D4',
  purple: '#8B5CF6',
  orange: '#F97316',
  green: '#10B981',
};

export const FONTS = {
  bold: 'System',
  medium: 'System',
  regular: 'System',
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

export const SHADOW = {
  card: {
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  strong: {
    shadowColor: '#3B5BFC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: 20,
    ...SHADOW.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOW.strong,
  },
  primaryBtnText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
