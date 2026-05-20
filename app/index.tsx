import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
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
import { cardDepthStyle, buttonDepthStatic } from '@/lib/cardDepth';
import { shadow } from '@/lib/shadow';
import { getClassColorScheme } from '@/lib/classColors';

const webPtr = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};
const MAX_CONTENT_W = 900;

// ── Pompom jar ────────────────────────────────────────────────────────────────
const POMPOM_COLORS = ['#EF4444','#F97316','#EAB308','#22C55E','#3B82F6','#8B5CF6','#EC4899','#06B6D4'];

function PompomJar({ value, max }: { value: number; max: number }) {
  const pct    = max > 0 ? Math.min(value / max, 1) : 0;
  const fillH  = Math.round(pct * 38);          // inner fill height (max 38px)
  const dots   = Math.max(0, Math.round(pct * 9)); // pompom dots inside

  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      {/* Lid */}
      <View style={{ width: 26, height: 5, backgroundColor: Colors.border, borderRadius: 3 }} />
      {/* Jar body */}
      <View style={{
        width: 34, height: 44, borderWidth: 2, borderColor: Colors.border,
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
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const pct = item.goal > 0 ? Math.round((item.total / item.goal) * 100) : 0;
  const liftY = pressed ? 4 : hovered ? -4 : 0;
  const scheme = getClassColorScheme(item.class.grade || item.class.name);

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

  function onPressIn() {
    setPressed(true);
  }

  function onPressOut() {
    setPressed(false);
  }

  return (
    <View style={S.cardOuterShell} {...hoverProps}>
      <View
        style={[
          S.cardLift,
          cardDepthStyle(pressed, hovered),
          { transform: [{ translateY: liftY }] },
        ]}
      >
      <View style={S.card}>
      <TouchableOpacity
        onPress={() => setOpen(v => !v)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={`כיתה ${item.class.name}, ${item.total} מתוך ${item.goal} נקודות`}
        accessibilityState={{ expanded: open }}
        style={[S.cardTop, webPtr]}
        activeOpacity={1}
      >
        <View style={S.cardTopLeft}>
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
          {item.prizesWonCount > 0 && (
            <View style={S.prizesWonBadge}>
              <Text style={S.prizesWonBadgeText}>
                {item.prizesWonCount === 1
                  ? 'זכו כבר בפרס אחד!'
                  : `זכו כבר ב-${item.prizesWonCount} פרסים!`}
              </Text>
            </View>
          )}
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
      </View>
    </View>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <View style={S.cardOuterShell}>
    <View style={[S.cardLift, cardDepthStyle(false, false)]}>
    <View style={S.card}>

      {/* mirrors cardTop — row-reverse: name+grade on right, points on left */}
      <View style={S.cardTop}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1 }}>
          <Skeleton width={52} height={52} style={{ borderRadius: 26 }} />
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

  const centreContent = isDesktop ? S.centreContent : undefined;

  return (
    <SafeAreaView style={S.screen} edges={['top', 'left', 'right']}>

      {/* ── Header (full-bleed bar, like teacher) ── */}
      <View style={S.headerBar}>
        <View style={[S.headerInner, centreContent]}>
          <View style={S.headerText}>
            <Text style={S.headerTitle} accessibilityRole="header">
              {settings?.school_name ?? t('appName')}
            </Text>
            {settings?.current_year ? (
              <Text style={S.headerSub}>שנת לימודים {settings.current_year}</Text>
            ) : null}
          </View>
          <View style={S.trophyBox}>
            <Trophy size={22} color={Colors.primaryDark} />
          </View>
        </View>
      </View>

      {/* ── Hero (full-bleed yellow strip) ── */}
      <View style={S.hero}>
        <View style={[S.heroInner, centreContent]}>
          <View style={[S.blob, { width: 130, height: 130, top: -45, right: -35 }]} />
          <View style={[S.blob, { width: 80, height: 80, bottom: -30, left: -20, opacity: 0.12 }]} />
          <View style={[S.blob, { width: 52, height: 52, top: 16, left: 50, opacity: 0.10 }]} />
          <View style={[S.blob, { width: 38, height: 38, bottom: 18, right: 90, opacity: 0.14 }]} />
          <Text style={S.heroTitle}>✨ תפסתי אותך בטוב</Text>
          <Text style={S.heroSub}>ביחד אוספים פונפונים ומגיעים למטרה 🎉</Text>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <View style={[S.page, centreContent]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={S.listContent}
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
      </View>

      {/* ── Staff login — full-bleed footer strip ── */}
      <TouchableOpacity
        onPress={() => router.push('/auth/login')}
        accessibilityRole="link"
        accessibilityLabel="כניסה לצוות בית הספר"
        style={[S.staffLink, webPtr]}
      >
        <LogIn size={12} color={Colors.outline} />
        <Text style={S.staffLinkText}>כניסה לצוות בית הספר</Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  page: { flex: 1, backgroundColor: Colors.bg },
  centreContent: {
    maxWidth: MAX_CONTENT_W,
    alignSelf: 'center',
    width: '100%',
  } as any,

  // Header — matches teacher screen
  headerBar: {
    backgroundColor: Colors.card,
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
  headerText: { flex: 1, alignItems: 'flex-end' },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryDark,
    textAlign: 'right',
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
  } as any,
  headerSub: {
    color: Colors.muted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 1,
    writingDirection: 'rtl',
  } as any,
  trophyBox: {
    width: 44,
    height: 44,
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...buttonDepthStatic(3),
  },

  // Hero — full-bleed strip; text constrained via heroInner
  hero: {
    backgroundColor: Colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(120,89,0,0.12)',
    overflow: 'hidden',
  },
  heroInner: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'flex-end',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  heroSub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'right',
    marginTop: 6,
    writingDirection: 'rtl',
  } as any,

  // List
  listContent: { padding: 16, paddingBottom: 32 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 18,
  } as any,

  // Card — static shell catches hover; inner layer lifts + shadow
  cardOuterShell: {
    marginBottom: 14,
    paddingBottom: 6,
  },
  cardLift: {
    borderRadius: 20,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  cardTopLeft: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap',
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
  cardTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardPoints: { color: Colors.muted, fontSize: 14, fontWeight: '600' } as any,
  goalBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primarySurface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  goalBadgeText: { color: Colors.accent, fontSize: 12, fontWeight: '700' } as any,
  prizesWonBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  prizesWonBadgeText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
    writingDirection: 'rtl',
    textAlign: 'right',
  } as any,

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
    color: Colors.outline, fontSize: 12, textAlign: 'right', writingDirection: 'rtl',
  } as any,

  // Students
  studentsWrap: {
    padding: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  noStudentsRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 8, gap: 6,
  },
  noStudentsText: { color: Colors.outline, fontSize: 13, writingDirection: 'rtl' } as any,
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
  pillBadgeText: { color: Colors.primaryDark, fontSize: 11, fontWeight: '700' } as any,
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
    color: Colors.muted, fontSize: 15, fontWeight: '700',
    textAlign: 'center', writingDirection: 'rtl', fontFamily: 'Baloo2_700Bold',
  } as any,

  // Error
  errorCard: {
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger, fontSize: 14, textAlign: 'center', writingDirection: 'rtl',
  } as any,

  // Staff link — fixed bottom
  staffLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  staffLinkText: { color: Colors.muted, fontSize: 13, writingDirection: 'rtl' } as any,
});
