import React, { useCallback, useState, useEffect, useRef, useLayoutEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Platform, StyleSheet, Image, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Building2, UserCheck, BookOpen, Gift, Trophy,
  Settings, Globe, LogOut, Users, ChevronLeft,
  GraduationCap, ClipboardList, Star, School,
  AlertCircle, Plus,
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
import { cardDepthStyle, buttonDepthStatic } from '@/lib/cardDepth';
import { confirmAction } from '@/lib/confirm';
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

type ActivityItem = {
  id: string;
  created_at: string;
  text: string;
  sub?: string;
  tone: 'primary' | 'secondary' | 'success';
};

interface MenuTile {
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  description: string;
  route: string;
  iconBg: string;
  iconColor: string;
}

const MENU: MenuTile[] = [
  { Icon: Building2,     label: 'כיתות',        description: 'הוספה, עריכה ומחיקה של כיתות',             route: '/admin/classes',     iconBg: Colors.secondary, iconColor: '#ffffff' },
  { Icon: GraduationCap, label: 'כיתות ותלמידים', description: 'צפייה, הוספה ומחיקה של תלמידים לפי כיתה', route: '/admin/students',    iconBg: '#6366F1',        iconColor: '#ffffff' },
  { Icon: UserCheck,     label: 'מורים',         description: 'ניהול מורים והזמנת מורים חדשים',             route: '/admin/teachers',    iconBg: Colors.salmon,    iconColor: '#ffffff' },
  { Icon: BookOpen,      label: 'מעשים טובים',  description: 'ניהול רשימת המעשים הטובים ושוויהם',          route: '/admin/deeds',       iconBg: Colors.accent,    iconColor: '#ffffff' },
  { Icon: Gift,          label: 'פרסים',         description: 'ניהול רשימת הפרסים שכיתה יכולה לזכות בהם',   route: '/admin/gifts',       iconBg: Colors.success,   iconColor: '#ffffff' },
  { Icon: Trophy,        label: 'מתנות לכיתה',   description: 'רישום מתנה לכיתה שהגיעה למטרה',               route: '/admin/redemptions', iconBg: Colors.primary,   iconColor: '#ffffff' },
  { Icon: ClipboardList, label: 'יומן זיכויים', description: 'צפייה, עריכה ומחיקה של כל הזיכויים',          route: '/admin/credit-log',  iconBg: '#0EA5E9',        iconColor: '#ffffff' },
  { Icon: Settings,      label: 'הגדרות',        description: 'שם בית הספר, שנת לימודים ומטרת נקודות',      route: '/admin/settings',    iconBg: Colors.peach,     iconColor: Colors.primaryDark },
];

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};

