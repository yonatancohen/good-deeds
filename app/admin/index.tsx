import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Platform, StyleSheet, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Building2, UserCheck, BookOpen, Gift, Trophy,
  Settings, Globe, LogOut, Users, ChevronLeft,
} from 'lucide-react-native';
import '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/components/ui';
import { useBreakpoint } from '@/lib/responsive';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'בוקר טוב';
  if (h < 17) return 'צהריים טובים';
  return 'ערב טוב';
}

interface MenuTile {
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  description: string;
  route: string;
  tileBg: string;
}

const MENU: MenuTile[] = [
  { Icon: Building2, label: 'כיתות',       description: 'הוספה, עריכה ומחיקה של כיתות',              route: '/admin/classes',     tileBg: '#4F46E5' },
  { Icon: UserCheck, label: 'מורים',        description: 'ניהול מורים והזמנת מורים חדשים',            route: '/admin/teachers',    tileBg: '#7C3AED' },
  { Icon: BookOpen,  label: 'מעשים טובים', description: 'ניהול רשימת המעשים הטובים ושוויהם',         route: '/admin/deeds',       tileBg: '#D97706' },
  { Icon: Gift,      label: 'פרסים',        description: 'ניהול רשימת הפרסים שכיתה יכולה לזכות בהם',  route: '/admin/gifts',       tileBg: '#059669' },
  { Icon: Trophy,    label: 'מתנות',        description: 'רישום מתנה לכיתה שהגיעה למטרה',              route: '/admin/redemptions', tileBg: '#EA580C' },
  { Icon: Settings,  label: 'הגדרות',       description: 'שם בית הספר, שנת לימודים ומטרת נקודות',     route: '/admin/settings',    tileBg: '#475569' },
];

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};

