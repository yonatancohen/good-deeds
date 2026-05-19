/**
 * Teacher Home — Class Grid
 *
 * Responsive grid of coloured class cards. Tap → /teacher/[classId].
 * Grid columns: 2 mobile · 3 narrow tablet · 4–6 desktop (scales with width).
 * Card colour is stable: derived from the first Hebrew letter in the class name.
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
import { LogOut, ClipboardList, ShieldCheck } from 'lucide-react-native';

import { AS } from '@/lib/adminStyles';
import { Colors } from '@/components/ui';
import { shadow } from '@/lib/shadow';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { useTeacherClassesWithProgress } from '@/hooks/useTeacherClassesWithProgress';
import '@/lib/i18n';

// ── Colour palette ────────────────────────────────────────────────────────────
// Index 0 = א, 1 = ב, 2 = ג … Cycles after 10.
const CLASS_COLORS = [
  '#FF8C42', // א – warm orange
  '#4ECDC4', // ב – teal
  '#6C63FF', // ג – violet
  '#FF6B6B', // ד – coral
  '#48C774', // ה – green
  '#0074D9', // ו – blue
  '#E040FB', // ז – purple
  '#FF9800', // ח – amber
  '#00BCD4', // ט – cyan
  '#F06292', // י – pink
] as const;

/** First Hebrew letter found in name → stable 0-based palette index */
const HEB_ALPHA = 'אבגדהוזחטיכלמנסעפצקרשת';
function hebrewColorIndex(name: string): number {
  for (const ch of name) {
    const i = HEB_ALPHA.indexOf(ch);
    if (i >= 0) return i % CLASS_COLORS.length;
  }
  return 0;
}

// ── Responsive column count ───────────────────────────────────────────────────
const MAX_CONTENT_W = 1200;

function numCols(width: number, isWeb: boolean): number {
  if (!isWeb) return width >= 600 ? 3 : 2;
  const w = Math.min(width, MAX_CONTENT_W);
  if (w < 560)  return 2;
  if (w < 820)  return 3;
  if (w < 1000) return 4;
  if (w < 1200) return 5;
  return 6;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ptr = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};
const GRID_PAD = 16;
const GRID_GAP  = 12;

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  // ── Header bar (full-width) ──
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
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#f5ede2', alignItems: 'center', justifyContent: 'center',
  },

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

  // ── Grid ──
  grid: {
    flexDirection: 'row-reverse',   // RTL: cards start from the right
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PAD,
    gap: GRID_GAP,
  },

  // ── Class card ──
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    minHeight: 160,
    justifyContent: 'space-between',
    ...shadow('#0f172a', 4, 16, 0.14, 6),
  },
  cardName: {
    fontSize: 22, fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
    color: '#fff',
    textAlign: 'right', writingDirection: 'rtl',
    flexShrink: 1,
  } as any,
  cardSub: {
    fontSize: 13, marginTop: 3,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right', writingDirection: 'rtl',
  } as any,
  cardBottom: { marginTop: 14 },
  cardProgressTrack: {
    height: 6, borderRadius: 999, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 6,
  },
  cardProgressFill: {
    height: '100%' as any, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  cardProgressLabel: {
    fontSize: 11, fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'right', writingDirection: 'rtl',
  } as any,

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
export default function TeacherHome() {
  const router  = useRouter();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { classes, loading, error } = useTeacherClassesWithProgress();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  // Cap card width to MAX_CONTENT_W so cards don't over-stretch on wide screens
  const effectiveW = isWeb ? Math.min(width, MAX_CONTENT_W) : width;
  const cols       = numCols(width, isWeb);
  const cardW      = (effectiveW - GRID_PAD * 2 - GRID_GAP * (cols - 1)) / cols;
  const goal       = settings?.global_goal ?? 100;

  const displayName = useMemo(() => {
    const name = user?.display_name ?? user?.email?.split('@')[0] ?? 'מורה';
    return name;
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  // centred container on web (applied to both header inner + grid)
  const centreStyle = isWeb
    ? { maxWidth: MAX_CONTENT_W, alignSelf: 'center' as const, width: '100%' as any }
    : undefined;

  // ── Loading ──────────────────────────────────────────────────────────────────
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
          {/* Greeting — right side (RTL first child in row-reverse) */}
          <View style={S.headerText}>
            <Text style={S.headerTitle}>שלום, {displayName} 👋</Text>
            <Text style={S.headerSub}>הכיתות שלך</Text>
          </View>

          {/* Action buttons — left side */}
          <View style={S.headerBtns}>
            {user && (
              <TouchableOpacity
                onPress={handleLogout}
                style={[S.headerIconBtn, ptr]}
                accessibilityRole="button"
                accessibilityLabel="התנתק"
              >
                <LogOut size={20} color={Colors.muted} />
              </TouchableOpacity>
            )}
            {isAdmin && (
              <TouchableOpacity
                onPress={() => router.replace('/admin')}
                style={[S.headerIconBtn, ptr]}
                accessibilityRole="button"
                accessibilityLabel="חזור לניהול"
              >
                <ShieldCheck size={20} color={Colors.secondary} />
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
              <Text style={S.emptyTitle}>אין כיתות משויכות</Text>
              <Text style={S.emptyHint}>פנה/י למנהל המערכת כדי לקבל גישה לכיתות</Text>
            </View>

          ) : (
            <>
              {/* Section label */}
              <View style={S.sectionRow}>
                <Text style={S.sectionTitle}>כיתות</Text>
                <Text style={S.classCount}>{classes.length} כיתות</Text>
              </View>

              {/* Grid */}
              <View style={S.grid}>
                {classes.map((item) => {
                  const bg      = CLASS_COLORS[hebrewColorIndex(item.class.name)];
                  const pct     = goal > 0 ? Math.min(item.totalCredits / goal, 1) : 0;
                  const pctPct  = Math.round(pct * 100);
                  const label   = `${item.totalCredits} / ${goal} נקודות`;

                  return (
                    <TouchableOpacity
                      key={item.class.id}
                      onPress={() => router.push(`/teacher/class/${item.class.id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`כיתה ${item.class.name}`}
                      activeOpacity={0.85}
                      style={[S.card, { backgroundColor: bg, width: cardW }, ptr]}
                    >
                      {/* Class name + student count */}
                      <View>
                        <Text style={S.cardName}>{item.class.name}</Text>
                        <Text style={S.cardSub}>{item.studentCount} תלמידים</Text>
                      </View>

                      {/* Progress bar */}
                      <View style={S.cardBottom}>
                        <View style={S.cardProgressTrack}>
                          <View style={[S.cardProgressFill, { width: `${pctPct}%` as any }]} />
                        </View>
                        <Text style={S.cardProgressLabel}>{label}</Text>
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