function MenuTileCard({
  tile,
  onPress,
  style,
}: {
  tile: MenuTile;
  onPress: () => void;
  style?: object;
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const liftY = pressed ? 4 : hovered ? -4 : 0;
  const { Icon } = tile;

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
    <View style={[S.tileOuter, style]} {...hoverProps}>
      <View
        style={[
          S.tileLift,
          cardDepthStyle(pressed, hovered),
          { transform: [{ translateY: liftY }] },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={() => setPressed(true)}
          onPressOut={() => setPressed(false)}
          activeOpacity={1}
          style={[S.tile, pointer]}
          accessibilityRole="button"
          accessibilityLabel={`${tile.label} — ${tile.description}`}
        >
          <View style={[S.tileIconCircle, { backgroundColor: tile.iconBg }]}>
            <Icon size={24} color={tile.iconColor} />
          </View>
          <Text style={S.tileTitle}>{tile.label}</Text>
          <Text style={S.tileDesc} numberOfLines={2}>
            {tile.description}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PendingRedemptionCard({
  item,
  onMarkFulfilled,
  fulfilling,
}: {
  item: PendingRedemption;
  onMarkFulfilled: () => void;
  fulfilling: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const liftY = hovered ? -4 : 0;

  const hoverProps =
    Platform.OS === 'web'
      ? ({
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
        } as const)
      : {};

  return (
    <View style={S.pendingOuter} {...hoverProps}>
      <View
        style={[
          S.tileLift,
          cardDepthStyle(false, hovered),
          { transform: [{ translateY: liftY }] },
        ]}
      >
        <View style={S.pendingTile}>
          <View style={[S.tileIconCircle, S.pendingIconCircle, { backgroundColor: Colors.primary }]}>
            <Trophy size={24} color="#ffffff" />
          </View>
          <View style={S.pendingTileText}>
            <Text style={S.pendingTitle} numberOfLines={1}>
              כיתה {item.classes?.name ?? '—'} — {item.gifts?.name ?? 'מתנה'}
            </Text>
            <Text style={S.pendingSub} numberOfLines={1}>
              {item.note
                ? item.note
                : `נרשם ${moment(item.redeemed_at).format('DD/MM/YY')}`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onMarkFulfilled}
            disabled={fulfilling}
            style={[S.fulfillBtn, pointer]}
            accessibilityRole="button"
            accessibilityLabel="סמן כמומש"
          >
            {fulfilling ? (
              <ActivityIndicator size="small" color={Colors.primaryDark} />
            ) : (
              <Text style={S.fulfillBtnText}>סמן כמומש</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function PendingEmptyCard() {
  return (
    <View style={S.pendingOuter}>
      <View style={[S.tileLift, cardDepthStyle(false, false)]}>
        <View style={S.pendingTile}>
          <View style={[S.tileIconCircle, S.pendingIconCircle, { backgroundColor: Colors.surfaceDim }]}>
            <Trophy size={24} color={Colors.muted} />
          </View>
          <View style={S.pendingTileText}>
            <Text style={S.pendingTitle}>אין מתנות למימוש</Text>
            <Text style={S.pendingSub}>כשכיתה תירשם לפרס — תופיע כאן</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const ACTIVITY_DOT: Record<ActivityItem['tone'], string> = {
  primary: Colors.primary,
  secondary: Colors.secondary,
  success: Colors.success,
};

const ACTIVITY_ICON_BG: Record<ActivityItem['tone'], string> = {
  primary: Colors.primaryLight,
  secondary: Colors.secondarySurface,
  success: Colors.successSurface,
};

export default function AdminHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings, refresh } = useSettings();
  const { isDesktop, isLarge, width } = useBreakpoint();

  const [pendingRedemptions, setPendingRedemptions] = useState<PendingRedemption[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [activeClasses, setActiveClasses] = useState(0);
  const [todayPoints, setTodayPoints] = useState(0);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [splitHeight, setSplitHeight] = useState(0);
  const mainColumnRef = useRef<View>(null);

  const syncSplitHeight = useCallback((height?: number) => {
    if (height != null && height > 0) {
      setSplitHeight(Math.round(height));
      return;
    }
    mainColumnRef.current?.measure((_x, _y, _w, h) => {
      const next = Math.round(h);
      if (next > 0) setSplitHeight(next);
    });
  }, []);

  const menuCols = isDesktop ? 4 : 2;
  const contentMaxW = isLarge ? 1200 : 960;

  const loadDashboard = useCallback(async () => {
    setPendingLoading(true);
    setStatsLoading(true);

    const dayStart = moment().startOf('day').toISOString();
    const dayEnd = moment().endOf('day').toISOString();

    const settingsRes = await supabase
      .from('settings')
      .select('current_year')
      .limit(1)
      .maybeSingle();
    const schoolYear = settingsRes.data?.current_year ?? null;

    let classesQuery = supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);
    if (schoolYear) classesQuery = classesQuery.eq('year', schoolYear);

    const [
      pendingRes,
      classesRes,
      studentCreditsRes,
      classCreditsRes,
      activityStudentRes,
      activityClassRes,
    ] = await Promise.all([
      supabase
        .from('redemption_rounds')
        .select('id, redeemed_at, note, classes(*), gifts(*)')
        .eq('fulfilled', false)
        .order('redeemed_at', { ascending: false })
        .limit(50),
      classesQuery,
      supabase
        .from('credit_events')
        .select('amount')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd),
      supabase
        .from('class_credit_events')
        .select('amount')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd),
      supabase
        .from('credit_events')
        .select('id, amount, note, created_at, students(first_name, last_name, classes(name))')
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('class_credit_events')
        .select('id, amount, note, created_at, classes(name)')
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    if (!pendingRes.error) {
      const rows = (pendingRes.data ?? []) as PendingRedemption[];
      setPendingRedemptions(rows.filter((r) => r.classes && !r.classes.deleted_at));
    }
    setPendingLoading(false);

    if (classesRes.error) {
      console.error('classes count:', classesRes.error.message);
      setActiveClasses(0);
    } else {
      setActiveClasses(classesRes.count ?? 0);
    }

    if (studentCreditsRes.error || classCreditsRes.error) {
      console.error(
        'today points:',
        studentCreditsRes.error?.message ?? classCreditsRes.error?.message,
      );
      setTodayPoints(0);
    } else {
      const studentPts = (studentCreditsRes.data ?? []).reduce((s, e) => s + e.amount, 0);
      const classPts = (classCreditsRes.data ?? []).reduce((s, e) => s + e.amount, 0);
      setTodayPoints(studentPts + classPts);
    }

    const feed: ActivityItem[] = [];

    if (!activityStudentRes.error) {
      for (const e of activityStudentRes.data ?? []) {
        const student = e.students as { first_name: string; last_name: string; classes: { name: string } | null } | null;
        const name = student ? `${student.first_name} ${student.last_name}` : 'תלמיד';
        const cls = student?.classes?.name;
        feed.push({
          id: `s-${e.id}`,
          created_at: e.created_at,
          text: `${name} קיבל/ה ${e.amount} נקודות`,
          sub: e.note ?? (cls ? `כיתה ${cls}` : undefined),
          tone: 'success',
        });
      }
    }

    if (!activityClassRes.error) {
      for (const e of activityClassRes.data ?? []) {
        const cls = e.classes as { name: string } | null;
        feed.push({
          id: `c-${e.id}`,
          created_at: e.created_at,
          text: `כיתה ${cls?.name ?? '—'} קיבלה ${e.amount} נקודות`,
          sub: e.note ?? undefined,
          tone: 'secondary',
        });
      }
    }

    feed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setActivity(feed.slice(0, 8));
    setStatsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      loadDashboard();
    }, [loadDashboard]),
  );

  useEffect(() => {
    const channel = supabase
      .channel(`admin-dashboard-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_events' }, loadDashboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_credit_events' }, loadDashboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, loadDashboard)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemption_rounds' }, loadDashboard)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  useLayoutEffect(() => {
    if (!isLarge) return;
    syncSplitHeight();
    const t = setTimeout(syncSplitHeight, 50);
    return () => clearTimeout(t);
  }, [isLarge, pendingLoading, statsLoading, pendingRedemptions.length, syncSplitHeight]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  }

  function handleMarkFulfilled(r: PendingRedemption) {
    if (!user) return;
    const className = r.classes?.name ?? '—';
    const giftName = r.gifts?.name ?? 'מתנה';
    confirmAction(
      'סימון כמומש',
      `האם לסמן את "${giftName}" לכיתה ${className} כמומש?`,
      async () => {
        setFulfillingId(r.id);
        const { error } = await supabase
          .from('redemption_rounds')
          .update({
            fulfilled: true,
            fulfilled_at: new Date().toISOString(),
            fulfilled_by: user.id,
          })
          .eq('id', r.id);
        setFulfillingId(null);
        if (error) Alert.alert('שגיאה', error.message);
        else loadDashboard();
      },
      'סמן כמומש',
    );
  }

  const menuRows = Array.from(
    { length: Math.ceil(MENU.length / menuCols) },
    (_, i) => MENU.slice(i * menuCols, i * menuCols + menuCols),
  );

  const tileWidth = isDesktop
    ? (contentMaxW - 48 - (menuCols - 1) * 16) / menuCols
    : (width - 40 - 16) / 2;

  function renderStats() {
    return (
      <View style={[S.statsRow, isLarge && S.statsRowDesktop]}>
        <View style={[S.statCard, S.statCardPrimary]}>
          <Star size={isDesktop ? 36 : 32} color={Colors.primaryDark} />
          {statsLoading ? (
            <ActivityIndicator size="small" color={Colors.primaryDark} style={{ marginVertical: 8 }} />
          ) : (
            <Text style={S.statValue}>{todayPoints.toLocaleString('he-IL')}</Text>
          )}
          <Text style={S.statLabel}>נקודות היום</Text>
        </View>
        <View style={[S.statCard, S.statCardSecondary]}>
          <School size={isDesktop ? 36 : 32} color="#003e73" />
          {statsLoading ? (
            <ActivityIndicator size="small" color="#003e73" style={{ marginVertical: 8 }} />
          ) : (
            <Text style={[S.statValue, { color: '#003e73' }]}>{activeClasses}</Text>
          )}
          <Text style={[S.statLabel, { color: '#003e73' }]}>כיתות פעילות</Text>
        </View>
      </View>
    );
  }

  function renderPending(compact?: boolean) {
    return (
      <View style={[S.section, compact && S.sectionCompact]}>
        <View style={S.sectionHeader}>
          <View style={S.sectionTitleRow}>
            <AlertCircle size={20} color={Colors.success} />
            <Text style={S.sectionTitle}>פעולות ממתינות</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/admin/redemptions' as any)}
            style={[S.sectionLink, pointer]}
            accessibilityRole="link"
            accessibilityLabel="פתח את כל המתנות לכיתה"
          >
            <Text style={S.sectionLinkText}>הכל</Text>
            <ChevronLeft size={14} color={Colors.primaryDark} />
          </TouchableOpacity>
        </View>

        {pendingLoading ? (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={{ marginVertical: 16 }}
            accessibilityLabel="טוען מתנות ממתינות"
          />
        ) : pendingRedemptions.length === 0 ? (
          <PendingEmptyCard />
        ) : (
          <View style={S.pendingList}>
            {pendingRedemptions.slice(0, isDesktop ? 3 : 5).map((r) => (
              <PendingRedemptionCard
                key={r.id}
                item={r}
                fulfilling={fulfillingId === r.id}
                onMarkFulfilled={() => handleMarkFulfilled(r)}
              />
            ))}
          </View>
        )}
      </View>
    );
  }

  function renderMenuGrid(compact?: boolean) {
    return (
      <View style={[S.section, compact && S.sectionLast]}>
        <Text style={[S.sectionTitle, S.sectionTitleStandalone]}>ניהול מערכת</Text>
        <View style={[S.grid, isDesktop && { gap: 18 }]}>
          {menuRows.map((row, i) => (
            <View key={i} style={[S.gridRow, isDesktop && { gap: 18 }]}>
              {row.map((tile) => (
                <MenuTileCard
                  key={tile.route}
                  tile={tile}
                  onPress={() => router.push(tile.route as any)}
                  style={[
                    { flex: 1, minWidth: 0 },
                    !compact && { width: tileWidth, flex: undefined },
                  ]}
                />
              ))}
              {row.length < menuCols &&
                Array.from({ length: menuCols - row.length }).map((_, j) => (
                  <View key={`pad-${j}`} style={{ flex: 1 }} />
                ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  function renderActivityTimeline() {
    return (
      <View style={S.activityTimeline}>
        {activity.map((item, idx) => (
          <View key={item.id} style={S.timelineRow}>
            <View style={S.timelineRail}>
              <View style={[S.timelineDot, { backgroundColor: ACTIVITY_ICON_BG[item.tone] }]}>
                <Plus size={14} color={ACTIVITY_DOT[item.tone]} />
              </View>
              {idx < activity.length - 1 && <View style={S.timelineLine} />}
            </View>
            <View style={S.timelineContent}>
              <Text style={S.timelineText}>{item.text}</Text>
              {item.sub ? <Text style={S.timelineSub}>{item.sub}</Text> : null}
              <Text style={S.timelineTime}>{moment(item.created_at).fromNow()}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  }

  function renderActivityLog(sidebar?: boolean) {
    return (
      <View style={[S.activityPanel, sidebar && S.activityPanelSidebar]}>
        <View style={S.activityHeader}>
          <Text style={S.activityTitle}>יומן פעילות</Text>
          <TouchableOpacity
            onPress={() => router.push('/admin/credit-log' as any)}
            style={pointer}
            accessibilityRole="link"
            accessibilityLabel="פתח את יומן הזיכויים המלא"
          >
            <Text style={S.activityLink}>ראה הכל</Text>
          </TouchableOpacity>
        </View>

        {statsLoading ? (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 24 }} />
        ) : activity.length === 0 ? (
          <Text style={S.activityEmpty}>אין פעילות להצגה עדיין</Text>
        ) : sidebar ? (
          <ScrollView
            style={S.activityTimelineScroll}
            contentContainerStyle={S.activityTimelineScrollContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {renderActivityTimeline()}
          </ScrollView>
        ) : (
          <View style={S.activityList}>
            {activity.map((item) => (
              <View key={item.id} style={S.activityRow}>
                <View style={[S.activityDot, { backgroundColor: ACTIVITY_DOT[item.tone] }]} />
                <Text style={S.activityTime}>{moment(item.created_at).format('HH:mm')}</Text>
                <Text style={S.activityText} numberOfLines={2}>{item.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  }

  function renderPublicLink() {
    return (
      <TouchableOpacity
        onPress={() => router.push('/')}
        style={[S.publicLink, pointer]}
        accessibilityRole="link"
        accessibilityLabel="צפה בדף הציבורי"
      >
        <View style={S.publicIconWrap}>
          <Globe size={22} color={Colors.secondary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.publicTitle}>צפה בדף הציבורי</Text>
          <Text style={S.publicSub}>כך רואים ההורים והתלמידים את לוח ההצלחות</Text>
        </View>
        <ChevronLeft size={18} color={Colors.muted} />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={S.screen} edges={['top']}>

      {/* ── Header ── */}
      <View style={S.headerBar}>
        <View style={[S.headerInner, { maxWidth: contentMaxW }]}>
          <View style={S.headerBrand}>
            <View style={S.headerAvatarWrap}>
              <Image
                source={require('@/assets/icon.png')}
                style={S.headerAvatar}
                resizeMode="cover"
                accessibilityLabel="תמונת בית הספר"
              />
            </View>
            <View>
              <Text style={S.headerSchool} numberOfLines={1}>
                {settings?.school_name ?? 'תפסתי אותך בטוב'}
              </Text>
              {settings?.current_year && (
                <Text style={S.headerYear}>שנת לימודים {settings.current_year}</Text>
              )}
            </View>
          </View>

          <View style={S.headerActions}>
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
              style={[S.headerIconBtn, pointer]}
              accessibilityRole="button"
              accessibilityLabel="התנתק"
            >
              <LogOut size={18} color={Colors.primaryDark} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          S.scrollBody,
          isDesktop && S.scrollBodyDesktop,
          { maxWidth: contentMaxW, alignSelf: 'center', width: '100%' },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[S.pageTitle, isDesktop && S.pageTitleDesktop]} accessibilityRole="header">
          לוח בקרה מנהלי
        </Text>
        {!isDesktop && user?.display_name && (
          <Text style={S.pageGreeting}>שלום, {user.display_name}</Text>
        )}

        {renderStats()}

        {isLarge ? (
          <>
            <View style={S.desktopSplit}>
              <View
                ref={mainColumnRef}
                style={S.desktopMain}
                onLayout={(e) => syncSplitHeight(e.nativeEvent.layout.height)}
              >
                {renderPending(true)}
                {renderMenuGrid(true)}
              </View>
              <View style={[S.desktopSidebar, splitHeight > 0 && { height: splitHeight }]}>
                {renderActivityLog(true)}
              </View>
            </View>
            {renderPublicLink()}
          </>
        ) : (
          <>
            {renderPending()}
            {renderMenuGrid()}
            {renderActivityLog()}
            {renderPublicLink()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },

  // ── Header ──
  headerBar: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...shadow('#000', 1, 4, 0.06, 2),
  },
  headerInner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignSelf: 'center',
    width: '100%',
  },
  headerBrand: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    overflow: 'hidden',
  },
  headerAvatar: { width: '100%', height: '100%' },
  headerSchool: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
    textAlign: 'right',
  } as any,
  headerYear: {
    fontSize: 12,
    color: Colors.muted,
    writingDirection: 'rtl',
    textAlign: 'right',
  } as any,
  headerActions: { flexDirection: 'row-reverse', gap: 8 },
  headerBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    ...buttonDepthStatic(3),
  },
  headerBtnText: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
  } as any,
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...buttonDepthStatic(3),
  },

  // ── Scroll body ──
  scrollBody: { paddingHorizontal: 20, paddingBottom: 32 },
  scrollBodyDesktop: { paddingHorizontal: 32, paddingBottom: 48 },

  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
    textAlign: 'right',
    marginTop: 20,
    marginBottom: 4,
  } as any,
  pageTitleDesktop: { fontSize: 32, marginTop: 28 },
  pageGreeting: {
    fontSize: 14,
    color: Colors.muted,
    writingDirection: 'rtl',
    textAlign: 'right',
    marginBottom: 16,
  } as any,

  // ── Stats ──
  statsRow: {
    flexDirection: 'row-reverse',
    gap: 14,
    marginTop: 16,
    marginBottom: 28,
  },
  statsRowDesktop: { gap: 24, marginBottom: 36 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...shadow('#000', 2, 8, 0.08, 4),
  },
  statCardPrimary: { backgroundColor: Colors.primary },
  statCardSecondary: { backgroundColor: Colors.secondaryLight },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold',
    marginTop: 6,
  } as any,
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
    opacity: 0.85,
    writingDirection: 'rtl',
    marginTop: 2,
  } as any,

  // ── Sections ──
  section: { marginBottom: 28 },
  sectionCompact: { marginBottom: 20 },
  sectionLast: { marginBottom: 0 },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
  } as any,
  sectionTitleStandalone: {
    marginBottom: 14,
    textAlign: 'right',
    color: Colors.primaryDark,
  },
  sectionLink: { flexDirection: 'row-reverse', alignItems: 'center', gap: 2 },
  sectionLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryDark,
    writingDirection: 'rtl',
  } as any,

  // ── Pending redemption cards (menu-tile style) ──
  pendingList: { gap: 14 },
  pendingOuter: {
    paddingBottom: 6,
  },
  pendingTile: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
    minHeight: 88,
  },
  pendingIconCircle: {
    marginBottom: 0,
    flexShrink: 0,
  },
  pendingTileText: {
    flex: 1,
    minWidth: 0,
  },
  pendingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'Baloo2_700Bold',
  } as any,
  pendingSub: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  } as any,
  fulfillBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 40,
    paddingHorizontal: 14,
    minWidth: 108,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...buttonDepthStatic(3),
  },
  fulfillBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    writingDirection: 'rtl',
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'center',
    lineHeight: 18,
    ...(Platform.OS === 'android' ? ({ includeFontPadding: false, textAlignVertical: 'center' } as any) : {}),
  } as any,

  // ── Menu grid (public-page card style) ──
  grid: { gap: 16 },
  gridRow: { flexDirection: 'row-reverse', gap: 16, alignItems: 'stretch' },
  tileOuter: {
    marginBottom: 4,
    paddingBottom: 6,
    alignSelf: 'stretch',
  },
  tileLift: {
    borderRadius: 20,
    flex: 1,
  },
  tile: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    overflow: 'hidden',
    height: 172,
  },
  tileIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    ...shadow('#785900', 3, 8, 0.22, 4),
  },
  tileTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
    textAlign: 'center',
    marginBottom: 6,
  } as any,
  tileDesc: {
    fontSize: 12,
    color: Colors.muted,
    writingDirection: 'rtl',
    textAlign: 'center',
    lineHeight: 16,
    height: 32,
  } as any,

  // ── Activity log ──
  activityPanel: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'column',
    overflow: 'hidden',
    ...shadow('#785900', 0, 8, 0.05, 4),
  },
  activityPanelSidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    marginBottom: 0,
  },
  activityHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
  } as any,
  activityLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.secondary,
    writingDirection: 'rtl',
  } as any,
  activityEmpty: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
    paddingVertical: 24,
    writingDirection: 'rtl',
  } as any,
  activityList: {
    backgroundColor: '#faf2ec',
    borderRadius: 16,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212,197,171,0.35)',
  },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityTime: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.muted,
    minWidth: 36,
    writingDirection: 'rtl',
  } as any,
  activityText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,

  // Timeline (desktop sidebar)
  activityTimelineScroll: { flex: 1, minHeight: 0 },
  activityTimelineScrollContent: { flexGrow: 1 },
  activityTimeline: { gap: 0 },
  timelineRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  timelineRail: {
    alignItems: 'center',
    width: 40,
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.surfaceDim,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'Baloo2_700Bold',
  } as any,
  timelineSub: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  } as any,
  timelineTime: {
    fontSize: 11,
    color: Colors.outline,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 4,
  } as any,

  // ── Desktop split ──
  desktopSplit: {
    flexDirection: 'row-reverse',
    gap: 28,
    alignItems: 'flex-start',
  },
  desktopMain: { flex: 2, minWidth: 0 },
  desktopSidebar: {
    flex: 1,
    minWidth: 280,
    position: 'relative',
    overflow: 'hidden',
  },

  // ── Public link ──
  publicLink: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(120,89,0,0.25)',
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  publicIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.secondarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publicTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
    textAlign: 'right',
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
  } as any,
  publicSub: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  } as any,
});
