/**
 * Branded splash overlay — fade in on load, fade out when the app is ready.
 * Uses assets/splash-icon.webp (lavender portrait artwork).
 */
import { useEffect, useRef } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export const SPLASH_BG = '#ecdbfb';

const FADE_IN_MS = 450;
const FADE_OUT_MS = 550;
const MIN_VISIBLE_MS = 1000;

interface AppSplashProps {
  /** App finished bootstrapping (e.g. fonts loaded) */
  ready: boolean;
  onHidden: () => void;
}

export function AppSplash({ ready, onHidden }: AppSplashProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.94);
  const mountedAt = useRef(Date.now());
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onHidden();
  };

  useEffect(() => {
    opacity.value = withTiming(1, { duration: FADE_IN_MS });
    scale.value = withTiming(1, { duration: FADE_IN_MS });
  }, []);

  useEffect(() => {
    if (!ready) return;

    const elapsed = Date.now() - mountedAt.current;
    const hold = Math.max(0, MIN_VISIBLE_MS - elapsed);

    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: FADE_OUT_MS }, (done) => {
        if (done) runOnJS(finish)();
      });
      scale.value = withTiming(1.02, { duration: FADE_OUT_MS });
    }, hold);

    return () => clearTimeout(timer);
  }, [ready]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.overlay, animatedStyle]}
      pointerEvents={ready ? 'none' : 'auto'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.content}>
        <Image
          source={require('@/assets/splash-icon.webp')}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel="תפסתי אותך בטוב"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SPLASH_BG,
    zIndex: 10000,
    elevation: 10000,
    ...(Platform.OS === 'web'
      ? ({ position: 'fixed' as const, inset: 0 } as object)
      : {}),
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  image: {
    width: '100%',
    height: '100%',
    maxWidth: 420,
    maxHeight: '88%',
  },
});
