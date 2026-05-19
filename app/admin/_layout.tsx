import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';

export default function AdminLayout() {
  const { session, user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!session || !user) {
      router.replace('/auth/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/teacher');
    }
  }, [session, user, loading, isAdmin, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff8f2' }}>
        <ActivityIndicator size="large" color="#ffc107" accessibilityLabel="טוען" />
      </View>
    );
  }

  if (!session || !user || !isAdmin) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff8f2' },
      }}
    />
  );
}
