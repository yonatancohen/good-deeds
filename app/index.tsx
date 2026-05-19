import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,

  Platform,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  Trophy, Users, ChevronDown, ChevronUp, Star, LogIn,
} from 'lucide-react-native';
import '@/lib/i18n';
import { usePublicData, ClassWithProgress, StudentWithCredits } from '@/hooks/usePublicData';
import { Skeleton, Colors } from '@/components/ui';
import { useBreakpoint } from '@/lib/responsive';
import { shadow } from '@/lib/shadow';

const webPtr = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};

// ── Pompom jar ────────────────────────────────────────────────────────────────
const POMPOM_COLORS = ['#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#8B5CF6','#EC4899','#06B6D4'];

function PompomJar({ value, max }: { value: number; max: number }) {
  const pct    = max > 0 ? Math.min(value / max, 1) : 0;
  const fillH  = Math.round(pct * 38);          // inner fill height (max 38px)
  const dots   = Math.max(0, Math.round(pct * 9)); // pompom dots inside

  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      {/* Lid */}
      <View style={{ width: 26, height: 5, backgroundColor: '#CBD5E1', borderRadius: 3 }} />
      {/* Jar body */}
      <View style={{
        width: 34, height: 44, borderWidth: 2, borderColor: '#CBD5E1',
        borderRadius: 6, overflow: 'hidden', backgroundColor: Colors.primarySurface,
        justifyContent: 'flex-end',
      }}>
        {pct > 0 && (
          <View style={{
            height: fillH, backgroundColor: Colors.primaryLight,
            flexDirection: 'row', flexWrap: 'wrap-reverse',
            alignContent: 'flex-start', padding: 2, gap: 1,
          }}>
            {Array.from({ length: dots }, (_, i) => (
              <View key={i} style={{
                width: 7, height: 7, borderRadius: 4,
                backgroundColor: POMPOM_COLORS[i % POMPOM_COLORS.length],
              }} />
            ))}
          </View>
        )}
      </View>
      {/* Count label */}
      <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.primary, fontFamily: 'Baloo2_700Bold' } as any}>
        {value}
      </Text>
    </View>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  return (
    <View style={S.progBg} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: value }}>
      <View style={[S.progFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: pct >= 1 ? Colors.success : Colors.primary }]} />
    </View>
  );
}

// ── Student pill ───────────────────────────────────────────────────────────────
function StudentPill({ s }: { s: StudentWithCredits }) {
  return (
    <View style={S.pill} accessibilityLabel={`${s.first_name} ${s.last_name}, ${s.credits} נקודות`}>
      <View style={S.pillBadge}>
        <Text style={S.pillBadgeText}>{s.credits}</Text>
      </View>
      <Text style={S.pillName}>{s.first_name} {s.last_name}</Text>
    </View>
  );
}

