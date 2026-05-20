import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import PrimarySwitch from '@/components/PrimarySwitch';
import AdminSheet from '@/components/AdminSheet';
import { Gift as GiftIcon, Pencil, Trash2, Plus, ChevronRight } from 'lucide-react-native';
import { Colors, TactileIconBtn, AddBtn } from '@/components/ui';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { confirmAction } from '@/lib/confirm';
import { safeBack } from '@/lib/navigation';
import { useBreakpoint } from '@/lib/responsive';
import { shadow } from '@/lib/shadow';
import type { Tables } from '@/types/supabase';

type Gift = Tables<'gifts'>;

type GiftScheme = {
  bg: string;
  text: string;
  sub: string;
  bubble: string;
  icon: string;
  thumbOn: string;
};

const GIFT_SCHEME_ACTIVE: GiftScheme = {
  bg: '#6BC99A',
  text: '#ffffff',
  sub: 'rgba(255,255,255,0.88)',
  bubble: 'rgba(255,255,255,0.38)',
  icon: 'rgba(255,255,255,0.28)',
  thumbOn: Colors.success,
};

const GIFT_SCHEME_INACTIVE: GiftScheme = {
  bg: '#fff',
  text: Colors.muted,
  sub: '#94a3b8',
  bubble: Colors.surface,
  icon: Colors.surface,
  thumbOn: Colors.primaryDark,
};

function schemeForGift(isActive: boolean): GiftScheme {
  return isActive ? GIFT_SCHEME_ACTIVE : GIFT_SCHEME_INACTIVE;
}

const GRID_GAP = 12;
const GRID_MAX_W = 960;

