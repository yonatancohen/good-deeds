/**
 * Teacher Home — Class Cards
 *
 * Coloured class cards in a responsive RTL grid (1–4 columns by width).
 * Card colour cycles through 6 design-system palette colours,
 * keyed by the first Hebrew letter in the class name.
 */

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, ClipboardList, ShieldCheck, GraduationCap, Users } from 'lucide-react-native';

import { AS } from '@/lib/adminStyles';
import { Colors } from '@/components/ui';
import { shadow } from '@/lib/shadow';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { useTeacherClassesWithProgress } from '@/hooks/useTeacherClassesWithProgress';
import '@/lib/i18n';
import { CLASS_COLORS, hebrewColorIndex } from '@/lib/classColors';
import { BP } from '@/lib/responsive';

// ── Layout constants ──────────────────────────────────────────────────────────
const MAX_CONTENT_W = 960;

// ── Styles ────────────────────────────────────────────────────────────────────
const ptr = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};
const GRID_PAD = 16;
const GRID_GAP  = 12;

/** Text on coloured class cards — always white for contrast */
const CARD_ON = {
  text: '#ffffff',
  sub: 'rgba(255,255,255,0.78)',
  track: 'rgba(255,255,255,0.28)',
  fill: 'rgba(255,255,255,0.88)',
} as const;

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  // ── Header bar ──
  headerBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerText: { alignItems: 'flex-end' },
  headerTitle: {
    fontSize: 20, fontWeight: '700', color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'right', writingDirection: 'rtl',
  } as any,
  headerSub: {
    fontSize: 12, color: Colors.muted, marginTop: 1,
    textAlign: 'right', writingDirection: 'rtl',
  } as any,
  headerBtns: { flexDirection: 'row', gap: 8 },
  headerIconBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 3px 0 #5b4300' } as any) : {}),
  },
  headerBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: 16, paddingHorizontal: 14,
    height: 44, flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 5px 0 #5b4300' } as any) : {}),
  },
  headerBtnText: { color: Colors.primaryDark, fontSize: 14, fontWeight: '700', fontFamily: 'Baloo2_700Bold' } as any,

  // ── Scroll content ──
  scrollContent: { paddingBottom: 40 },

  // ── Section label row ──
  sectionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GRID_PAD,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.muted,
    letterSpacing: 0.6,
    textAlign: 'right', writingDirection: 'rtl',
  } as any,
  classCount: {
    fontSize: 12, color: Colors.outline,
    textAlign: 'left', writingDirection: 'rtl',
  } as any,

  // ── Card grid (layout applied inline for responsive cols) ──
  grid: {
    paddingHorizontal: GRID_PAD,
  },

  // ── Class card ──
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
    minHeight: 132,
    justifyContent: 'space-between',
    ...shadow('#0f172a', 6, 20, 0.16, 8),
  },
  cardCompact: {
    padding: 14,
    minHeight: 120,
  },

  // Top row: icon (left) + name block (right), RTL
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardNameBlock: { flex: 1, alignItems: 'flex-end', marginRight: 10 },
  cardName: {
    fontSize: 22, fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'right', writingDirection: 'rtl',
    lineHeight: 28,
  } as any,
  cardStudentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardStudents: {
    fontSize: 13,
    textAlign: 'right', writingDirection: 'rtl',
  } as any,
  cardIconBubble: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    flexShrink: 0,
  },

  // Bottom: score row + progress bar
  cardBottom: { marginTop: 14 },
  cardScoreRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardScore: {
    fontSize: 20, fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'right', writingDirection: 'rtl',
  } as any,
  cardGoalLabel: {
    fontSize: 12, fontWeight: '500',
    textAlign: 'left', writingDirection: 'rtl',
  } as any,
  cardTrack: {
    height: 7, borderRadius: 999, overflow: 'hidden',
  },
  cardFill: {
    height: '100%' as any, borderRadius: 999,
  },

  // ── Empty state ──
  empty: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.muted,
    textAlign: 'center', fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  emptyHint: {
    fontSize: 13, color: Colors.outline,
    textAlign: 'center', marginTop: 6, writingDirection: 'rtl',
  } as any,

  // ── Error banner ──
  errorBanner: {
    margin: 16, backgroundColor: '#FFFBEB',
    borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16,
  },
  errorText: {
    color: '#92400e', fontSize: 14, textAlign: 'center', writingDirection: 'rtl',
  } as any,
});

// ── Component ─────────────────────────────────────────────────────────────────
function gridColumns(screenWidth: number): number {
  if (screenWidth < 420) return 1;
  if (screenWidth < BP.md) return 2;
  if (screenWidth >= BP.lg) return 4;
  if (screenWidth >= BP.md) return 3;
  return 2;
}

