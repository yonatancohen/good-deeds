import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityIndicator, Platform, View } from 'react-native';

export default function TeacherLayout() {
  const { session, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session || !user) {
      router.replace('/auth/login');
    }
  }, [session, user, loading, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff8f2' }}>
        <ActivityIndicator size="large" color="#ffc107" accessibilityLabel="טוען" />
      </View>
    );
  }

  if (!session || !user) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff8f2' },
        animation: 'slide_from_right',
        animationDuration: 280,
        gestureEnabled: true,
        fullScreenGestureEnabled: Platform.OS === 'ios',
      }}
    />
  );
}