function GiftCube({
  gift,
  scheme,
  isDesktop,
  cubeWidth,
  onEdit,
  onDelete,
  onToggle,
}: {
  gift: Gift;
  scheme: GiftScheme;
  isDesktop: boolean;
  cubeWidth?: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const itemStyle =
    Platform.OS !== 'web' && cubeWidth != null
      ? { width: cubeWidth, flexGrow: 0, flexShrink: 0 }
      : undefined;

  return (
    <View style={itemStyle}>
      <View
        style={[
          S.cube,
          { backgroundColor: scheme.bg },
          !gift.is_active && S.cubeInactive,
          isDesktop && S.cubeDesktop,
        ]}
        accessibilityLabel={`פרס: ${gift.name}, ${gift.is_active ? 'פעיל' : 'לא פעיל'}`}
      >
        <View style={S.cubeTop}>
          <View style={[S.iconBubble, { backgroundColor: scheme.icon }]}>
            <GiftIcon size={14} color={scheme.text} />
          </View>
          <View style={S.cubeActions}>
            <TactileIconBtn
              onPress={onEdit}
              depth={1}
              style={[S.cubeActionBtn, { backgroundColor: scheme.bubble }]}
              shadowColor="transparent"
              accessibilityLabel={`ערוך ${gift.name}`}
            >
              <Pencil size={14} color={scheme.text} />
            </TactileIconBtn>
            <TactileIconBtn
              onPress={onDelete}
              depth={1}
              style={[
                S.cubeActionBtn,
                gift.is_active ? S.cubeActionDanger : S.cubeActionDangerMuted,
              ]}
              shadowColor={
                gift.is_active ? 'rgba(186,26,26,0.12)' : 'rgba(186,26,26,0.15)'
              }
              accessibilityLabel={`מחק ${gift.name}`}
            >
              <Trash2 size={14} color={Colors.danger} />
            </TactileIconBtn>
          </View>
        </View>

        <View style={S.cubeBody}>
          <Text style={[S.cubeName, { color: scheme.text }]} numberOfLines={3}>
            {gift.name}
          </Text>
          {gift.description ? (
            <Text style={[S.cubeDesc, { color: scheme.sub }]} numberOfLines={2}>
              {gift.description}
            </Text>
          ) : null}
        </View>

        <View style={[S.cubeFooter, { backgroundColor: scheme.bubble }]}>
          <PrimarySwitch
            variant={gift.is_active ? 'onColor' : 'default'}
            thumbOnColor={scheme.thumbOn}
            value={gift.is_active}
            onValueChange={onToggle}
            accessibilityLabel={`${gift.is_active ? 'השבת' : 'הפעל'} ${gift.name}`}
            accessibilityState={{ checked: gift.is_active }}
          />
          <Text style={[S.cubeStatus, { color: scheme.sub }]}>
            {gift.is_active ? 'פעיל' : 'מושבת'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function AdminGiftsScreen() {
  const { listPad, pageContent, pagePadX, isDesktop } = useAdminLayout();
  const { isLarge } = useBreakpoint();
  const { width: screenWidth } = useWindowDimensions();
  const { t } = useTranslation();
  const router = useRouter();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const cols = useMemo(() => {
    if (isLarge) return 3;
    if (isDesktop) return 3;
    return 2;
  }, [isLarge, isDesktop]);

  const listPadX = pagePadX * 2;
  const contentWidth = Math.min(screenWidth - listPadX, GRID_MAX_W);
  const cubeWidth = Math.floor((contentWidth - GRID_GAP * (cols - 1)) / cols);

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
        : {
            flexDirection: 'row-reverse',
            flexWrap: 'wrap',
            gap: GRID_GAP,
            width: '100%',
            alignContent: 'flex-start',
          },
    [cols],
  );

  const sortedGifts = useMemo(
    () => [...gifts].sort((a, b) => a.name.localeCompare(b.name, 'he')),
    [gifts],
  );

  const loadGifts = useCallback(async () => {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .is('deleted_at', null);
    if (!error) setGifts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadGifts(); }, [loadGifts]);

  function openAdd() { setEditingGift(null); setName(''); setDescription(''); setModalVisible(true); }
  function openEdit(gift: Gift) { setEditingGift(gift); setName(gift.name); setDescription(gift.description ?? ''); setModalVisible(true); }

  async function handleSave() {
    if (!name.trim()) { Alert.alert('שגיאה', 'שם הפרס הוא שדה חובה'); return; }
    setSaving(true);
    if (editingGift) {
      const { error } = await supabase.from('gifts')
        .update({ name: name.trim(), description: description.trim() || null })
        .eq('id', editingGift.id);
      if (error) Alert.alert('שגיאה', error.message);
    } else {
      const { error } = await supabase.from('gifts')
        .insert({ name: name.trim(), description: description.trim() || null, is_active: true });
      if (error) Alert.alert('שגיאה', error.message);
    }
    setSaving(false);
    setModalVisible(false);
    loadGifts();
  }

  async function handleToggleActive(gift: Gift) {
    setGifts(prev => prev.map(g => g.id === gift.id ? { ...g, is_active: !g.is_active } : g));
    const { error } = await supabase.from('gifts').update({ is_active: !gift.is_active }).eq('id', gift.id);
    if (error) {
      setGifts(prev => prev.map(g => g.id === gift.id ? { ...g, is_active: gift.is_active } : g));
      Alert.alert('שגיאה', error.message);
    }
  }

  async function handleDelete(gift: Gift) {
    confirmAction(
      t('areYouSure'),
      `למחוק את המתנה "${gift.name}"?`,
      async () => {
        const { error } = await supabase
          .from('gifts')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', gift.id);
        if (error) Alert.alert('שגיאה', error.message);
        else loadGifts();
      },
    );
  }

  return (
    <SafeAreaView style={AS.screen}>
      <View style={AS.header}>
        <View style={[AS.headerInner, pageContent]}>
          <View style={AS.headerLeft}>
            <TactileIconBtn onPress={() => safeBack(router, '/admin')} style={AS.backBtn} accessibilityLabel="חזרה">
              <ChevronRight size={20} color={Colors.primaryDark} />
            </TactileIconBtn>
            <Text style={AS.headerTitle} accessibilityRole="header">{t('gifts')}</Text>
          </View>
          <AddBtn onPress={openAdd} accessibilityLabel="הוסף פרס" />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} accessibilityLabel="טוען" />
      ) : (
        <ScrollView style={AS.list} contentContainerStyle={listPad}>
          <View style={pageContent}>
            <View style={S.infoBanner}>
              <View style={S.infoIcon}>
                <GiftIcon size={18} color={Colors.success} />
              </View>
              <Text style={S.infoBannerText}>
                פרסים הם הפרסים שכיתה בוחרת כשמגיעה למטרה.{'\n'}
                המורה בוחר מהרשימה בעת רישום הפרס.
              </Text>
            </View>

            {gifts.length === 0 ? (
              <View style={AS.emptyWrap}>
                <View style={[AS.emptyIcon, { backgroundColor: '#DCFCE7' }]}><GiftIcon size={28} color="#059669" /></View>
                <Text style={AS.emptyTitle}>אין פרסים עדיין</Text>
                <Text style={AS.emptyHint}>לחץ על "+ הוספה" כדי להוסיף.</Text>
              </View>
            ) : (
              <View style={[S.grid, gridStyle]}>
                {sortedGifts.map((gift) => (
                  <GiftCube
                    key={gift.id}
                    gift={gift}
                    scheme={schemeForGift(gift.is_active)}
                    isDesktop={isDesktop}
                    cubeWidth={cubeWidth}
                    onEdit={() => openEdit(gift)}
                    onDelete={() => handleDelete(gift)}
                    onToggle={() => handleToggleActive(gift)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <AdminSheet visible={modalVisible} onClose={() => setModalVisible(false)}>
        <Text style={AS.sheetTitle} accessibilityRole="header">
          {editingGift ? 'ערוך פרס' : 'הוסף פרס'}
        </Text>

        <Text style={AS.fieldLabel}>שם הפרס</Text>
        <Text style={AS.fieldHint}>לדוגמה: פיצה לכיתה, ערב קולנוע</Text>
        <TextInput value={name} onChangeText={setName} placeholder="פיצה לכיתה" placeholderTextColor="#94a3b8" textAlign="right" style={AS.input} accessibilityLabel="שם הפרס" />

        <Text style={AS.fieldLabel}>תיאור (אופציונלי)</Text>
        <Text style={AS.fieldHint}>מידע נוסף על המתנה</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="פיצה אישית לכל תלמיד"
          placeholderTextColor="#94a3b8"
          textAlign="right"
          multiline
          numberOfLines={2}
          style={[AS.input, { marginBottom: 20 }]}
          accessibilityLabel="תיאור המתנה"
        />

        <View style={AS.sheetBtns}>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[saving ? AS.saveBtnDisabled : AS.saveBtn, webPointer]} accessibilityRole="button" accessibilityLabel="שמור">
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={AS.saveBtnText}>{t('save')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={[AS.cancelBtn, webPointer]} accessibilityRole="button" accessibilityLabel="ביטול">
            <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </AdminSheet>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  infoBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.successSurface,
    borderWidth: 1,
    borderColor: Colors.successLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoBannerText: {
    flex: 1,
    color: Colors.success,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,

  grid: { width: '100%' },

  cube: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    minHeight: 168,
    overflow: 'hidden',
    ...shadow('#000', 4, 12, 0.14, 6),
  },
  cubeDesktop: { minHeight: 180 },
  cubeInactive: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    opacity: 0.88,
    ...shadow('#785900', 0, 6, 0.06, 2),
  },

  cubeTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    zIndex: 1,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubeActions: { flexDirection: 'row-reverse', gap: 6 },
  cubeActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  cubeActionDanger: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: 'rgba(255,255,255,0.45)',
  },
  cubeActionDangerMuted: {
    backgroundColor: Colors.dangerLight,
    borderColor: 'rgba(186,26,26,0.12)',
  },

  cubeBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  cubeName: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 26,
  } as any,
  cubeDesc: {
    fontSize: 12,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 17,
    marginTop: 6,
  } as any,

  cubeFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cubeStatus: {
    fontSize: 11,
    fontWeight: '600',
    writingDirection: 'rtl',
  } as any,
});
