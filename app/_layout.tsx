import '../global.css';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { I18nManager, Platform, StyleSheet, View } from 'react-native';
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

// Force RTL for Hebrew
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Inject Tailwind CSS on web (bypasses Metro's unreliable CSS transform in SDK 55)
  useEffect(() => {
    injectWebCSS();
  }, []);

  const { isMobile } = useBreakpoint();
  const [splashHidden, setSplashHidden] = useState(false);
  const showSplash = !splashHidden && (Platform.OS !== 'web' || isMobile);

  const [fontsLoaded] = useFonts({
    Baloo2_700Bold,
    Baloo2_600SemiBold,
    Baloo2_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded && (!showSplash || splashHidden)) {
      ExpoSplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, showSplash, splashHidden]);

  const appBg = Platform.OS === 'web' ? '#f0e8df' : '#fff8f2';

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: showSplash ? SPLASH_BG : appBg }]}>
      {fontsLoaded ? (
        <SafeAreaProvider>
          <AuthProvider>
            <ConfirmProvider>
              <View style={{ flex: 1, backgroundColor: appBg }}>
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
  bootPlaceholder: { flex: 1, backgroundColor: SPLASH_BG },
});
