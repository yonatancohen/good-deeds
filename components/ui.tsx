/**
 * Shared UI components — "Cheerful Encouragement" design system
 * Palette & tokens: lib/colors.ts
 * Typography: Baloo2_700Bold (headings), system sans-serif (body)
 * Touch targets: minimum 44×44px on all interactive elements
 * Icons: lucide-react-native — NO emoji icons in UI
 */

import React, { useRef, useState } from 'react';
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import { shadow } from '@/lib/shadow';

// ── Color tokens — re-exported for backward compatibility ─────────────────────
export { Colors } from '@/lib/colors';
import { Colors } from '@/lib/colors';
import { CARD_DEPTH, hardDepthStyle } from '@/lib/cardDepth';

const USE_ND = Platform.OS !== 'web';

const S = StyleSheet.create({
  // ── Button ────────────────────────────────────────────────────────────────
  btnBase: {
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 28,
    minHeight: 54,
    flexDirection: 'row' as const,
    gap: 8,
  },
  btnFull: { alignSelf: 'stretch' as const },

  // Backgrounds
  btnPrimary:         { backgroundColor: Colors.primary },
  btnPrimaryDisabled: { backgroundColor: '#ffe082' },
  btnSecondary:       { backgroundColor: '#f5ede2' },
  btnDanger:          { backgroundColor: Colors.danger },
  btnDangerDisabled:  { backgroundColor: '#ffb4ab' },
  btnGhost:           { backgroundColor: 'transparent' },

  // Text
  btnTextPrimary:   { color: Colors.primaryDark, fontWeight: '700' as const, fontSize: 17, fontFamily: 'Baloo2_700Bold' } as any,
  btnTextPrimaryOff:{ color: '#a08000',           fontWeight: '700' as const, fontSize: 17, fontFamily: 'Baloo2_700Bold' } as any,
  btnTextSecondary: { color: Colors.muted,         fontWeight: '700' as const, fontSize: 17, fontFamily: 'Baloo2_700Bold' } as any,
  btnTextDanger:    { color: '#fff',               fontWeight: '700' as const, fontSize: 17, fontFamily: 'Baloo2_700Bold' } as any,
  btnTextGhost:     { color: Colors.primaryDark,   fontWeight: '600' as const, fontSize: 16, fontFamily: 'Baloo2_700Bold' } as any,

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...shadow('#785900', 2, 12, 0.07, 3),
  },

  // ── Badge ─────────────────────────────────────────────────────────────────
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start' as const,
  },
  badgePrimary: { backgroundColor: Colors.primaryLight },
  badgeSuccess: { backgroundColor: Colors.successLight },
  badgeWarning: { backgroundColor: '#ffdf9e' },
  badgeMuted:   { backgroundColor: Colors.surfaceDim },
  badgeAccent:  { backgroundColor: Colors.peach },

  badgeTextPrimary: { color: Colors.primaryDark,  fontSize: 12, fontWeight: '600' as const },
  badgeTextSuccess: { color: Colors.success,       fontSize: 12, fontWeight: '600' as const },
  badgeTextWarning: { color: '#5b4300',            fontSize: 12, fontWeight: '600' as const },
  badgeTextMuted:   { color: Colors.muted,         fontSize: 12, fontWeight: '600' as const },
  badgeTextAccent:  { color: '#7a3400',            fontSize: 12, fontWeight: '600' as const },

  // ── Progress bar ──────────────────────────────────────────────────────────
  progressTrack: {
    borderRadius: 999,
    backgroundColor: Colors.surfaceDim,   // warm #e1d9ce
    overflow: 'hidden' as const,
  },
  progressFill:   { height: '100%' as any, borderRadius: 999 },
  progressNormal: { backgroundColor: Colors.primary },   // yellow
  progressDone:   { backgroundColor: Colors.successLight }, // green

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeleton: { backgroundColor: Colors.surfaceDim },

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
    color: Colors.primaryDark,          // warm amber title
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
    color: Colors.outline,
    textAlign: 'right' as const,
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase' as const,
  },

  // ── EmptyState ────────────────────────────────────────────────────────────
  emptyWrap: { alignItems: 'center' as const, paddingVertical: 64, paddingHorizontal: 24 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.primaryLight,
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
    backgroundColor: Colors.border,
    alignSelf: 'center' as const,
    marginBottom: 16,
  },

  // ── FormField ─────────────────────────────────────────────────────────────
  formField: { marginBottom: 20 },
  formLabel: {
    fontSize: 14, fontWeight: '600' as const,
    color: Colors.primaryDark, textAlign: 'right' as const, marginBottom: 2,
  },
  formRequired: { color: Colors.danger },
  formHint: {
    fontSize: 11, color: Colors.muted,
    textAlign: 'right' as const, marginBottom: 8, lineHeight: 16,
  },

  // ── IconButton ────────────────────────────────────────────────────────────
  iconBtnGhost:  { backgroundColor: 'transparent' },
  iconBtnMuted:  { backgroundColor: '#f5ede2' },
  iconBtnDanger: { backgroundColor: Colors.dangerLight },
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
  const [pressed, setPressed] = useState(false);
  const pressScale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    setPressed(true);
    Animated.spring(pressScale, {
      toValue: 0.96,
      useNativeDriver: USE_ND,
      tension: 400, friction: 20,
    }).start();
  }
  function handlePressOut() {
    setPressed(false);
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: USE_ND,
      tension: 300, friction: 18,
    }).start();
  }

  const bg: ViewStyle =
    variant === 'primary'   ? (isOff ? S.btnPrimaryDisabled : S.btnPrimary) :
    variant === 'secondary' ? S.btnSecondary :
    variant === 'danger'    ? (isOff ? S.btnDangerDisabled  : S.btnDanger)  :
                               S.btnGhost;

  const textStyle: TextStyle =
    variant === 'primary'   ? (isOff ? S.btnTextPrimaryOff : S.btnTextPrimary) :
    variant === 'secondary' ? S.btnTextSecondary :
    variant === 'danger'    ? S.btnTextDanger    :
                               S.btnTextGhost;

  const spinnerColor =
    variant === 'secondary' || variant === 'ghost' ? Colors.primaryDark : Colors.primaryDark;

  const primaryShadow =
    variant === 'primary' && !isOff ? hardDepthStyle(pressed, 5) : {};

  return (
    <TouchableOpacity
      onPress={isOff ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isOff}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isOff }}
      style={[fullWidth && S.btnFull, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
    >
      <Animated.View
        style={[
          S.btnBase,
          bg,
          primaryShadow,
          { transform: [{ scale: pressScale }] },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={spinnerColor} />
        ) : (
          <Text style={[textStyle, { writingDirection: 'rtl' }]}>{label}</Text>
        )}
      </Animated.View>
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
  style?: ViewStyle;
  accessibilityLabel?: string;
  glass?: boolean;
}

export function Card({ children, style, accessibilityLabel, glass }: CardProps) {
  const glassStyle: ViewStyle = glass ? {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderColor: 'rgba(255,255,255,0.5)',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any)
      : {}),
  } : {};

  return (
    <View style={[S.card, glassStyle, style]} accessibilityLabel={accessibilityLabel}>
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

export function ProgressBar({ value, max, height = 10, accessibilityLabel }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const reached = pct >= 100;

  // Web: liquid shimmer via inline CSS animation (keyframe injected in injectWebCSS.web.ts)
  const liquidStyle = Platform.OS === 'web' && !reached
    ? ({
        backgroundImage: 'linear-gradient(90deg, #ffc107 0%, #fabd00 40%, #ffdf9e 70%, #ffc107 100%)',
        backgroundSize: '200% 100%',
        animation: 'liquidFlow 2s linear infinite',
        backgroundColor: undefined,
      } as any)
    : {};

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
          liquidStyle,
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
      </Text>
      {hint && (
        <Text style={[S.formHint, { writingDirection: 'rtl' }]}>{hint}</Text>
      )}
      {children}
    </View>
  );
}

