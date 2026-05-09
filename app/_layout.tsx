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
      <View style={{ flex: 1, backgroundColor: '#F8FAFC' }} />
    );
  }

  return (
    <SafeAreaProvider>
      <ConfirmProvider>
        <View style={{ flex: 1, backgroundColor: Platform.OS === 'web' ? '#E8EDF2' : '#F8FAFC' }}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </ConfirmProvider>
    </SafeAreaProvider>
  );
}
