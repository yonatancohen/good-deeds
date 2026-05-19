/**
 * Cross-platform Switch that reliably renders with primary (indigo) color.
 * React Native Web ignores thumbColor on the built-in Switch component,
 * so we use a custom TouchableOpacity-based toggle instead.
 */
import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/components/ui';
import { shadow } from '@/lib/shadow';

type PrimarySwitchVariant = 'default' | 'onColor';

interface PrimarySwitchProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel?: string;
  accessibilityState?: { checked?: boolean };
  /** `onColor` — white track; thumb uses `thumbOnColor` when on */
  variant?: PrimarySwitchVariant;
  /** Thumb fill when variant=onColor and switch is on (default: primaryDark) */
  thumbOnColor?: string;
}

export default function PrimarySwitch({
  value,
  onValueChange,
  accessibilityLabel,
  accessibilityState,
  variant = 'default',
  thumbOnColor = Colors.primaryDark,
}: PrimarySwitchProps) {
  const onColor = variant === 'onColor';
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState ?? { checked: value }}
      activeOpacity={0.85}
      style={[
        S.track,
        value
          ? (onColor ? S.trackOnColorOn : S.trackOn)
          : (onColor ? S.trackOnColorOff : S.trackOff),
        Platform.OS === 'web' && { cursor: 'pointer' } as any,
      ]}
    >
      <View
        style={[
          S.thumb,
          value
            ? (onColor ? [S.thumbOnColorOn, { backgroundColor: thumbOnColor }] : S.thumbOn)
            : (onColor ? S.thumbOnColorOff : S.thumbOff),
        ]}
      />
    </TouchableOpacity>
  );
}

// Track: 50×28, padding 3 each side, thumb: 22×22
// Movement range: 50 - 3×2 - 22 = 22 px
const S = StyleSheet.create({
  track: {
    width: 50, height: 28, borderRadius: 14,
    paddingHorizontal: 3, paddingVertical: 3,
    justifyContent: 'center',
  },
  trackOn:  { backgroundColor: '#ffdf9e' },
  trackOff: { backgroundColor: '#e9e1db' },
  trackOnColorOn:  { backgroundColor: 'rgba(255,255,255,0.95)' },
  trackOnColorOff: { backgroundColor: 'rgba(0,0,0,0.22)' },
  thumb: {
    width: 22, height: 22, borderRadius: 11,
    ...shadow('#000', 1, 2, 0.18, 2),
  },
  thumbOn: {
    backgroundColor: Colors.primary,
    marginLeft: 22,
  },
  thumbOff: {
    backgroundColor: '#fff',
    marginLeft: 0,
  },
  thumbOnColorOn: {
    backgroundColor: Colors.primaryDark,
    marginLeft: 22,
  },
  thumbOnColorOff: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    marginLeft: 0,
  },
});
