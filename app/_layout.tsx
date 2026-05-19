import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { I18nManager, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Baloo2_700Bold, Baloo2_600SemiBold, Baloo2_400Regular } from '@expo-google-fonts/baloo-2';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { injectWebCSS } from '@/lib/injectWebCSS';
import '@/lib/i18n';
import { ConfirmProvider } from '@/components/ConfirmDialog';
import { AuthProvider } from '@/contexts/AuthContext';

// Force RTL for Hebrew
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  // Inject Tailwind CSS on web (bypasses Metro's unreliable CSS transform in SDK 55)
  useEffect(() => {
    injectWebCSS();
  }, []);

  const [fontsLoaded] = useFonts({
    Baloo2_700Bold,
    Baloo2_600SemiBold,
    Baloo2_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // Block render until fonts ready (avoids FOUT)
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff8f2' }} />
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ConfirmProvider>
          <View style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? '#f0e8df' : '#fff8f2' }}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
        </ConfirmProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
