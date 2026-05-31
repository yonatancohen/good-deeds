/**
 * Staggered list/grid entrance — fade + slide up, one item after another.
 */
import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

const STAGGER_MS = 55;
const MAX_STAGGER_INDEX = 14;
const SPRING = { damping: 20, stiffness: 240, mass: 0.75 };

export interface StaggeredItemProps {
  /** Position in the list (0-based); drives delay */
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Skip motion (e.g. skeleton placeholders) */
  disabled?: boolean;
}

export function StaggeredItem({
  index,
  children,
  style,
  disabled = false,
}: StaggeredItemProps) {
  const opacity = useSharedValue(disabled ? 1 : 0);
  const translateY = useSharedValue(disabled ? 0 : 16);
  const scale = useSharedValue(disabled ? 1 : 0.96);

  useEffect(() => {
    if (disabled) {
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      return;
    }
    const delay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_MS;
    opacity.value = 0;
    translateY.value = 16;
    scale.value = 0.96;
    opacity.value = withDelay(delay, withSpring(1, SPRING));
    translateY.value = withDelay(delay, withSpring(0, SPRING));
    scale.value = withDelay(delay, withSpring(1, SPRING));
  }, [index, disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
