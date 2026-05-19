import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';
import '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button, Colors, FormField, Card } from '@/components/ui';
import { useBreakpoint } from '@/lib/responsive';
import { shadow } from '@/lib/shadow';

type Tab = 'password' | 'magic';

// ── Background blob (web: CSS radial gradient; native: tinted circle) ─────────
function BlobDecoration() {
  if (Platform.OS !== 'web') return null;
  return (
    <>
      <View style={[S.blob, S.blobTopRight]} />
      <View style={[S.blob, S.blobBottomLeft]} />
    </>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  kvoid:  { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 48 },

  // ── Background blobs (web only) ─────────────────────────────────────────
  blob: {
    position: 'absolute',
    borderRadius: 999,
    ...(Platform.OS === 'web'
      ? undefined
      : { display: 'none' as any }),
  },
  blobTopRight: {
    width: 200, height: 200,
    top: -60, right: -60,
    ...(Platform.OS === 'web'
      ? ({
          background: 'radial-gradient(circle, rgba(255,193,7,0.18) 0%, transparent 70%)',
        } as any)
      : {}),
  },
  blobBottomLeft: {
    width: 240, height: 240,
    bottom: -80, left: -80,
    ...(Platform.OS === 'web'
      ? ({
          background: 'radial-gradient(circle, rgba(124,225,123,0.15) 0%, transparent 70%)',
        } as any)
      : {}),
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoShadow: {
    width: 106, height: 106,
    borderRadius: 53,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
    ...shadow(Colors.primary, 10, 24, 0.5, 14),
  },
  logoBox: {
    width: 100, height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  appName: {
    fontSize: 28, fontWeight: '700', color: Colors.primaryDark,
    marginBottom: 6, textAlign: 'center',
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  appSub: {
    color: Colors.muted, fontSize: 14, textAlign: 'center',
    writingDirection: 'rtl',
  } as any,

  // ── Tab switcher ──────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#f5ede2',
    borderRadius: 999, padding: 4, marginBottom: 24,
  },
  tab: {
    flex: 1, paddingVertical: 12, borderRadius: 999,
    alignItems: 'center', flexDirection: 'row-reverse',
    justifyContent: 'center', minHeight: 44,
  },
  tabActive: {
    backgroundColor: '#fff',
    ...shadow('#785900', 1, 4, 0.1, 2),
  },
  tabText: {
    fontSize: 14, fontWeight: '600', fontFamily: 'Baloo2_700Bold',
  } as any,
  tabTextActive:   { color: Colors.primaryDark },
  tabTextInactive: { color: Colors.muted },

  // ── Pill input row ────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: '#f4ece7',     // surface-container warm
    borderWidth: 2, borderColor: '#e9e1db',
    borderRadius: 999,              // pill
    paddingHorizontal: 18, minHeight: 54,
  },
  inputRowFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#fffbf0',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 0 4px rgba(255,193,7,0.2)' } as any)
      : {}),
  },
  inputText: {
    flex: 1, color: Colors.text, fontSize: 16, paddingVertical: 14,
    ...(Platform.OS === 'web' ? { outlineWidth: 0, outlineStyle: 'none' } as any : {}),
  } as any,

  // ── Forgot / link ─────────────────────────────────────────────────────────
  forgotBtn: { alignItems: 'center', marginTop: 16, minHeight: 44, justifyContent: 'center' },
  forgotText: {
    color: Colors.primaryDark, fontSize: 14, fontWeight: '600',
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,

  // ── Back to public ────────────────────────────────────────────────────────
  backToPublic: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 24, minHeight: 44,
  },
  backToPublicText: {
    color: Colors.muted, fontSize: 14,
    writingDirection: 'rtl',
  } as any,

  // ── Magic-link sent ───────────────────────────────────────────────────────
  magicSentWrap:  { alignItems: 'center', paddingVertical: 32 },
  mailIcon: {
    width: 64, height: 64, backgroundColor: Colors.primaryLight,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  magicSentTitle: {
    color: Colors.primaryDark, fontWeight: '700', fontSize: 20,
    textAlign: 'center', marginBottom: 8,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  magicSentDesc: {
    color: Colors.muted, fontSize: 14, textAlign: 'center',
    lineHeight: 24, writingDirection: 'rtl',
  } as any,
  magicSentEmail: { fontWeight: '600', color: Colors.text },
  resendBtn:  { marginTop: 24, minHeight: 44, justifyContent: 'center' },
  resendText: {
    color: Colors.primaryDark, fontSize: 14, fontWeight: '600',
    fontFamily: 'Baloo2_700Bold',
  } as any,
});

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const { isDesktop } = useBreakpoint();

  const [tab, setTab]               = useState<Tab>('password');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent]   = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (session && user) {
      router.replace(user.role === 'admin' ? '/admin' : '/teacher');
    }
  }, [session, user, authLoading, router]);

  async function handlePasswordLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('שגיאה', 'יש להזין אימייל וסיסמה');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert(
        'שגיאת כניסה',
        error.message === 'Invalid login credentials' ? 'אימייל או סיסמה שגויים' : error.message,
      );
    }
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      Alert.alert('שגיאה', 'יש להזין כתובת אימייל');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('שגיאה', error.message);
    } else {
      setMagicSent(true);
    }
  }

  if (authLoading) return <SafeAreaView style={S.screen} />;

  return (
    <SafeAreaView style={S.screen}>
      {/* Decorative background blobs */}
      <BlobDecoration />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={S.kvoid}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[
            S.content,
            isDesktop && { alignSelf: 'center', width: '100%', maxWidth: 440, paddingHorizontal: 32, paddingTop: 80 },
          ]}>

            {/* ── Logo ── */}
            <View style={S.logoWrap}>
              <View style={S.logoShadow}>
                <View style={S.logoBox}>
                  <Image
                    source={require('@/assets/icon.png')}
                    style={{ width: 100, height: 100 }}
                    resizeMode="cover"
                    accessibilityLabel="לוגו תפסתי אותך בטוב"
                  />
                </View>
              </View>
              <Text style={S.appName} accessibilityRole="header">
                תפסתי אותך בטוב
              </Text>
              <Text style={S.appSub}>כניסה לצוות בית הספר</Text>
            </View>

            {/* ── Tab switcher ── */}
            <View style={S.tabRow}>
              {(['password', 'magic'] as Tab[]).map((tabId) => {
                const active = tab === tabId;
                return (
                  <TouchableOpacity
                    key={tabId}
                    onPress={() => { setTab(tabId); setMagicSent(false); }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={tabId === 'password' ? 'כניסה עם סיסמה' : 'כניסה עם קישור לאימייל'}
                    style={[S.tab, active && S.tabActive, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                  >
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                      {tabId === 'password'
                        ? <Lock size={14} color={active ? Colors.primaryDark : Colors.muted} />
                        : <Mail size={14} color={active ? Colors.primaryDark : Colors.muted} />
                      }
                      <Text style={[S.tabText, active ? S.tabTextActive : S.tabTextInactive]}>
                        {tabId === 'password' ? 'סיסמה' : 'קישור לאימייל'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── Login card (glass on web) ── */}
            <Card glass style={{ padding: 24 }}>

              {/* Password tab */}
              {tab === 'password' && (
                <View>
                  <FormField label={t('email')} hint="כתובת האימייל שרשומה בבית הספר" required>
                    <View style={[S.inputRow, focusedField === 'email-pw' && S.inputRowFocused]}>
                      <Mail size={18} color={focusedField === 'email-pw' ? Colors.primary : Colors.muted} style={{ marginLeft: 10 }} />
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="teacher@school.com"
                        placeholderTextColor={Colors.outline}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textAlign="right"
                        style={S.inputText}
                        onFocus={() => setFocusedField('email-pw')}
                        onBlur={() => setFocusedField(null)}
                        accessibilityLabel="שדה כתובת אימייל"
                      />
                    </View>
                  </FormField>

                  <FormField label={t('password')} hint="הסיסמה שקיבלת מהמנהל בעת ההצטרפות" required>
                    <View style={[S.inputRow, focusedField === 'password' && S.inputRowFocused]}>
                      <Lock size={18} color={focusedField === 'password' ? Colors.primary : Colors.muted} style={{ marginLeft: 10 }} />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor={Colors.outline}
                        secureTextEntry
                        textAlign="right"
                        style={S.inputText}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        accessibilityLabel="שדה סיסמה"
                        onSubmitEditing={handlePasswordLogin}
                        returnKeyType="go"
                      />
                    </View>
                  </FormField>

                  <Button label={t('login')} onPress={handlePasswordLogin} loading={submitting} />

                  <TouchableOpacity
                    onPress={() => setTab('magic')}
                    accessibilityRole="link"
                    accessibilityLabel="שלח לי קישור כניסה לאימייל"
                    style={[S.forgotBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                  >
                    <Text style={S.forgotText}>{t('forgotPassword')}? שלח לי קישור לאימייל</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Magic link tab */}
              {tab === 'magic' && (
                <View>
                  {magicSent ? (
                    <View style={S.magicSentWrap}>
                      <View style={S.mailIcon}>
                        <Mail size={28} color={Colors.primary} />
                      </View>
                      <Text style={S.magicSentTitle}>הקישור נשלח!</Text>
                      <Text style={S.magicSentDesc}>
                        בדוק את תיבת הדואר שלך{'\n'}
                        <Text style={S.magicSentEmail}>{email}</Text>
                      </Text>
                      <TouchableOpacity
                        onPress={() => setMagicSent(false)}
                        style={[S.resendBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                        accessibilityRole="button"
                        accessibilityLabel="שלח קישור מחדש"
                      >
                        <Text style={S.resendText}>שלח שוב</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <FormField
                        label={t('email')}
                        hint="נשלח אליך קישור כניסה חד-פעמי — ללא צורך בסיסמה"
                        required
                      >
                        <View style={[S.inputRow, focusedField === 'email-magic' && S.inputRowFocused]}>
                          <Mail size={18} color={focusedField === 'email-magic' ? Colors.primary : Colors.muted} style={{ marginLeft: 10 }} />
                          <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="teacher@school.com"
                            placeholderTextColor={Colors.outline}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            textAlign="right"
                            style={S.inputText}
                            onFocus={() => setFocusedField('email-magic')}
                            onBlur={() => setFocusedField(null)}
                            accessibilityLabel="שדה כתובת אימייל לקישור כניסה"
                            onSubmitEditing={handleMagicLink}
                            returnKeyType="send"
                          />
                        </View>
                      </FormField>
                      <Button label={t('sendMagicLink')} onPress={handleMagicLink} loading={submitting} />
                    </View>
                  )}
                </View>
              )}
            </Card>

            {/* ── Back to public page ── */}
            <TouchableOpacity
              onPress={() => router.replace('/')}
              style={[S.backToPublic, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
              accessibilityRole="link"
              accessibilityLabel="חזרה לדף הציבורי"
            >
              <ArrowRight size={15} color={Colors.muted} />
              <Text style={S.backToPublicText}>חזרה לדף ההצלחות</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
