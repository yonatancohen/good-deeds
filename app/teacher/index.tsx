/**
 * Teacher Home — Class Grid
 *
 * Shows all the teacher's assigned classes as coloured cards in a responsive grid:
 *   mobile (< 480 px)  → 2 columns
 *   tablet (480–767)   → 3 columns
 *   desktop (≥ 768 px) → 4–6 columns (scales with window width)
 *
 * Tapping a card navigates to /teacher/class/[classId].
 * All student/deed management lives inside the class detail screen.
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
import { LogOut, Settings2, ClipboardList } from 'lucide-react-native';

import { AS } from '@/lib/adminStyles';
import { Colors } from '@/components/ui';
import { shadow } from '@/lib/shadow';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { useTeacherClassesWithProgress } from '@/hooks/useTeacherClassesWithProgress';
import '@/lib/i18n';

// ── Class card colour palette ─────────────────────────────────────────────────
const CLASS_COLORS: { bg: string; text: string; sub: string; bar: string }[] = [
  { bg: '#FF8C42', text: '#fff',    sub: 'rgba(255,255,255,0.75)', bar: 'rgba(255,255,255,0.9)' },
  { bg: '#4ECDC4', text: '#fff',    sub: 'rgba(255,255,255,0.75)', bar: 'rgba(255,255,255,0.9)' },
  { bg: '#6C63FF', text: '#fff',    sub: 'rgba(255,255,255,0.75)', bar: 'rgba(255,255,255,0.9)' },
  { bg: '#FF6B6B', text: '#fff',    sub: 'rgba(255,255,255,0.75)', bar: 'rgba(255,255,255,0.9)' },
  { bg: '#48C774', text: '#fff',    sub: 'rgba(255,255,255,0.75)', bar: 'rgba(255,255,255,0.9)' },
  { bg: '#0074D9', text: '#fff',    sub: 'rgba(255,255,255,0.75)', bar: 'rgba(255,255,255,0.9)' },
  { bg: '#E040FB', text: '#fff',    sub: 'rgba(255,255,255,0.75)', bar: 'rgba(255,255,255,0.9)' },
  { bg: '#FF9800', text: '#fff',    sub: 'rgba(255,255,255,0.75)', bar: 'rgba(255,255,255,0.9)' },
  { bg: '#00BCD4', text: '#fff',    sub: 'rgba(255,255,255,0.75)', bar: 'rgba(255,255,255,0.9)' },
  { bg: '#F06292', text: '#fff',    sub: 'rgba(255,255,255,0.75)', bar: 'rgba(255,255,255,0.9)' },
];

function getColor(index: number) {
  return CLASS_COLORS[index % CLASS_COLORS.length];
}

// ── Column count helper ───────────────────────────────────────────────────────
function numColumns(width: number, isWeb: boolean): number {
  if (!isWeb) return width >= 600 ? 3 : 2;
  if (width < 640)  return 2;
  if (width < 900)  return 3;
  if (width < 1200) return 4;
  if (width < 1500) return 5;
  return 6;
}

// ── StyleSheet ────────────────────────────────────────────────────────────────
const ptr = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  // ── Header ──
  header: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  headerTitle: {
    fontSize: 20, fontWeight: '700', color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  headerSub: {
    fontSize: 12, color: Colors.muted, writingDirection: 'rtl', marginTop: 1,
  } as any,
  headerBtns: { flexDirection: 'row-reverse', gap: 8 },
  headerIconBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#f5ede2', alignItems: 'center', justifyContent: 'center',
  },

  // ── Content ──
  content: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // ── Section ──
  sectionRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    writingDirection: 'rtl', textAlign: 'right',
  } as any,
  classCount: {
    fontSize: 12, color: Colors.outline, writingDirection: 'rtl',
  } as any,

  // ── Grid ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },

  // ── Class card ──
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    minHeight: 160,
    justifyContent: 'space-between',
    ...shadow('#0f172a', 4, 16, 0.14, 6),
  },
  cardName: {
    fontSize: 22, fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl', textAlign: 'right',
    flexShrink: 1,
  } as any,
  cardSub: {
    fontSize: 13, marginTop: 2,
    writingDirection: 'rtl', textAlign: 'right',
  } as any,
  cardBottom: { marginTop: 12 },
  cardProgress: {
    height: 6, borderRadius: 999, overflow: 'hidden', marginBottom: 6,
  },
  cardProgressFill: {
    height: '100%' as any, borderRadius: 999,
  },
  cardProgressLabel: {
    fontSize: 11, fontWeight: '600', writingDirection: 'rtl', textAlign: 'right',
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

  // ── No class banner ──
  noClassBanner: {
    margin: 16, backgroundColor: '#FFFBEB',
    borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16,
  },
  noClassText: {
    color: '#92400e', fontSize: 14, textAlign: 'center', writingDirection: 'rtl',
  } as any,
});

// ── Component ─────────────────────────────────────────────────────────────────
export default function TeacherHome() {
  const router  = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();
  const { classes, loading, error } = useTeacherClassesWithProgress();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const cols     = numColumns(width, isWeb);
  const padH     = 16;
  const gap      = 12;
  const cardW    = (width - padH * 2 - gap * (cols - 1)) / cols;
  const goal     = settings?.global_goal ?? 100;

  const displayName = useMemo(() => {
    const email = user?.email ?? '';
    return email.split('@')[0] ?? 'מורה';
  }, [user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={AS.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const assignedClasses = classes.filter((c) => c.studentCount > 0 || true);
  const hasClasses = assignedClasses.length > 0;

  return (
    <SafeAreaView style={S.screen} edges={['top', 'left', 'right']}>
      {/* ── Header ── */}
      <View style={S.header}>
        <View>
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
              <LogOut size={20} color={Colors.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={S.content}
        contentContainerStyle={[
          S.scrollContent,
          isWeb && { maxWidth: 1400, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={S.noClassBanner}>
            <Text style={S.noClassText}>{error}</Text>
          </View>
        ) : !hasClasses ? (
          <View style={S.empty}>
            <View style={S.emptyIcon}>
              <ClipboardList size={28} color={Colors.primaryDark} />
            </View>
            <Text style={S.emptyTitle}>אין כיתות משויכות</Text>
            <Text style={S.emptyHint}>פנה/י למנהל המערכת כדי לקבל גישה לכיתות</Text>
          </View>
        ) : (
          <>
            {/* Section header */}
            <View style={S.sectionRow}>
              <Text style={S.sectionTitle}>כיתות</Text>
              <Text style={S.classCount}>{assignedClasses.length} כיתות</Text>
            </View>

            {/* Card grid */}
            <View style={S.grid}>
              {assignedClasses.map((item) => {
                const palette  = getColor(item.colorIndex);
                const pct      = goal > 0 ? Math.min(item.totalCredits / goal, 1) : 0;
                const pctLabel = goal > 0
                  ? `${item.totalCredits} / ${goal} נקודות`
                  : `${item.totalCredits} נקודות`;

                return (
                  <TouchableOpacity
                    key={item.class.id}
                    onPress={() => router.push(`/teacher/class/${item.class.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`כיתה ${item.class.name}`}
                    activeOpacity={0.85}
                    style={[
                      S.card,
                      { backgroundColor: palette.bg, width: cardW },
                      ptr,
                    ]}
                  >
                    {/* Class name + student count */}
                    <View>
                      <Text style={[S.cardName, { color: palette.text }]}>
                        {item.class.name}
                      </Text>
                      <Text style={[S.cardSub, { color: palette.sub }]}>
                        {item.studentCount} תלמידים
                      </Text>
                    </View>

                    {/* Progress bar + label */}
                    <View style={S.cardBottom}>
                      <View
                        style={[
                          S.cardProgress,
                          { backgroundColor: 'rgba(255,255,255,0.3)' },
                        ]}
                      >
                        <View
                          style={[
                            S.cardProgressFill,
                            {
                              width: `${Math.round(pct * 100)}%` as any,
                              backgroundColor: palette.bar,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[S.cardProgressLabel, { color: palette.sub }]}>
                        {pctLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