// ── Class card ─────────────────────────────────────────────────────────────────
function ClassCard({ item }: { item: ClassWithProgress }) {
  const [open, setOpen] = useState(false);
  const pct = item.goal > 0 ? Math.round((item.total / item.goal) * 100) : 0;

  return (
    <View style={S.card}>
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        accessibilityRole="button"
        accessibilityLabel={`כיתה ${item.class.name}, ${item.total} מתוך ${item.goal} נקודות`}
        accessibilityState={{ expanded: open }}
        style={[S.cardTop, webPtr]}
        activeOpacity={0.7}
      >
        <View style={S.cardTopLeft}>
          <Text style={S.cardName}>{item.class.name}</Text>
          {item.class.grade ? (
            <View style={S.gradeTag}>
              <Text style={S.gradeTagText}>{item.class.grade}</Text>
            </View>
          ) : null}
        </View>

        <View style={S.cardTopRight}>
          {item.goalReached ? (
            <View style={S.goalBadge}>
              <Trophy size={13} color={Colors.accent} />
              <Text style={S.goalBadgeText}>הגיעה למטרה!</Text>
            </View>
          ) : (
            <Text style={S.cardPoints}>{item.total} / {item.goal}</Text>
          )}
          {open ? <ChevronUp size={16} color={Colors.muted} /> : <ChevronDown size={16} color={Colors.muted} />}
        </View>
      </TouchableOpacity>

      <View style={S.cardProg}>
        <View style={{ flex: 1 }}>
          <ProgBar value={item.total} max={item.goal} />
          <View style={S.cardProgRow}>
            <Text style={S.cardProgPct}>{pct}%</Text>
            <Text style={S.cardProgHint}>
              {item.goalReached ? '🎊 כיתה מצוינת!' : `עוד ${item.goal - item.total} פונפונים למטרה`}
            </Text>
          </View>
        </View>
        <PompomJar value={item.total} max={item.goal} />
      </View>

      {open && (
        <View style={S.studentsWrap}>
          {item.students.length === 0 ? (
            <View style={S.noStudentsRow}>
              <Users size={15} color={Colors.muted} />
              <Text style={S.noStudentsText}>אין תלמידים עדיין</Text>
            </View>
          ) : (
            <View style={S.pillGrid}>
              {item.students.map(s => <StudentPill key={s.id} s={s} />)}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <View style={S.card}>

      {/* mirrors cardTop — row-reverse: name+grade on right, points on left */}
      <View style={S.cardTop}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 }}>
          <Skeleton width={88} height={20} />
          <Skeleton width={40} height={18} style={{ borderRadius: 6 }} />
        </View>
        <Skeleton width={52} height={15} />
      </View>

      {/* mirrors cardProg — row-reverse: bar+row on right, jar on left */}
      <View style={S.cardProg}>
        <View style={{ flex: 1 }}>
          <Skeleton width="100%" height={8} rounded />
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 6 }}>
            <Skeleton width={28} height={12} />
            <Skeleton width={110} height={12} />
          </View>
        </View>
        {/* mirrors PompomJar: lid + body + count */}
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Skeleton width={26} height={5} style={{ borderRadius: 3 }} />
          <Skeleton width={34} height={44} style={{ borderRadius: 6 }} />
          <Skeleton width={18} height={11} />
        </View>
      </View>

    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function PublicScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, settings, loading, error } = usePublicData();
  const { isDesktop } = useBreakpoint();

  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <SafeAreaView style={[S.screen, { paddingTop: statusBarHeight }, isDesktop && { backgroundColor: 'transparent' }]}>
      <View style={[{ flex: 1 }, isDesktop && { alignSelf: 'center', width: '100%', maxWidth: 900, backgroundColor: '#fff' }]}>

        {/* ── Header ── */}
        <View style={S.header}>
          <View style={S.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={S.schoolName} accessibilityRole="header">
                {settings?.school_name ?? t('appName')}
              </Text>
              {settings?.current_year ? (
                <Text style={S.schoolYear}>שנת לימודים {settings.current_year}</Text>
              ) : null}
            </View>
            <View style={S.trophyBox}>
              <Trophy size={22} color={Colors.accent} />
            </View>
          </View>
        </View>

        {/* ── Hero Banner ── */}
        <View style={S.hero}>
          {/* Decorative pom-pom blobs */}
          <View style={[S.blob, { width: 130, height: 130, top: -45, right: -35 }]} />
          <View style={[S.blob, { width: 80,  height: 80,  bottom: -30, left: -20, opacity: 0.12 }]} />
          <View style={[S.blob, { width: 52,  height: 52,  top: 16,  left: 50,  opacity: 0.10 }]} />
          <View style={[S.blob, { width: 38,  height: 38,  bottom: 18, right: 90, opacity: 0.14 }]} />
          <Text style={S.heroTitle}>✨ תפסתי אותך בטוב</Text>
          <Text style={S.heroSub}>ביחד אוספים פונפונים ומגיעים למטרה 🎉</Text>
        </View>

        {/* ── Class cards list ── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[S.listContent, isDesktop && { padding: 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={isDesktop ? S.grid : undefined}>

            {loading && Array.from({ length: 6 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}

            {!loading && error && (
              <View style={S.errorCard}>
                <Text style={S.errorText}>{error}</Text>
              </View>
            )}

            {!loading && !error && data.length === 0 && (
              <View style={S.empty}>
                <View style={S.emptyIcon}>
                  <Star size={26} color={Colors.muted} />
                </View>
                <Text style={S.emptyText}>{t('noClasses')}</Text>
              </View>
            )}

            {!loading && !error && data.map(item => (
              <ClassCard key={item.class.id} item={item} />
            ))}

          </View>
        </ScrollView>

        {/* ── Staff login — fixed bottom ── */}
        <TouchableOpacity
          onPress={() => router.push('/auth/login')}
          accessibilityRole="link"
          accessibilityLabel="כניסה לצוות בית הספר"
          style={[S.staffLink, webPtr]}
        >
          <LogIn size={12} color="#94A3B8" />
          <Text style={S.staffLinkText}>כניסה לצוות בית הספר</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  // Header
  header: {
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16,
    backgroundColor: Colors.card,
  },
  headerRow: {
    flexDirection: 'row-reverse', alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  schoolName: {
    fontSize: 20, fontWeight: '700', color: Colors.text,
    textAlign: 'right', fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  schoolYear: {
    color: '#94A3B8', fontSize: 13, textAlign: 'right',
    marginTop: 4, writingDirection: 'rtl',
  } as any,
  trophyBox: {
    width: 44, height: 44, backgroundColor: '#FFF7ED',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 12,
  },

  // Hero banner
  hero: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    overflow: 'hidden',
    alignItems: 'flex-end',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroTitle: {
    fontSize: 26, fontWeight: '700', color: '#fff',
    fontFamily: 'Baloo2_700Bold', textAlign: 'right', writingDirection: 'rtl',
  } as any,
  heroSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.80)',
    textAlign: 'right', marginTop: 6, writingDirection: 'rtl',
  } as any,

  // List
  listContent: { padding: 16, paddingBottom: 32 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  } as any,

  // Card
  card: {
    backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1,
    borderColor: Colors.border, marginBottom: 12, overflow: 'hidden',
    ...shadow('#785900', 2, 8, 0.06, 3),
  },
  cardTop: {
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  cardTopLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 },
  cardName: {
    fontSize: 17, fontWeight: '700', color: '#0F172A',
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  gradeTag: {
    backgroundColor: Colors.surface, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  gradeTagText: { color: Colors.muted, fontSize: 12, fontWeight: '600' } as any,
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardPoints: { color: '#64748B', fontSize: 14, fontWeight: '600' } as any,
  goalBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: '#FFF7ED', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  goalBadgeText: { color: Colors.accent, fontSize: 12, fontWeight: '700' } as any,

  // Progress
  cardProg: {
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
  },
  progBg: { height: 8, backgroundColor: Colors.surfaceDim, borderRadius: 999 },
  progFill: { height: 8, borderRadius: 999 },
  cardProgRow: {
    flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 6,
  },
  cardProgPct: { color: Colors.primary, fontSize: 12, fontWeight: '700' } as any,
  cardProgHint: {
    color: '#94A3B8', fontSize: 12, textAlign: 'right', writingDirection: 'rtl',
  } as any,

  // Students
  studentsWrap: {
    padding: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.primarySurface,
  },
  noStudentsRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 8, gap: 6,
  },
  noStudentsText: { color: '#94A3B8', fontSize: 13, writingDirection: 'rtl' } as any,
  pillGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, gap: 6,
  },
  pillBadge: {
    backgroundColor: Colors.primary, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  pillBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' } as any,
  pillName: {
    color: Colors.primaryDark, fontSize: 13, fontWeight: '600',
    writingDirection: 'rtl', fontFamily: 'Nunito_600SemiBold',
  } as any,

  // Empty
  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyIcon: {
    width: 60, height: 60, backgroundColor: Colors.surface,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  emptyText: {
    color: '#94A3B8', fontSize: 15, fontWeight: '700',
    textAlign: 'center', writingDirection: 'rtl', fontFamily: 'Baloo2_700Bold',
  } as any,

  // Error
  errorCard: {
    backgroundColor: '#FEF2F2', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center', writingDirection: 'rtl' } as any,

  // Staff link — fixed bottom
  staffLink: {
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingVertical: 18,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  staffLinkText: { color: '#64748B', fontSize: 13, writingDirection: 'rtl' } as any,
});
