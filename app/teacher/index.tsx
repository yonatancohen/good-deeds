/**
 * Teacher Home — Class Cards
 *
 * White 3D cards with coloured class circle; responsive RTL grid (1–4 columns).
 */

import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useMemo, useState } from 'react';
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
import { LogOut, ClipboardList, ShieldCheck, Users } from 'lucide-react-native';

import { AS } from '@/lib/adminStyles';
import { Colors, DepthPressable } from '@/components/ui';
import { DepthShell } from '@/lib/DepthShell';
import { shadow } from '@/lib/shadow';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { useTeacherClassesWithProgress, type TeacherClassWithProgress } from '@/hooks/useTeacherClassesWithProgress';
import '@/lib/i18n';
import { getClassColorScheme } from '@/lib/classColors';
import { BP } from '@/lib/responsive';

// ── Layout constants ──────────────────────────────────────────────────────────
const MAX_CONTENT_W = 960;

// ── Styles ────────────────────────────────────────────────────────────────────
const ptr = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};
const GRID_PAD = 16;
const GRID_GAP  = 12;

/** Class colour at ~20% opacity — progress track on white cards */
function classTrackBg(bg: string): string {
  if (bg.startsWith('#') && bg.length === 7) return `${bg}33`;
  return bg;
}

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
    paddingHorizontal: 16,
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
  },
  headerBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: 16, paddingHorizontal: 14,
    height: 44, flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
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
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
    padding: 16,
    minHeight: 132,
    justifyContent: 'space-between',
  },
  cardCompact: {
    padding: 14,
    minHeight: 120,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  classCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    flexShrink: 0,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    ...shadow('#785900', 3, 8, 0.22, 4),
  },
  classCircleText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'center',
    writingDirection: 'rtl',
  } as any,
  cardStudentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  cardStudents: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,

  // Bottom: score row + progress bar
  cardBottom: { marginTop: 14 },
  cardScoreRow: {
    flexDirection: 'row-reverse',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardScore: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  cardGoalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.muted,
    textAlign: 'left',
    writingDirection: 'rtl',
  } as any,
  cardTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  cardFill: {
    height: '100%' as any,
    borderRadius: 999,
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

function TeacherClassCard({
  item,
  goal,
  compact,
  cardWidth,
  onPress,
}: {
  item: TeacherClassWithProgress;
  goal: number;
  compact: boolean;
  cardWidth: number;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const scheme = getClassColorScheme(item.class.name);
  const pct = goal > 0 ? Math.min(item.totalCredits / goal, 1) : 0;
  const pctPct = Math.round(pct * 100);

  const hoverProps =
    Platform.OS === 'web'
      ? ({
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => {
            setHovered(false);
            setPressed(false);
          },
        } as const)
      : {};

  return (
    <DepthShell
      depth={5}
      borderRadius={20}
      pressed={pressed}
      hovered={hovered}
      outerStyle={Platform.OS !== 'web' ? { width: cardWidth } : undefined}
      {...hoverProps}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={`כיתה ${item.class.name}`}
        activeOpacity={1}
        style={[S.card, compact && S.cardCompact, ptr]}
      >
          <View style={S.cardTop}>
            <View
              style={[S.classCircle, { backgroundColor: scheme.bg }]}
              accessibilityLabel={`כיתה ${item.class.name}`}
            >
              <Text
                style={[S.classCircleText, { color: scheme.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {item.class.name}
              </Text>
            </View>
            <View style={S.cardStudentRow}>
              <Users size={12} color={Colors.muted} />
              <Text style={S.cardStudents}>
                {item.studentCount} תלמידים
              </Text>
            </View>
          </View>

          <View style={S.cardBottom}>
            <View style={S.cardScoreRow}>
              <Text style={S.cardScore}>
                {item.totalCredits}/{goal}
              </Text>
              <Text style={S.cardGoalLabel}>יעד קבוצתי</Text>
            </View>
            <View style={[S.cardTrack, { backgroundColor: classTrackBg(scheme.bg) }]}>
              <View
                style={[
                  S.cardFill,
                  { width: `${pctPct}%` as any, backgroundColor: scheme.bg },
                ]}
              />
            </View>
          </View>
      </TouchableOpacity>
    </DepthShell>
  );
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
              <DepthPressable
                onPress={handleLogout}
                style={[S.headerIconBtn, ptr]}
                depth={3}
                borderRadius={14}
                accessibilityLabel="התנתק"
              >
                <LogOut size={20} color={Colors.primaryDark} />
              </DepthPressable>
            )}
            {isAdmin && (
              <DepthPressable
                onPress={() => router.replace('/admin')}
                style={[S.headerBtn, ptr]}
                depth={5}
                borderRadius={16}
                accessibilityLabel="עבור לתצוגת מנהל"
              >
                <ShieldCheck size={15} color={Colors.primaryDark} />
                <Text style={S.headerBtnText}>תצוגת מנהל</Text>
              </DepthPressable>
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
                {classes.map((item) => (
                  <TeacherClassCard
                    key={item.class.id}
                    item={item}
                    goal={goal}
                    compact={cols >= 3}
                    cardWidth={cardWidth}
                    onPress={() => router.push(`/teacher/${item.class.id}`)}
                  />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
