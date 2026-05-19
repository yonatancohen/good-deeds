import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Platform, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Building2, UserCheck, BookOpen, Gift, Trophy,
  Settings, Globe, LogOut, Users, ChevronLeft,
  GraduationCap, ClipboardList,
} from 'lucide-react-native';
import moment from 'moment';
import 'moment/locale/he';
import '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/components/ui';
import { useBreakpoint } from '@/lib/responsive';
import { shadow } from '@/lib/shadow';
import { AS } from '@/lib/adminStyles';
import type { Tables } from '@/types/supabase';

moment.locale('he');

type ClassRow = Tables<'classes'>;
type GiftRow = Tables<'gifts'>;
type PendingRedemption = {
  id: string;
  redeemed_at: string;
  note: string | null;
  classes: ClassRow | null;
  gifts: GiftRow | null;
};

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
  tileText: string;
  tileSub: string;
}

// All 6 palette colours, one per section — white text for dark bgs, primaryDark for light.
const MENU: MenuTile[] = [
  { Icon: Building2, label: 'כיתות',       description: 'הוספה, עריכה ומחיקה של כיתות',              route: '/admin/classes',     tileBg: Colors.secondary, tileText: '#ffffff',          tileSub: 'rgba(255,255,255,0.72)' },
  { Icon: GraduationCap, label: 'תלמידים', description: 'צפייה, הוספה ומחיקה של תלמידים לפי כיתה',     route: '/admin/students',    tileBg: '#6366F1',        tileText: '#ffffff', tileSub: 'rgba(255,255,255,0.72)' },
  { Icon: UserCheck, label: 'מורים',        description: 'ניהול מורים והזמנת מורים חדשים',            route: '/admin/teachers',    tileBg: Colors.salmon,    tileText: '#ffffff', tileSub: 'rgba(255,255,255,0.72)' },
  { Icon: BookOpen,  label: 'מעשים טובים', description: 'ניהול רשימת המעשים הטובים ושוויהם',         route: '/admin/deeds',       tileBg: Colors.accent,    tileText: '#ffffff', tileSub: 'rgba(255,255,255,0.72)' },
  { Icon: Gift,      label: 'פרסים',        description: 'ניהול רשימת הפרסים שכיתה יכולה לזכות בהם',  route: '/admin/gifts',       tileBg: Colors.success,   tileText: '#ffffff', tileSub: 'rgba(255,255,255,0.72)' },
  { Icon: Trophy,    label: 'מתנות לכיתה',  description: 'רישום מתנה לכיתה שהגיעה למטרה',              route: '/admin/redemptions', tileBg: Colors.primary,   tileText: '#ffffff', tileSub: 'rgba(255,255,255,0.72)' },
  { Icon: ClipboardList, label: 'יומן זיכויים', description: 'צפייה, עריכה ומחיקה של כל הזיכויים',   route: '/admin/credit-log',  tileBg: '#0EA5E9',        tileText: '#ffffff', tileSub: 'rgba(255,255,255,0.72)' },
  { Icon: Settings,  label: 'הגדרות',       description: 'שם בית הספר, שנת לימודים ומטרת נקודות',     route: '/admin/settings',    tileBg: Colors.peach,     tileText: '#ffffff', tileSub: 'rgba(255,255,255,0.72)' },
];

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};

