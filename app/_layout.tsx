import '../global.css';
import 'react-native-reanimated';
import '@/lib/rtl';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { AppSplash, SPLASH_BG } from '@/components/AppSplash';
import { SwipeBackGesture } from '@/components/SwipeBackGesture';
import { useBreakpoint } from '@/lib/responsive';
import { useFonts, Baloo2_700Bold, Baloo2_600SemiBold, Baloo2_400Regular } from '@expo-google-fonts/baloo-2';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { injectWebCSS } from '@/lib/injectWebCSS';
import '@/lib/i18n';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import { AuthProvider } from '@/contexts/AuthContext';

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Inject Tailwind CSS on web (bypasses Metro's unreliable CSS transform in SDK 55)
  useEffect(() => {
    injectWebCSS();
  }, []);

  const { width } = useBreakpoint();
  const [splashHidden, setSplashHidden] = useState(false);

  const [fontsLoaded] = useFonts({
    Baloo2_700Bold,
    Baloo2_600SemiBold,
    Baloo2_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // On web, width can be 0 on first paint — treat as mobile so we don't flash app UI before splash.
  const usesSplash = Platform.OS !== 'web' || width < 768;
  const showSplash = usesSplash && !splashHidden;
  const showAppContent = fontsLoaded && (!usesSplash || splashHidden);

  // Hand off to branded AppSplash as soon as it mounts (don't wait for fonts).
  useEffect(() => {
    if (showSplash) {
      ExpoSplashScreen.hideAsync().catch(() => {});
      return;
    }
    if (fontsLoaded) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [showSplash, fontsLoaded]);

  const appBg = Platform.OS === 'web' ? '#f0e8df' : '#fff8f2';

  return (
    <GestureHandlerRootView
      style={[
        styles.root,
        { backgroundColor: showSplash ? SPLASH_BG : appBg },
        Platform.OS === 'web' && styles.rootWeb,
      ]}
    >
      {showAppContent ? (
        <SafeAreaProvider>
          <AuthProvider>
            <ConfirmProvider>
              <View style={[styles.appRoot, { backgroundColor: appBg }]}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    animationDuration: 280,
                    gestureEnabled: true,
                    fullScreenGestureEnabled: Platform.OS === 'ios',
                  }}
                />
                <SwipeBackGesture />
              </View>
            </ConfirmProvider>
          </AuthProvider>
        </SafeAreaProvider>
      ) : (
        <View style={styles.bootPlaceholder} />
      )}
      {showSplash && (
        <AppSplash
          ready={fontsLoaded}
          onHidden={() => setSplashHidden(true)}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootWeb: { width: '100%', maxWidth: '100%', alignSelf: 'stretch' } as object,
  appRoot: {
    flex: 1,
    width: '100%',
    ...(Platform.OS === 'web'
      ? ({ direction: 'rtl', minWidth: '100%', alignSelf: 'stretch' } as object)
      : {}),
  },
  bootPlaceholder: { flex: 1, backgroundColor: SPLASH_BG },
});
