import React from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';
import { CARD_DEPTH, cardDepthStyle } from '@/lib/cardDepth';

export type DepthShellProps = {
  children: React.ReactNode;
  depth?: number;
  pressed?: boolean;
  hovered?: boolean;
  borderRadius?: number;
  color?: string;
  /** Margin / flex on the outer wrapper */
  outerStyle?: StyleProp<ViewStyle>;
  /** Skip bottom margin when nested in a header row */
  flat?: boolean;
  /** Styles on the lift layer (web shadow / native face) */
  liftStyle?: StyleProp<ViewStyle>;
};

/**
 * 3D “button lip” — box-shadow on web, offset duplicate layer on iOS/Android.
 */
export function DepthShell({
  children,
  depth = 5,
  pressed = false,
  hovered = false,
  borderRadius = 20,
  color = CARD_DEPTH,
  flat = false,
  outerStyle,
  liftStyle,
}: DepthShellProps) {
  const sinkY = pressed ? Math.max(depth - 1, 0) : 0;
  const hoverY = Platform.OS === 'web' && hovered && !pressed ? -4 : 0;
  const outerBase: ViewStyle = flat
    ? { marginBottom: 0 }
    : Platform.OS === 'web'
      ? { marginBottom: 4 }
      : { marginBottom: 4, paddingBottom: depth };

  if (Platform.OS === 'web') {
    return (
      <View style={[outerBase, flat ? null : { paddingBottom: 6 }, outerStyle]}>
        <View
          style={[
            { borderRadius },
            liftStyle,
            cardDepthStyle(pressed, hovered),
            { transform: [{ translateY: sinkY + hoverY }] },
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[outerBase, outerStyle]}>
      <View style={{ position: 'relative' }}>
        {!pressed && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: depth,
              bottom: -depth,
              backgroundColor: color,
              borderRadius,
            }}
          />
        )}
        <View
          style={[
            { borderRadius, position: 'relative', zIndex: 1 },
            liftStyle,
            { transform: [{ translateY: sinkY }] },
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );
}