export default function AdminHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings, refresh } = useSettings();
  const { isDesktop } = useBreakpoint();

  const [pendingRedemptions, setPendingRedemptions] = useState<PendingRedemption[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  const cols = isDesktop ? 3 : 2;

  const loadPendingRedemptions = useCallback(async () => {
    const { data, error } = await supabase
      .from('redemption_rounds')
      .select('id, redeemed_at, note, classes(*), gifts(*)')
      .eq('fulfilled', false)
      .order('redeemed_at', { ascending: false })
      .limit(50);

    if (!error) {
      const rows = (data ?? []) as PendingRedemption[];
      setPendingRedemptions(rows.filter((r) => r.classes && !r.classes.deleted_at));
    }
    setPendingLoading(false);
  }, []);

  // Empty deps: refresh from useSettings is recreated each render; including it loops forever.
  useFocusEffect(
    useCallback(() => {
      refresh();
      setPendingLoading(true);
      loadPendingRedemptions();
    }, []),
  );

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
              <Users size={15} color={Colors.primaryDark} />
              <Text style={S.headerBtnText}>תצוגת מורה</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleLogout}
              style={[S.headerBtnIcon, pointer]}
              accessibilityRole="button"
              accessibilityLabel="התנתק"
            >
              <LogOut size={18} color={Colors.primaryDark} />
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
            <View style={S.avatarShadow}>
              <View style={S.avatarClip}>
                <Image
                  source={require('@/assets/icon.png')}
                  style={{ width: 75, height: 75 }}
                  resizeMode="cover"
                  accessibilityLabel="תמונת פרופיל"
                />
              </View>
            </View>
          </View>

          {/* Pending gifts — assigned to classes, not yet fulfilled */}
          {pendingLoading ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ marginBottom: 16 }}
              accessibilityLabel="טוען מתנות ממתינות"
            />
          ) : (
            <View style={S.pendingSection} accessibilityRole="summary">
              <View style={S.pendingHeader}>
                {pendingRedemptions.length > 0 && (
                  <View style={S.pendingCountBadge}>
                    <Text style={S.pendingCountText}>{pendingRedemptions.length}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={S.pendingTitle}>מתנות שטרם מומשו</Text>
                  <Text style={S.pendingSub}>
                    {pendingRedemptions.length > 0
                      ? 'כיתות שבחרו פרס וממתינות למסירה בפועל'
                      : 'מעקב אחר פרסים שטרם נמסרו לכיתות'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/admin/redemptions' as any)}
                  style={[S.pendingLink, pointer]}
                  accessibilityRole="link"
                  accessibilityLabel="פתח את כל המתנות לכיתה"
                >
                  <Text style={S.pendingLinkText}>הכל</Text>
                  <ChevronLeft size={14} color={Colors.primaryDark} />
                </TouchableOpacity>
              </View>

              {pendingRedemptions.length > 0 ? (
                <View style={S.pendingList}>
                  {pendingRedemptions.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => router.push('/admin/redemptions' as any)}
                      style={[S.pendingRow, pointer]}
                      accessibilityRole="button"
                      accessibilityLabel={`כיתה ${r.classes?.name ?? ''}, מתנה ${r.gifts?.name ?? 'ללא שם'}, ממתין למימוש`}
                    >
                      <View style={S.pendingRowIcon}>
                        <Trophy size={18} color={Colors.accent} />
                      </View>
                      <View style={S.pendingRowBody}>
                        <Text style={S.pendingRowClass} numberOfLines={1}>
                          כיתה {r.classes?.name ?? '—'}
                        </Text>
                        {r.gifts?.name ? (
                          <Text style={S.pendingRowGift} numberOfLines={1}>
                            {r.gifts.name}
                          </Text>
                        ) : null}
                        {r.note ? (
                          <Text style={S.pendingRowNote} numberOfLines={1}>{r.note}</Text>
                        ) : null}
                      </View>
                      <View style={S.pendingRowMeta}>
                        <View style={S.pendingStatusBadge}>
                          <Text style={S.pendingStatusText}>ממתין</Text>
                        </View>
                        <Text style={S.pendingRowDate}>
                          {moment(r.redeemed_at).format('DD/MM/YY')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={S.pendingEmpty}>
                  <View style={[AS.emptyIcon, { backgroundColor: '#FFEDD5' }]}>
                    <Trophy size={28} color={Colors.accent} />
                  </View>
                  <Text style={AS.emptyTitle}>אין מתנות למימוש</Text>
                  <Text style={AS.emptyHint}>
                    כשכיתה תירשם לפרס — היא תופיע כאן למעקב.
                  </Text>
                </View>
              )}
            </View>
          )}

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
                      {/* Decorative circle */}
                      <View style={[S.tileDecor, { backgroundColor: 'rgba(255,255,255,0.18)' }]} />

                      {/* Icon bubble */}
                      <View style={[S.tileIconBubble, { backgroundColor: 'rgba(255,255,255,0.22)' }]}>
                        <Icon size={24} color={tile.tileText} />
                      </View>

                      <Text style={[S.tileTitle, { color: tile.tileText }, isDesktop && { fontSize: 18 }]}>
                        {tile.label}
                      </Text>
                      <Text style={[S.tileDesc, { color: tile.tileSub }, isDesktop && { fontSize: 12 }]}>
                        {tile.description}
                      </Text>
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
            <View style={S.publicBlob1} />
            <View style={S.publicBlob2} />
            <View style={S.publicIcon}>
              <Globe size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.publicTitle}>✨ צפה בדף הציבורי</Text>
              <Text style={S.publicSub}>כך רואים ההורים והתלמידים את לוח ההצלחות</Text>
            </View>
            <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  // ── Header ──
  headerBar: {
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  headerInner: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  headerInnerDesktop: { maxWidth: 960, alignSelf: 'center', width: '100%' } as any,
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: Colors.text,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl', textAlign: 'right',
  } as any,
  headerSub: { color: Colors.muted, fontSize: 13, writingDirection: 'rtl', textAlign: 'right' } as any,
  headerBtns: { flexDirection: 'row-reverse', gap: 8 },
  headerBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: 16, paddingHorizontal: 14,
    height: 44, flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 3px 0 #5b4300' } as any) : {}),
  },
  headerBtnText: {
    color: Colors.primaryDark, fontSize: 14, fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
  } as any,
  headerBtnIcon: {
    backgroundColor: Colors.primaryLight, borderRadius: 14,
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 3px 0 #5b4300' } as any) : {}),
  },

  // ── Body ──
  bodyMobile:     { padding: 16 },
  bodyDesktop:    { padding: 32, paddingTop: 24 },
  contentDesktop: { maxWidth: 960, alignSelf: 'center', width: '100%' } as any,

  // ── Welcome ──
  welcome: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 14,
    paddingHorizontal: 4, paddingTop: 8, paddingBottom: 20,
  },
  welcomeText:    { flex: 1, alignItems: 'flex-end' },
  welcomeGreeting: {
    color: Colors.muted, fontSize: 13, textAlign: 'right',
    writingDirection: 'rtl', marginBottom: 2,
  } as any,
  welcomeTitle: {
    fontSize: 22, fontWeight: '700', color: Colors.text,
    textAlign: 'right', fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  avatarShadow: { width: 75, height: 75, borderRadius: 38, ...shadow(Colors.primary, 8, 16, 0.45, 12) },
  avatarClip:   { width: 75, height: 75, borderRadius: 38, overflow: 'hidden' },

  // ── Pending redemptions ──
  pendingSection: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    ...shadow('#D97706', 3, 10, 0.12, 4),
  },
  pendingHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  pendingCountBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pendingCountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
  } as any,
  pendingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'Baloo2_700Bold',
  } as any,
  pendingSub: {
    fontSize: 12,
    color: '#B45309',
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  } as any,
  pendingLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pendingLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
    writingDirection: 'rtl',
  } as any,
  pendingList: { gap: 8 },
  pendingEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 14,
  },
  pendingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pendingRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingRowBody: { flex: 1, alignItems: 'flex-end' },
  pendingRowClass: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as any,
  pendingRowGift: {
    fontSize: 13,
    color: '#64748b',
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 2,
  } as any,
  pendingRowNote: {
    fontSize: 11,
    color: '#94a3b8',
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 2,
  } as any,
  pendingRowMeta: { alignItems: 'flex-start', gap: 4 },
  pendingStatusBadge: {
    backgroundColor: '#FFEDD5',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9A3412',
    writingDirection: 'rtl',
  } as any,
  pendingRowDate: {
    fontSize: 11,
    color: '#94a3b8',
    writingDirection: 'rtl',
  } as any,

  // ── Grid ──
  grid:    { gap: 14 },
  gridRow: { flexDirection: 'row-reverse', gap: 14 },
  tile: {
    flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 14,
    minHeight: 148, overflow: 'hidden', justifyContent: 'flex-end',
    ...shadow('#000', 4, 12, 0.16, 6),
  },
  tileDesktop:  { minHeight: 164 },
  tileDecor: {
    position: 'absolute', right: -22, top: -22,
    width: 108, height: 108, borderRadius: 54,
  },
  tileIconBubble: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  tileTitle: {
    fontSize: 17, fontWeight: '700', marginBottom: 3,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl', textAlign: 'right',
  } as any,
  tileDesc: {
    fontSize: 11, lineHeight: 15,
    writingDirection: 'rtl', textAlign: 'right',
  } as any,

  // ── Public link ──
  publicLink: {
    marginTop: 20, backgroundColor: Colors.primaryDark,
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 24,
    flexDirection: 'row-reverse', alignItems: 'center', overflow: 'hidden',
    ...shadow(Colors.primaryDark, 6, 16, 0.40, 8),
  },
  publicBlob1: {
    position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)',
    width: 110, height: 110, top: -40, left: -30,
  },
  publicBlob2: {
    position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)',
    width: 60, height: 60, bottom: -25, right: 60,
  },
  publicIcon: {
    width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 12,
  },
  publicTitle: {
    color: '#fff', fontWeight: '700', fontSize: 15, textAlign: 'right',
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  publicSub: {
    color: 'rgba(255,255,255,0.72)', fontSize: 12, textAlign: 'right',
    writingDirection: 'rtl', marginTop: 2,
  } as any,
});
