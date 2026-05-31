import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  Trophy, Users, ChevronDown, Star, LogIn, Sparkles, PartyPopper,
} from 'lucide-react-native';
import '@/lib/i18n';
import { usePublicData, ClassWithProgress, StudentWithCredits } from '@/hooks/usePublicData';
import { Skeleton, Colors } from '@/components/ui';
import { DepthShell } from '@/lib/DepthShell';
import { useBreakpoint, desktopContentStyle, desktopRowCenter } from '@/lib/responsive';
import { shadow } from '@/lib/shadow';
import { getClassColorScheme } from '@/lib/classColors';
import { PompomJar, POMPOM_JAR_SM } from '@/components/PomPomJar';
import { StaggeredItem } from '@/components/StaggeredItem';

const webPtr = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};

const EXPAND_ENTER = FadeInDown.springify().damping(20).stiffness(280);
const EXPAND_EXIT = FadeOut.duration(220);

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
  const chevronRotation = useSharedValue(0);
  const pct = item.goal > 0 ? Math.round((item.total / item.goal) * 100) : 0;
  const scheme = getClassColorScheme(item.class.grade || item.class.name);

  useEffect(() => {
    chevronRotation.value = withSpring(open ? 180 : 0, { damping: 18, stiffness: 220 });
  }, [open]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

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
    <DepthShell
      depth={5}
      borderRadius={20}
      pressed={pressed}
      hovered={hovered}
      outerStyle={S.cardOuterShell}
      {...hoverProps}
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
          <Animated.View style={chevronStyle}>
            <ChevronDown size={16} color={Colors.muted} />
          </Animated.View>
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
        <Animated.View
          entering={EXPAND_ENTER}
          exiting={EXPAND_EXIT}
          style={S.studentsWrap}
        >
          {item.students.length === 0 ? (
            <View style={S.noStudentsRow}>
              <Users size={15} color={Colors.muted} />
              <Text style={S.noStudentsText}>אין תלמידים עדיין</Text>
            </View>
          ) : (
            <View style={S.pillGrid}>
              {item.students.map((s, index) => (
                <StaggeredItem key={s.id} index={index}>
                  <StudentPill s={s} />
                </StaggeredItem>
              ))}
            </View>
          )}
        </Animated.View>
      )}
      </View>
    </DepthShell>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <DepthShell depth={5} borderRadius={20} outerStyle={S.cardOuterShell}>
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
          <Skeleton width={POMPOM_JAR_SM.lidW} height={POMPOM_JAR_SM.lidH} style={{ borderRadius: 3 }} />
          <Skeleton width={POMPOM_JAR_SM.jarW} height={POMPOM_JAR_SM.jarH} style={{ borderRadius: 6 }} />
          <Skeleton width={18} height={11} />
        </View>
      </View>

    </View>
    </DepthShell>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function PublicScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, settings, loading, error } = usePublicData();
  const { isDesktop } = useBreakpoint();

  const contentCol = desktopContentStyle(isDesktop);
  const rowCenter = desktopRowCenter(isDesktop);
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={S.screen} edges={['top', 'left', 'right']}>

      {/* ── Header (full-bleed bar, like teacher) ── */}
      <View style={[S.headerBar, rowCenter]}>
        <View style={[S.headerInner, contentCol]}>
          <View style={S.headerText}>
            <Text style={S.headerTitle} accessibilityRole="header">
              {settings?.school_name ?? t('appName')}
            </Text>
            {settings?.current_year ? (
              <Text style={S.headerSub}>שנת לימודים {settings.current_year}</Text>
            ) : null}
          </View>
          <DepthShell depth={3} borderRadius={14} flat>
            <View style={S.trophyBox}>
              <Trophy size={22} color={Colors.primaryDark} />
            </View>
          </DepthShell>
        </View>
      </View>

      {/* ── Hero (full-bleed yellow strip) ── */}
      <View style={[S.hero, rowCenter]}>
        <View style={[S.heroInner, contentCol, isDesktop && S.heroInnerDesktop]}>
          <View style={[S.blob, { width: 130, height: 130, top: -45, right: -35 }]} />
          <View style={[S.blob, { width: 80, height: 80, bottom: -30, left: -20, opacity: 0.12 }]} />
          <View style={[S.blob, { width: 52, height: 52, top: 16, left: 50, opacity: 0.10 }]} />
          <View style={[S.blob, { width: 38, height: 38, bottom: 18, right: 90, opacity: 0.14 }]} />
          <View style={S.heroTitleRow}>
            <Text style={[S.heroTitle, isDesktop && S.heroTitleDesktop]}>תפסתי אותך בטוב</Text>
            <Sparkles size={isDesktop ? 24 : 20} color={Colors.primaryDark} />
          </View>
          <View style={S.heroSubRow}>
            <Text style={S.heroSub}>ביחד אוספים פונפונים ומגיעים למטרה</Text>
            <PartyPopper size={16} color={Colors.accent} />
          </View>
        </View>
      </View>

      {/* ── Scrollable content + footer (footer pinned to bottom when list is short) ── */}
      <ScrollView
        style={[S.pageScroll, contentCol, rowCenter]}
        contentContainerStyle={S.scrollBody}
        showsVerticalScrollIndicator={false}
      >
        <View style={[S.listContent, isDesktop ? S.grid : undefined]}>
          {loading && Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}

          {!loading && error && (
            <View style={[S.errorCard, isDesktop && S.gridFullSpan]}>
              <Text style={S.errorText}>{error}</Text>
            </View>
          )}

          {!loading && !error && data.length === 0 && (
            <View style={[S.empty, isDesktop && S.gridFullSpan]}>
              <View style={S.emptyIcon}>
                <Star size={26} color={Colors.muted} />
              </View>
              <Text style={S.emptyText}>{t('noClasses')}</Text>
            </View>
          )}

          {!loading && !error && data.map((item, index) => (
            <StaggeredItem key={item.class.id} index={index}>
              <ClassCard item={item} />
            </StaggeredItem>
          ))}
        </View>

        <View style={S.scrollSpacer} />

        <TouchableOpacity
          onPress={() => router.push('/auth/login')}
          accessibilityRole="link"
          accessibilityLabel="כניסה לצוות בית הספר"
          style={[S.staffLink, webPtr, { paddingBottom: 18 + insets.bottom }]}
        >
          <LogIn size={12} color={Colors.outline} />
          <Text style={S.staffLinkText}>כניסה לצוות בית הספר</Text>
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  pageScroll: { flex: 1, backgroundColor: Colors.bg },
  scrollBody: { flexGrow: 1 },
  scrollSpacer: { flexGrow: 1, minHeight: 0 },

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
    paddingHorizontal: 16,
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
    paddingTop: 14,
    paddingBottom: 14,
    alignItems: 'flex-end',
    position: 'relative',
  },
  heroInnerDesktop: {
    paddingTop: 22,
    paddingBottom: 24,
  },
  heroTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  heroSubRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  heroTitleDesktop: {
    fontSize: 26,
  } as any,
  heroSub: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,

  // List
  listContent: { padding: 16, paddingBottom: 0 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 18,
    direction: 'rtl',
  } as any,
  gridFullSpan: {
    gridColumn: '1 / -1',
  } as any,

  // Card
  cardOuterShell: {
    marginBottom: 14,
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

  // Staff link — sits below cards; scrolls with content when list is long
  staffLink: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  staffLinkText: { color: Colors.muted, fontSize: 13, writingDirection: 'rtl' } as any,
});