export default function TeacherHome() {
  const router  = useRouter();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { classes, loading, error } = useTeacherClassesWithProgress();
  const { width: screenWidth } = useWindowDimensions();
  const goal  = settings?.global_goal ?? 100;

  const displayName = useMemo(() => {
    return user?.display_name ?? user?.email?.split('@')[0] ?? 'מורה';
  }, [user]);

  const cols = useMemo(() => gridColumns(screenWidth), [screenWidth]);
  const contentWidth = Math.min(screenWidth - GRID_PAD * 2, MAX_CONTENT_W);
  const cardWidth =
    cols === 1
      ? contentWidth
      : Math.floor((contentWidth - GRID_GAP * (cols - 1)) / cols);

  const gridStyle = useMemo(
    () =>
      Platform.OS === 'web'
        ? ({
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: GRID_GAP,
            width: '100%',
            direction: 'rtl',
          } as object)
        : { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: GRID_GAP },
    [cols],
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  const centreStyle = Platform.OS === 'web'
    ? { maxWidth: MAX_CONTENT_W, alignSelf: 'center' as const, width: '100%' as any }
    : undefined;

  if (loading) {
    return (
      <SafeAreaView style={AS.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.screen} edges={['top', 'left', 'right']}>

      {/* ── Header ── */}
      <View style={S.headerBar}>
        <View style={[S.headerInner, centreStyle]}>
          <View style={S.headerText}>
            <Text style={S.headerTitle}>שלום, {displayName} 👋</Text>
            <Text style={S.headerSub}>הכיתות שלך</Text>
          </View>
          <View style={S.headerBtns}>
            {user && (
              <TouchableOpacity
                onPress={handleLogout}
                style={[S.headerIconBtn, ptr]}
                accessibilityRole="button"
                accessibilityLabel="התנתק"
              >
                <LogOut size={20} color={Colors.primaryDark} />
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity
                onPress={() => router.replace('/admin')}
                style={[S.headerBtn, ptr]}
                accessibilityRole="button"
                accessibilityLabel="עבור לתצוגת מנהל"
              >
                <ShieldCheck size={15} color={Colors.primaryDark} />
                <Text style={S.headerBtnText}>תצוגת מנהל</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={centreStyle}>
          {error ? (
            <View style={S.errorBanner}>
              <Text style={S.errorText}>{error}</Text>
            </View>

          ) : classes.length === 0 ? (
            <View style={S.empty}>
              <View style={S.emptyIcon}>
                <ClipboardList size={28} color={Colors.primaryDark} />
              </View>
              <Text style={S.emptyTitle}>אין כיתות עדיין</Text>
              <Text style={S.emptyHint}>פנה/י למנהל המערכת להוספת כיתות</Text>
            </View>

          ) : (
            <>
              {/* Section label */}
              <View style={S.sectionRow}>
                <Text style={S.sectionTitle}>הכיתות שלי</Text>
                <Text style={S.classCount}>{classes.length} כיתות</Text>
              </View>

              {/* Grid */}
              <View style={[S.grid, gridStyle]}>
                {classes.map((item) => {
                  const scheme  = CLASS_COLORS[hebrewColorIndex(item.class.name)];
                  const pct     = goal > 0 ? Math.min(item.totalCredits / goal, 1) : 0;
                  const pctPct  = Math.round(pct * 100);
                  const compact = cols >= 3;

                  return (
                    <TouchableOpacity
                      key={item.class.id}
                      onPress={() => router.push(`/teacher/${item.class.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`כיתה ${item.class.name}`}
                      activeOpacity={0.82}
                      style={[
                        S.card,
                        compact && S.cardCompact,
                        { backgroundColor: scheme.bg },
                        Platform.OS !== 'web' && { width: cardWidth },
                        ptr,
                      ]}
                    >
                      {/* ── Top row: icon שמאל, שם ימין (RTL) ── */}
                      <View style={S.cardTop}>
                        <View style={S.cardIconBubble}>
                          <GraduationCap size={22} color={CARD_ON.text} />
                        </View>
                        <View style={S.cardNameBlock}>
                          <Text style={[S.cardName, { color: CARD_ON.text }]}>
                            {item.class.name}
                          </Text>
                          <View style={S.cardStudentRow}>
                            <Users size={11} color={CARD_ON.sub} />
                            <Text style={[S.cardStudents, { color: CARD_ON.sub }]}>
                              {item.studentCount} תלמידים
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* ── Bottom: score + progress ── */}
                      <View style={S.cardBottom}>
                        <View style={S.cardScoreRow}>
                          <Text style={[S.cardScore, { color: CARD_ON.text }]}>
                            {item.totalCredits}/{goal}
                          </Text>
                          <Text style={[S.cardGoalLabel, { color: CARD_ON.sub }]}>
                            יעד קבוצתי
                          </Text>
                        </View>
                        <View style={[S.cardTrack, { backgroundColor: CARD_ON.track }]}>
                          <View
                            style={[
                              S.cardFill,
                              { width: `${pctPct}%` as any, backgroundColor: CARD_ON.fill },
                            ]}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