export default function AdminHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings, refresh } = useSettings();
  const { isDesktop } = useBreakpoint();

  const cols = isDesktop ? 3 : 2;

  useFocusEffect(useCallback(() => { refresh(); }, []));

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  }

  const rows = Array.from(
    { length: Math.ceil(MENU.length / cols) },
    (_, i) => MENU.slice(i * cols, i * cols + cols),
  );

  return (
    <SafeAreaView style={S.screen}>

      {/* ── Header ── */}
      <View style={S.headerBar}>
        <View style={[S.headerInner, isDesktop && S.headerInnerDesktop]}>
          <View>
            <Text style={S.headerTitle} accessibilityRole="header">
              {settings?.school_name ?? 'תפסתי אותך בטוב'}
            </Text>
            {settings?.current_year && (
              <Text style={S.headerSub}>שנת לימודים {settings.current_year}</Text>
            )}
          </View>
          <View style={S.headerBtns}>
            <TouchableOpacity
              onPress={() => router.push('/teacher')}
              style={[S.headerBtn, pointer]}
              accessibilityRole="button"
              accessibilityLabel="עבור לתצוגת מורה"
            >
              <Users size={15} color={Colors.muted} />
              <Text style={S.headerBtnText}>תצוגת מורה</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={[S.headerBtnIcon, pointer]}
              accessibilityRole="button"
              accessibilityLabel="התנתק"
            >
              <LogOut size={18} color={Colors.muted} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={isDesktop ? S.bodyDesktop : S.bodyMobile}
      >
        <View style={isDesktop ? S.contentDesktop : undefined}>

          {/* Welcome */}
          <View style={S.welcome}>
            <View style={S.welcomeText}>
              <Text style={S.welcomeGreeting}>{getGreeting()}</Text>
              <Text style={[S.welcomeTitle, isDesktop && { fontSize: 28 }]}>
                {user?.display_name ?? 'מנהל'}
              </Text>
            </View>
            <Image
              source={require('@/assets/ponpon.png')}
              style={S.avatar}
              accessibilityLabel="תמונת פרופיל"
            />
          </View>

          {/* Grid */}
          <View style={S.grid}>
            {rows.map((row, i) => (
              <View key={i} style={S.gridRow}>
                {row.map((tile) => {
                  const { Icon } = tile;
                  return (
                    <TouchableOpacity
                      key={tile.route}
                      onPress={() => router.push(tile.route as any)}
                      style={[S.tile, { backgroundColor: tile.tileBg }, isDesktop && S.tileDesktop, pointer]}
                      accessibilityRole="button"
                      accessibilityLabel={`${tile.label} — ${tile.description}`}
                    >
                      <View style={S.tileDecor} />
                      <View style={S.tileIcon}>
                        <Icon size={28} color="rgba(255,255,255,0.88)" />
                      </View>
                      <Text style={[S.tileTitle, isDesktop && { fontSize: 18 }]}>{tile.label}</Text>
                      <Text style={[S.tileDesc,  isDesktop && { fontSize: 12 }]}>{tile.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Public link */}
          <TouchableOpacity
            onPress={() => router.push('/')}
            style={[S.publicLink, pointer]}
            accessibilityRole="link"
            accessibilityLabel="צפה בדף הציבורי"
          >
            <View style={S.publicIcon}>
              <Globe size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.publicTitle}>צפה בדף הציבורי</Text>
              <Text style={S.publicSub}>כך רואים ההורים והתלמידים את לוח ההצלחות</Text>
            </View>
            <ChevronLeft size={18} color={Colors.muted} />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  // Header
  headerBar: {
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  headerInner: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  headerInnerDesktop: {
    maxWidth: 960, alignSelf: 'center', width: '100%',
  } as any,
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: Colors.text,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  headerSub: { color: '#94a3b8', fontSize: 14, writingDirection: 'rtl' } as any,
  headerBtns: { flexDirection: 'row-reverse', gap: 8 },
  headerBtn: {
    backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 12,
    height: 44, flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
  },
  headerBtnText: { color: Colors.muted, fontSize: 14, fontWeight: '500' } as any,
  headerBtnIcon: {
    backgroundColor: '#f1f5f9', borderRadius: 12,
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },

  // Body
  bodyMobile:  { padding: 16 },
  bodyDesktop: { padding: 32, paddingTop: 24 },
  contentDesktop: { maxWidth: 960, alignSelf: 'center', width: '100%' } as any,

  // Welcome
  welcome: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, paddingHorizontal: 4, paddingTop: 8, paddingBottom: 20 },
  welcomeText: { flex: 1, alignItems: 'flex-end' },
  welcomeGreeting: { color: '#94a3b8', fontSize: 13, textAlign: 'right', writingDirection: 'rtl', marginBottom: 2 } as any,
  welcomeTitle: {
    fontSize: 22, fontWeight: '700', color: Colors.text,
    textAlign: 'right', fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#000' },

  // Grid
  grid:    { gap: 14 },
  gridRow: { flexDirection: 'row-reverse', gap: 14 },
  tile: {
    flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 14,
    minHeight: 148, overflow: 'hidden', justifyContent: 'flex-end',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 8, elevation: 6,
  },
  tileDesktop: { minHeight: 160 },
  tileDecor: {
    position: 'absolute', right: -22, top: -22,
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tileIcon:  { position: 'absolute', top: 14, right: 14 },
  tileTitle: {
    fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 3,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl', textAlign: 'right',
  } as any,
  tileDesc: {
    color: 'rgba(255,255,255,0.70)', fontSize: 11, lineHeight: 15,
    writingDirection: 'rtl', textAlign: 'right',
  } as any,

  // Public link
  publicLink: {
    marginTop: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20, paddingHorizontal: 16, flexDirection: 'row-reverse',
    alignItems: 'center', minHeight: 64,
  },
  publicIcon: {
    width: 40, height: 40, backgroundColor: Colors.primaryLight,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 12,
  },
  publicTitle: {
    color: '#1e293b', fontWeight: '600', fontSize: 14, textAlign: 'right',
    fontFamily: 'Nunito_600SemiBold', writingDirection: 'rtl',
  } as any,
  publicSub: { color: '#94a3b8', fontSize: 12, textAlign: 'right', writingDirection: 'rtl' } as any,
});
