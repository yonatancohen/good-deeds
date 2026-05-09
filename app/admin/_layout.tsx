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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#4F46E5" accessibilityLabel="טוען" />
      </View>
    );
  }

  if (!session || !user || !isAdmin) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    />
  );
}