// ── Input style helpers ────────────────────────────────────────────────────────

/** @deprecated use inputStyle below */
export const inputClass =
  'bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-base';

/** Shared pill-shaped input style — use for TextInput */
export const inputStyle: ViewStyle = {
  backgroundColor: '#f4ece7',     // surface-container warm
  borderWidth: 2,
  borderColor: '#e9e1db',         // surface-variant warm
  borderRadius: 999,              // pill
  paddingHorizontal: 18,
  paddingVertical: 14,
};

/** Focus override — spread over inputStyle when field is focused */
export const inputFocusStyle: ViewStyle = {
  borderColor: Colors.primary,    // yellow
  ...(Platform.OS === 'web'
    ? ({ boxShadow: '0 0 0 4px rgba(255,193,7,0.2)' } as any)
    : {}),
};

// ── Tactile Icon Button ────────────────────────────────────────────────────────
// Stitch-style 3D press effect: the button sinks 3px on press.
// On web: boxShadow simulates depth, disappears + translateY on pressIn.
// On native: spring translateY only.

interface TactileIconBtnProps {
  onPress: () => void;
  style?: any;
  shadowColor?: string;
  accessibilityLabel?: string;
  children: React.ReactNode;
}

export function TactileIconBtn({
  onPress,
  style,
  shadowColor = 'rgba(120,89,0,0.2)',
  accessibilityLabel,
  children,
}: TactileIconBtnProps) {
  const [pressed, setPressed] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  function pressIn() {
    setPressed(true);
    Animated.spring(translateY, {
      toValue: 3,
      useNativeDriver: USE_ND,
      tension: 400, friction: 15,
    }).start();
  }
  function pressOut() {
    setPressed(false);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: USE_ND,
      tension: 300, friction: 18,
    }).start();
  }

  const depthColor = shadowColor.startsWith('#') ? shadowColor : CARD_DEPTH;
  const depth: any = hardDepthStyle(pressed, 3, depthColor);

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : undefined}
    >
      <Animated.View style={[style, depth, { transform: [{ translateY: translateY as any }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
