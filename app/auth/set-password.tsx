import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button, Colors, FormField, Card } from '@/components/ui';

function parseTokensFromUrl(): {
  access_token?: string;
  refresh_token?: string;
} | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  const hash = window.location.hash?.replace(/^#/, '');
  if (hash) {
    const p = new URLSearchParams(hash);
    const access_token = p.get('access_token') ?? undefined;
    const refresh_token = p.get('refresh_token') ?? undefined;
    if (access_token && refresh_token) return { access_token, refresh_token };
  }

  const q = new URLSearchParams(window.location.search);
  const access_token = q.get('access_token') ?? undefined;
  const refresh_token = q.get('refresh_token') ?? undefined;
  if (access_token && refresh_token) return { access_token, refresh_token };
  return null;
}

export default function SetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const tokens = parseTokensFromUrl();
      if (tokens?.access_token && tokens?.refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });
        if (cancelled) return;
        if (error) {
          setLinkError('הקישור לא תקין או שפג תוקפו. בקשו מייל חדש מהמנהל או מ"שכחתי סיסמה".');
        } else {
          setSessionReady(true);
          if (Platform.OS === 'web') {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
        setBooting(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setSessionReady(true);
      } else {
        setLinkError('פתחו את הקישור מהמייל, או בקשו מייל חדש ממנהל המערכת.');
      }
      setBooting(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (password.length < 6) {
      Alert.alert('שגיאה', 'הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (password !== confirm) {
      Alert.alert('שגיאה', 'הסיסמאות לא תואמות');
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) {
      Alert.alert('שגיאה', error.message);
      return;
    }

    Alert.alert('✅', 'הסיסמה נשמרה בהצלחה', [
      { text: 'המשך לכניסה', onPress: () => router.replace('/auth/login') },
    ]);
  }

  if (booting) {
    return (
      <SafeAreaView style={S.screen}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (linkError && !sessionReady) {
    return (
      <SafeAreaView style={S.screen}>
        <View style={S.wrap}>
          <Card>
            <Text style={S.title}>קביעת סיסמה</Text>
            <Text style={S.errorText}>{linkError}</Text>
            <Button label="חזרה לכניסה" onPress={() => router.replace('/auth/login')} />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.screen}>
      <View style={S.wrap}>
        <Card>
          <Text style={S.title}>קביעת סיסמה</Text>
          <Text style={S.sub}>בחרו סיסמה לחשבון המורה שלכם</Text>

          <FormField label="סיסמה חדשה" required>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textAlign="right"
              placeholder="לפחות 6 תווים"
              placeholderTextColor={Colors.outline}
              style={S.input}
              accessibilityLabel="סיסמה חדשה"
            />
          </FormField>

          <FormField label="אימות סיסמה" required>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              textAlign="right"
              placeholder="הקלידו שוב"
              placeholderTextColor={Colors.outline}
              style={S.input}
              accessibilityLabel="אימות סיסמה"
            />
          </FormField>

          <Button label="שמור סיסמה" onPress={handleSave} loading={saving} />
        </Card>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  wrap: { flex: 1, padding: 24, justifyContent: 'center' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 8,
  } as object,
  sub: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 20,
  } as object,
  errorText: {
    fontSize: 15,
    color: Colors.danger,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: 20,
    lineHeight: 22,
  } as object,
  input: {
    borderWidth: 1,
    borderColor: Colors.outline,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: '#fff',
  },
});
