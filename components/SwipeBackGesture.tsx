/**
 * Edge swipe-to-go-back for installed PWA on web (native stacks handle this on iOS/Android).
 * RTL: drag inward from the right edge, matching iOS Hebrew navigation.
 */
import { useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { I18nManager, Platform, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const EDGE_WIDTH = 28;
const DISMISS_THRESHOLD = 72;
const DISMISS_VELOCITY = 400;
const MAX_DRAG = 140;

export function SwipeBackGesture() {
  const router = useRouter();
  const canGoBackRef = useRef(false);
  const translateX = useSharedValue(0);
  const isRTL = I18nManager.isRTL;

  const refreshCanGoBack = useCallback(() => {
    canGoBackRef.current = router.canGoBack();
  }, [router]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      try {
        router.back();
      } catch {
        /* stack edge case */
      }
    }
  }, [router]);

  if (Platform.OS !== 'web') {
    return null;
  }

  const pan = Gesture.Pan()
    .activeOffsetX(isRTL ? [-12, 0] : [0, 12])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      runOnJS(refreshCanGoBack)();
    })
    .onUpdate((e) => {
      if (!canGoBackRef.current) return;
      const dx = e.translationX;
      // RTL: swipe inward from trailing (right) edge = finger moves left (negative dx)
      const drag = isRTL ? Math.max(0, -dx) : Math.max(0, dx);
      translateX.value = Math.min(drag, MAX_DRAG);
    })
    .onEnd((e) => {
      if (!canGoBackRef.current) {
        translateX.value = withSpring(0, { damping: 22, stiffness: 320 });
        return;
      }
      const dx = e.translationX;
      const drag = isRTL ? Math.max(0, -dx) : Math.max(0, dx);
      const vx = isRTL ? -e.velocityX : e.velocityX;
      if (drag > DISMISS_THRESHOLD || vx > DISMISS_VELOCITY) {
        translateX.value = withTiming(MAX_DRAG, { duration: 120 }, () => {
          runOnJS(goBack)();
          translateX.value = 0;
        });
      } else {
        translateX.value = withSpring(0, { damping: 22, stiffness: 320 });
      }
    })
    .onFinalize(() => {
      if (translateX.value > 0 && translateX.value < DISMISS_THRESHOLD) {
        translateX.value = withSpring(0, { damping: 22, stiffness: 320 });
      }
    });

  const edgeStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? 0.35 : 0,
  }));

  const edgePosition = isRTL ? styles.edgeRight : styles.edgeLeft;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.edge, edgePosition, edgeStyle]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: EDGE_WIDTH,
    zIndex: 9998,
  },
  edgeRight: {
    right: 0,
  },
  edgeLeft: {
    left: 0,
  },
});
