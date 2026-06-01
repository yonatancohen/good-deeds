import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, TriangleAlert } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Button, Colors, FormField, Card } from '@/components/ui';
import { useBreakpoint } from '@/lib/responsive';
import { shadow } from '@/lib/shadow';
import { HEBREW_ROW } from '@/lib/rtlLayout';

const AUTH_MAX_W = 440;

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

function BlobDecoration() {
  if (Platform.OS !== 'web') return null;
  return (
    <>
      <View style={[S.blob, S.blobTopRight]} />
      <View style={S.blobBottomLeft} />
    </>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  const { isDesktop } = useBreakpoint();

  return (
    <SafeAreaView style={S.screen}>
      <BlobDecoration />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={S.kvoid}
      >
        <ScrollView
          contentContainerStyle={[
            S.scrollContent,
            isDesktop && S.scrollContentDesktop,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[S.column, isDesktop && S.columnDesktop]}>
            <View style={S.logoWrap}>
              <View style={S.logoShadow}>
                <View style={S.logoBox}>
                  <Image
                    source={require('@/assets/icon.png')}
                    style={{ width: 88, height: 88 }}
                    resizeMode="cover"
                    accessibilityLabel="לוגו תפסתי אותך בטוב"
                  />
                </View>
              </View>
              <Text style={S.appName} accessibilityRole="header">
                תפסתי אותך בטוב
              </Text>
              <Text style={S.appSub}>הגדרת סיסמה לחשבון מורה</Text>
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordInput({
  value,
  onChangeText,
  focused,
  onFocus,
  onBlur,
  accessibilityLabel,
  onSubmitEditing,
}: {
  value: string;
  onChangeText: (v: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  accessibilityLabel: string;
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={[S.inputRow, focused && S.inputRowFocused]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
        textAlign="right"
        placeholder="••••••••"
        placeholderTextColor={Colors.outline}
        style={S.inputText}
        onFocus={onFocus}
        onBlur={onBlur}
        accessibilityLabel={accessibilityLabel}
        onSubmitEditing={onSubmitEditing}
        returnKeyType="go"
      />
      <View style={S.inputIcon} pointerEvents="none">
        <Lock size={18} color={focused ? Colors.primary : Colors.muted} />
      </View>
    </View>
  );
}

export default function SetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
      <AuthShell>
        <View style={S.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={S.loadingText}>מאמתים את הקישור…</Text>
        </View>
      </AuthShell>
    );
  }

  if (linkError && !sessionReady) {
    return (
      <AuthShell>
        <Card glass style={S.card}>
          <View style={S.cardBody}>
            <Text style={S.cardTitle}>קביעת סיסמה</Text>
            <View style={S.alertBox} accessibilityRole="alert">
              <View style={S.alertIcon}>
                <TriangleAlert size={22} color={Colors.danger} />
              </View>
              <Text style={S.alertText}>{linkError}</Text>
            </View>
            <Button label="חזרה לכניסה" onPress={() => router.replace('/auth/login')} />
          </View>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card glass style={S.card}>
        <View style={S.cardBody}>
          <View style={S.cardHeader}>
            <Text style={S.cardTitle}>קביעת סיסמה</Text>
            <Text style={S.cardSub}>בחרו סיסמה לחשבון המורה שלכם</Text>
          </View>

          <FormField label="סיסמה חדשה" hint="לפחות 6 תווים" required>
            <PasswordInput
              value={password}
              onChangeText={setPassword}
              focused={focusedField === 'password'}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              accessibilityLabel="סיסמה חדשה"
            />
          </FormField>

          <FormField label="אימות סיסמה" hint="הקלידו שוב את אותה סיסמה" required>
            <PasswordInput
              value={confirm}
              onChangeText={setConfirm}
              focused={focusedField === 'confirm'}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              accessibilityLabel="אימות סיסמה"
              onSubmitEditing={handleSave}
            />
          </FormField>

          <View style={S.submitWrap}>
            <Button label="שמור סיסמה" onPress={handleSave} loading={saving} />
          </View>
        </View>
      </Card>
    </AuthShell>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  kvoid: { flex: 1, width: '100%' },

  scrollContent: {
    flexGrow: 1,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    ...(Platform.OS === 'web' ? ({ alignItems: 'center' } as any) : {}),
  },
  scrollContentDesktop: {
    paddingTop: 64,
    paddingBottom: 64,
    justifyContent: 'center',
  },

  column: {
    width: '100%',
    maxWidth: AUTH_MAX_W,
    flexDirection: 'column',
    alignSelf: 'center',
  },
  columnDesktop: {
    paddingHorizontal: 8,
  },

  blob: {
    position: 'absolute',
    borderRadius: 999,
    pointerEvents: 'none',
  },
  blobTopRight: {
    width: 200,
    height: 200,
    top: -60,
    right: -60,
    ...(Platform.OS === 'web'
      ? ({ backgroundImage: 'radial-gradient(circle, rgba(255,193,7,0.18) 0%, transparent 70%)' } as any)
      : {}),
  },
  blobBottomLeft: {
    position: 'absolute',
    width: 240,
    height: 240,
    bottom: -80,
    left: -80,
    ...(Platform.OS === 'web'
      ? ({ backgroundImage: 'radial-gradient(circle, rgba(124,225,123,0.15) 0%, transparent 70%)' } as any)
      : {}),
  },

  logoWrap: { alignItems: 'center', marginBottom: 24 },
  logoShadow: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...shadow(Colors.primary, 10, 24, 0.5, 14),
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
  } as object,
  appSub: {
    color: Colors.muted,
    fontSize: 14,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 22,
  } as object,

  card: {
    width: '100%',
    alignSelf: 'stretch',
  },
  cardBody: {
    width: '100%',
    flexDirection: 'column',
    padding: 24,
  },
  cardHeader: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'Baloo2_700Bold',
    marginBottom: 8,
  } as object,
  cardSub: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  } as object,

  alertBox: {
    flexDirection: HEBREW_ROW,
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.dangerLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primaryDark,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  } as object,

  loadingWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.muted,
    writingDirection: 'rtl',
  } as object,

  inputRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#f4ece7',
    borderWidth: 2,
    borderColor: '#e9e1db',
    borderRadius: 999,
    paddingLeft: 18,
    paddingRight: 46,
    minHeight: 54,
  },
  inputRowFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#fffbf0',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 0 4px rgba(255,193,7,0.2)' } as any)
      : {}),
  },
  inputText: {
    flex: 1,
    width: '100%',
    color: Colors.text,
    fontSize: 16,
    paddingVertical: 14,
    textAlign: 'right',
    writingDirection: 'rtl',
    ...(Platform.OS === 'web' ? ({ outlineWidth: 0, outlineStyle: 'none' } as any) : {}),
  } as object,
  inputIcon: {
    position: 'absolute',
    right: 18,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  submitWrap: {
    width: '100%',
    marginTop: 8,
  },
});
