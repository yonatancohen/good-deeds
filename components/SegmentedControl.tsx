import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/components/ui';
import { HEBREW_ROW } from '@/lib/rtlLayout';
import { shadow } from '@/lib/shadow';

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  segments: SegmentOption<T>[];
  value: T;
  onChange: (id: T) => void;
}

const ptr = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

function segmentLabel(label: string, count?: number) {
  if (count === undefined) return label;
  return `${label} (${count})`;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={S.row} accessibilityRole="tablist">
      {segments.map((seg) => {
        const active = value === seg.id;
        return (
          <TouchableOpacity
            key={seg.id}
            onPress={() => onChange(seg.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={segmentLabel(seg.label, seg.count)}
            style={[S.tab, active && S.tabActive, ptr]}
          >
            <Text
              style={[S.tabText, active ? S.tabTextActive : S.tabTextInactive]}
              numberOfLines={1}
            >
              {segmentLabel(seg.label, seg.count)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const S = StyleSheet.create({
  row: {
    flexDirection: HEBREW_ROW,
    backgroundColor: '#f5ede2',
    borderRadius: 999,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  tabActive: {
    backgroundColor: '#fff',
    ...shadow('#785900', 1, 4, 0.1, 2),
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  } as any,
  tabTextActive: { color: Colors.primaryDark },
  tabTextInactive: { color: Colors.muted },
});
