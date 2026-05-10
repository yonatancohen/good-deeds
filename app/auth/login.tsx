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


const S = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.bg },
  kvoid:    { flex: 1 },
  content:  { paddingHorizontal: 24, paddingTop: 72, paddingBottom: 48 },

  // ── Logo ──
  logoWrap: { alignItems: 'center', marginBottom: 36 },
  logoShadow: {
    width: 106, height: 106,
    borderRadius: 53,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18,
    ...shadow(Colors.primary, 10, 20, 0.45, 14),
  },
  logoBox: {
    width: 100, height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  appName: {
    fontSize: 28, fontWeight: '700', color: Colors.text,
    marginBottom: 4, textAlign: 'center',
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  appSub: {
    color: '#94a3b8', fontSize: 14, textAlign: 'center',
    fontFamily: 'Nunito_400Regular', writingDirection: 'rtl',
  } as any,

  // ── Tab switcher ──
  tabRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#f1f5f9',
    borderRadius: 16, padding: 4, marginBottom: 24,
  },
  tab: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', flexDirection: 'row-reverse',
    justifyContent: 'center', minHeight: 44,
  },
  tabActive: {
    backgroundColor: '#fff',
    ...shadow('#000', 1, 3, 0.08, 2),
  },
  tabText: { fontSize: 14, fontWeight: '600', fontFamily: 'Nunito_600SemiBold' } as any,
  tabTextActive:   { color: '#4338ca' },
  tabTextInactive: { color: '#64748b' },

  // ── Input row ──
  inputRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, minHeight: 52,
  },
  inputRowFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#faf9ff',
  },
  inputText: {
    flex: 1, color: Colors.text, fontSize: 16, paddingVertical: 14,
    fontFamily: 'Nunito_400Regular',
    ...(Platform.OS === 'web' ? { outlineWidth: 0, outlineStyle: 'none' } as any : {}),
  } as any,

  // ── Forgot / link button ──
  forgotBtn: { alignItems: 'center', marginTop: 16, minHeight: 44, justifyContent: 'center' },
  forgotText: {
    color: '#6366f1', fontSize: 14, fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold', writingDirection: 'rtl',
  } as any,

  // ── Back to public ──
  backToPublic: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 24, minHeight: 44,
  },
  backToPublicText: {
    color: '#94a3b8', fontSize: 14,
    fontFamily: 'Nunito_400Regular', writingDirection: 'rtl',
  } as any,

  // ── Magic-sent confirmation ──
  magicSentWrap: { alignItems: 'center', paddingVertical: 32 },
  mailIcon: {
    width: 64, height: 64, backgroundColor: Colors.primaryLight,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  magicSentTitle: {
    color: Colors.text, fontWeight: '700', fontSize: 20,
    textAlign: 'center', marginBottom: 8,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  magicSentDesc: {
    color: '#64748b', fontSize: 14, textAlign: 'center',
    lineHeight: 24, fontFamily: 'Nunito_400Regular', writingDirection: 'rtl',
  } as any,
  magicSentEmail: { fontWeight: '600', color: '#334155' },
  resendBtn: { marginTop: 24, minHeight: 44, justifyContent: 'center' },
  resendText: {
    color: '#6366f1', fontSize: 14, fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  } as any,
});

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { session, user, loading: authLoading } = useAuth();
  const { isDesktop } = useBreakpoint();

  const [tab, setTab]             = useState<Tab>('password');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Redirect once authenticated
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

  if (authLoading) {
    return <SafeAreaView style={S.screen} />;
  }

  return (
    <SafeAreaView style={[S.screen, isDesktop && { backgroundColor: 'transparent' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={S.kvoid}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[S.content, isDesktop && { alignSelf: 'center', width: '100%', maxWidth: 440, paddingHorizontal: 32, paddingTop: 80 }]}>

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
              <Text style={S.appSub}>
                כניסה לצוות בית הספר
              </Text>
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
                        ? <Lock size={14} color={active ? Colors.primary : Colors.muted} />
                        : <Mail size={14} color={active ? Colors.primary : Colors.muted} />
                      }
                      <Text style={[S.tabText, active ? S.tabTextActive : S.tabTextInactive]}>
                        {tabId === 'password' ? 'סיסמה' : 'קישור לאימייל'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Card style={{ padding: 20 }}>

              {/* ── Password tab ── */}
              {tab === 'password' && (
                <View>
                  <FormField label={t('email')} hint="כתובת האימייל שרשומה בבית הספר" required>
                    <View style={[S.inputRow, focusedField === 'email-pw' && S.inputRowFocused]}>
                      <Mail size={18} color={focusedField === 'email-pw' ? Colors.primary : Colors.muted} style={{ marginLeft: 8 }} />
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="teacher@school.com"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        textAlign="right"
                        style={S.inputText}
                        onFocus={() => setFocusedField('email-pw')}
                        onBlur={() => setFocusedField(null)}
                        accessibilityLabel="שדה כתובת אימייל"
                        accessibilityHint="הזן את כתובת האימייל שלך"
                      />
                    </View>
                  </FormField>

                  <FormField label={t('password')} hint="הסיסמה שקיבלת מהמנהל בעת ההצטרפות" required>
                    <View style={[S.inputRow, focusedField === 'password' && S.inputRowFocused]}>
                      <Lock size={18} color={focusedField === 'password' ? Colors.primary : Colors.muted} style={{ marginLeft: 8 }} />
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry
                        textAlign="right"
                        style={S.inputText}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        accessibilityLabel="שדה סיסמה"
                        accessibilityHint="הזן את הסיסמה שלך"
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
                    <Text style={S.forgotText}>
                      {t('forgotPassword')}? שלח לי קישור לאימייל
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Magic link tab ── */}
              {tab === 'magic' && (
                <View>
                  {magicSent ? (
                    <View style={S.magicSentWrap}>
                      <View style={S.mailIcon}>
                        <Mail size={28} color={Colors.primary} />
                      </View>
                      <Text style={S.magicSentTitle}>
                        הקישור נשלח!
                      </Text>
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
                          <Mail size={18} color={focusedField === 'email-magic' ? Colors.primary : Colors.muted} style={{ marginLeft: 8 }} />
                          <TextInput
                            value={email}
                            onChangeText={setEmail}
                            placeholder="teacher@school.com"
                            placeholderTextColor="#94a3b8"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            textAlign="right"
                            style={S.inputText}
                            onFocus={() => setFocusedField('email-magic')}
                            onBlur={() => setFocusedField(null)}
                            accessibilityLabel="שדה כתובת אימייל לקישור כניסה"
                            accessibilityHint="הזן את האימייל שלך ונשלח לך קישור לכניסה"
                            onSubmitEditing={handleMagicLink}
                            returnKeyType="send"
                          />
                        </View>
                      </FormField>

                      <Button
                        label={t('sendMagicLink')}
                        onPress={handleMagicLink}
                        loading={submitting}
                      />
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
              <ArrowRight size={15} color="#94a3b8" />
              <Text style={S.backToPublicText}>חזרה לדף ההצלחות</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
