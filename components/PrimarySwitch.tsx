/**
 * Cross-platform Switch that reliably renders with primary (indigo) color.
 * React Native Web ignores thumbColor on the built-in Switch component,
 * so we use a custom TouchableOpacity-based toggle instead.
 */
import React from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/components/ui';
import { shadow } from '@/lib/shadow';

interface PrimarySwitchProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  accessibilityLabel?: string;
  accessibilityState?: { checked?: boolean };
}

export default function PrimarySwitch({
  value,
  onValueChange,
  accessibilityLabel,
  accessibilityState,
}: PrimarySwitchProps) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState ?? { checked: value }}
      activeOpacity={0.85}
      style={[
        S.track,
        value ? S.trackOn : S.trackOff,
        Platform.OS === 'web' && { cursor: 'pointer' } as any,
      ]}
    >
      <View style={[S.thumb, value ? S.thumbOn : S.thumbOff]} />
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
  trackOn:  { backgroundColor: '#c7d2fe' },
  trackOff: { backgroundColor: '#e2e8f0' },
  thumb: {
    width: 22, height: 22, borderRadius: 11,
    ...shadow('#000', 1, 2, 0.18, 2),
  },
  thumbOn: {
    backgroundColor: Colors.primary,
    marginLeft: 22,  // slide right: track(50) - padding(6) - thumb(22) = 22
  },
  thumbOff: {
    backgroundColor: '#fff',
    marginLeft: 0,
  },
});
