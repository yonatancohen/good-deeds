/**
 * Shared UI components — built from UI/UX Pro Max design system
 * Uses React Native StyleSheet.create for reliable cross-platform rendering.
 * NativeWind className is intentionally NOT used here due to react-native-web
 * 0.21.2 incompatibility with react-native-css-interop's $$css approach.
 *
 * Design tokens:
 *   Primary:    indigo-600  (#4F46E5)
 *   Accent/CTA: orange-500  (#F97316)
 *   Success:    emerald-500 (#10B981)
 *   Background: slate-50    (#F8FAFC)
 *   Card:       white
 *   Text:       slate-900   (#0F172A)
 *   Muted:      slate-600   (#475569)
 *   Border:     slate-200   (#E2E8F0)
 *
 * Typography: Baloo2_700Bold (headings), Nunito_400Regular / Nunito_600SemiBold (body)
 * Touch targets: minimum 44×44px on all interactive elements
 * Icons: lucide-react-native — NO emoji icons in UI
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { shadow } from '@/lib/shadow';

// ── Colour constants ──────────────────────────────────────────────────────────
export const Colors = {
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  accent: '#F97316',
  accentLight: '#FFF7ED',
  success: '#10B981',
  successLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#475569',
  border: '#E2E8F0',
};

const S = StyleSheet.create({
  // ── Button ────────────────────────────────────────────────────────────────
  btnBase: {
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 15,
    paddingHorizontal: 24,
    minHeight: 52,
    flexDirection: 'row' as const,
  },
  btnFull: { flex: 1 },
  btnPrimary: { backgroundColor: Colors.primary },
  btnPrimaryDisabled: { backgroundColor: '#a5b4fc' },
  btnSecondary: { backgroundColor: '#f1f5f9' },
  btnDanger: { backgroundColor: Colors.danger },
  btnDangerDisabled: { backgroundColor: '#fca5a5' },
  btnGhost: { backgroundColor: 'transparent' },

  btnTextPrimary: { color: '#fff', fontWeight: '700' as const, fontSize: 16 },
  btnTextSecondary: { color: '#334155', fontWeight: '600' as const, fontSize: 16 },
  btnTextDanger: { color: '#fff', fontWeight: '700' as const, fontSize: 16 },
  btnTextGhost: { color: Colors.primary, fontWeight: '600' as const, fontSize: 16 },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...shadow('#000', 2, 8, 0.07, 3),
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start' as const,
  },
  badgePrimary: { backgroundColor: Colors.primaryLight },
  badgeSuccess: { backgroundColor: '#d1fae5' },
  badgeWarning: { backgroundColor: '#fef3c7' },
  badgeMuted: { backgroundColor: '#f1f5f9' },
  badgeAccent: { backgroundColor: Colors.accentLight },

  badgeTextPrimary: { color: '#4338ca', fontSize: 12, fontWeight: '600' as const },
  badgeTextSuccess: { color: '#065f46', fontSize: 12, fontWeight: '600' as const },
  badgeTextWarning: { color: '#92400e', fontSize: 12, fontWeight: '600' as const },
  badgeTextMuted: { color: '#64748b', fontSize: 12, fontWeight: '600' as const },
  badgeTextAccent: { color: '#c2410c', fontSize: 12, fontWeight: '600' as const },

  // ── Progress bar ──────────────────────────────────────────────────────────
  progressTrack: {
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden' as const,
  },
  progressFill: { height: '100%' as any, borderRadius: 999 },
  progressNormal: { backgroundColor: '#6366f1' },
  progressDone: { backgroundColor: Colors.success },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeleton: { backgroundColor: '#e2e8f0' },

  // ── ScreenHeader ─────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row-reverse' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right' as const,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'right' as const,
    marginTop: 1,
  },

  // ── SectionLabel ─────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#94a3b8',
    textAlign: 'right' as const,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  },

  // ── EmptyState ────────────────────────────────────────────────────────────
  emptyWrap: { alignItems: 'center' as const, paddingVertical: 64, paddingHorizontal: 24 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '700' as const,
    color: Colors.text, textAlign: 'center' as const, marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13, color: Colors.muted,
    textAlign: 'center' as const, lineHeight: 19,
  },

  // ── SheetHandle ───────────────────────────────────────────────────────────
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center' as const,
    marginBottom: 16,
  },

  // ── FormField ─────────────────────────────────────────────────────────────
  formField: { marginBottom: 20 },
  formLabel: {
    fontSize: 14, fontWeight: '600' as const,
    color: '#1e293b', textAlign: 'right' as const, marginBottom: 2,
  },
  formRequired: { color: Colors.danger },
  formHint: {
    fontSize: 11, color: '#94a3b8',
    textAlign: 'right' as const, marginBottom: 8, lineHeight: 16,
  },

  // ── IconButton ────────────────────────────────────────────────────────────
  iconBtnGhost: { backgroundColor: 'transparent' },
  iconBtnMuted: { backgroundColor: '#f1f5f9' },
  iconBtnDanger: { backgroundColor: '#fef2f2' },
});

// ── Button ────────────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  fullWidth = true,
}: ButtonProps) {
  const isOff = disabled || loading;

  const bg: ViewStyle =
    variant === 'primary'   ? (isOff ? S.btnPrimaryDisabled : S.btnPrimary) :
    variant === 'secondary' ? S.btnSecondary :
    variant === 'danger'    ? (isOff ? S.btnDangerDisabled  : S.btnDanger)  :
                               S.btnGhost;

  const textStyle: TextStyle =
    variant === 'primary'   ? S.btnTextPrimary   :
    variant === 'secondary' ? S.btnTextSecondary :
    variant === 'danger'    ? S.btnTextDanger    :
                               S.btnTextGhost;

  const spinnerColor =
    variant === 'secondary' || variant === 'ghost' ? Colors.primary : '#fff';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isOff}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isOff }}
      style={[S.btnBase, bg, fullWidth && S.btnFull, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={[textStyle, { writingDirection: 'rtl' }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

// ── Icon Button (44×44 minimum) ───────────────────────────────────────────────

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'ghost' | 'muted' | 'danger';
  size?: number;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'ghost',
  size = 44,
}: IconButtonProps) {
  const bg: ViewStyle =
    variant === 'muted'  ? S.iconBtnMuted  :
    variant === 'danger' ? S.iconBtnDanger :
                            S.iconBtnGhost;

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        { width: size, height: size, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
        bg,
        Platform.OS === 'web' && { cursor: 'pointer' } as any,
      ]}
    >
      {icon}
    </TouchableOpacity>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  /** @deprecated Pass style prop instead */
  className?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Card({ children, style, accessibilityLabel }: CardProps) {
  return (
    <View style={[S.card, style]} accessibilityLabel={accessibilityLabel}>
      {children}
    </View>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'muted' | 'accent';
  accessibilityLabel?: string;
}

export function Badge({ label, variant = 'primary', accessibilityLabel }: BadgeProps) {
  const bg: ViewStyle =
    variant === 'success' ? S.badgeSuccess :
    variant === 'warning' ? S.badgeWarning :
    variant === 'muted'   ? S.badgeMuted   :
    variant === 'accent'  ? S.badgeAccent  :
                             S.badgePrimary;

  const textStyle: TextStyle =
    variant === 'success' ? S.badgeTextSuccess :
    variant === 'warning' ? S.badgeTextWarning :
    variant === 'muted'   ? S.badgeTextMuted   :
    variant === 'accent'  ? S.badgeTextAccent  :
                             S.badgeTextPrimary;

  return (
    <View style={[S.badge, bg]} accessibilityLabel={accessibilityLabel}>
      <Text style={[textStyle, { writingDirection: 'rtl' }]}>{label}</Text>
    </View>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number;
  max: number;
  height?: number;
  accessibilityLabel?: string;
}

export function ProgressBar({ value, max, height = 12, accessibilityLabel }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const reached = pct >= 100;

  return (
    <View
      style={[S.progressTrack, { height }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      accessibilityLabel={accessibilityLabel ?? `${value} מתוך ${max}`}
    >
      <View
        style={[
          S.progressFill,
          reached ? S.progressDone : S.progressNormal,
          { width: `${pct}%` as any },
        ]}
      />
    </View>
  );
}

// ── Skeleton (loading placeholder) ───────────────────────────────────────────

interface SkeletonProps {
  width?: number | string;
  height?: number;
  rounded?: boolean;
  className?: string;
  style?: ViewStyle;
}

export function Skeleton({ width, height = 16, rounded = false, style }: SkeletonProps) {
  return (
    <View
      style={[
        S.skeleton,
        { width: width as any, height, borderRadius: rounded ? 999 : 8 },
        style,
      ]}
      accessibilityLabel="טוען..."
    />
  );
}

// ── Screen Header ─────────────────────────────────────────────────────────────

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, left, right }: ScreenHeaderProps) {
  return (
    <View style={S.header}>
      <View style={S.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl' }]} accessibilityRole="header">
            {title}
          </Text>
          {subtitle && (
            <Text style={[S.headerSub, { writingDirection: 'rtl' }]}>{subtitle}</Text>
          )}
        </View>
        {right && <View style={{ flexDirection: 'row-reverse', gap: 8 }}>{right}</View>}
        {left && <View>{left}</View>}
      </View>
    </View>
  );
}

// ── Section Label ─────────────────────────────────────────────────────────────

export function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={[S.sectionLabel, { writingDirection: 'rtl' }]}>{label}</Text>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View style={S.emptyWrap}>
      <View style={S.emptyIcon}>{icon}</View>
      <Text style={[S.emptyTitle, { fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl' }]}>{title}</Text>
      {description && (
        <Text style={[S.emptyDesc, { writingDirection: 'rtl' }]}>{description}</Text>
      )}
      {action && <View style={{ marginTop: 20 }}>{action}</View>}
    </View>
  );
}

// ── Bottom Sheet Handle ───────────────────────────────────────────────────────

export function SheetHandle() {
  return <View style={S.handle} />;
}

// ── Form Field ────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, hint, required, children }: FormFieldProps) {
  return (
    <View style={S.formField}>
      <Text style={[S.formLabel, { writingDirection: 'rtl' }]}>
        {label}
        {/* required indicator removed — mandatory fields are self-evident from context */}
      </Text>
      {hint && (
        <Text style={[S.formHint, { writingDirection: 'rtl' }]}>{hint}</Text>
      )}
      {children}
    </View>
  );
}

// ── inputClass (kept for backward compat – use inputStyle in new code) ────────

export const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-base';

export const inputStyle: ViewStyle = {
  backgroundColor: '#f8fafc',
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 14,
};
