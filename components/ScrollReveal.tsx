/**
 * Fade + slide up when the element scrolls into view (web: IntersectionObserver).
 * On native, animates on mount as a fallback.
 */
import React, { useEffect, useRef } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

const SPRING = { damping: 22, stiffness: 260, mass: 0.8 };
const INDEX_DELAY_MS = 45;

function prefersReducedMotion(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getObserverTarget(ref: React.RefObject<View | null>): Element | null {
  const node = ref.current as unknown as {
    getNode?: () => Element;
    _nativeNode?: Element;
    nodeType?: number;
  } | null;
  if (!node) return null;
  if (node.nodeType === 1) return node as unknown as Element;
  if (typeof node.getNode === 'function') return node.getNode() ?? null;
  if (node._nativeNode) return node._nativeNode;
  return null;
}

export interface ScrollRevealProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Stagger delay when multiple items enter together */
  index?: number;
  /** Skip animation */
  disabled?: boolean;
}

export function ScrollReveal({
  children,
  style,
  index = 0,
  disabled = false,
}: ScrollRevealProps) {
  const hostRef = useRef<View>(null);
  const progress = useSharedValue(disabled ? 1 : 0);
  const translateY = useSharedValue(disabled ? 0 : 20);
  const revealed = useRef(false);

  const runReveal = () => {
    if (revealed.current) return;
    revealed.current = true;
    const delay = Math.min(index, 12) * INDEX_DELAY_MS;
    progress.value = withDelay(delay, withSpring(1, SPRING));
    translateY.value = withDelay(delay, withSpring(0, SPRING));
  };

  useEffect(() => {
    if (disabled || prefersReducedMotion()) {
      progress.value = 1;
      translateY.value = 0;
      revealed.current = true;
      return;
    }

    if (Platform.OS !== 'web') {
      runReveal();
      return;
    }

    const el = getObserverTarget(hostRef);
    if (!el) {
      runReveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          runReveal();
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -4% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View ref={hostRef} style={style} collapsable={false}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </View>
  );
}
