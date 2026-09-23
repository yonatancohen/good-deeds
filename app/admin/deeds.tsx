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
import { BookOpen, Pencil, Trash2, Plus, ChevronRight, Sparkles } from 'lucide-react-native';
import { Colors, TactileIconBtn, AddBtn } from '@/components/ui';
import { DismissiblePromoBanner } from '@/components/DismissiblePromoBanner';
import { StaggeredItem } from '@/components/StaggeredItem';
import { PROMO_IDS } from '@/lib/promoDismiss';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { confirmAction } from '@/lib/confirm';
import { safeBack } from '@/lib/navigation';
import { shadow } from '@/lib/shadow';
import type { Tables } from '@/types/supabase';

import { HEBREW_ROW, RTL_CHILD_ROW } from '@/lib/rtlLayout';
type Deed = Tables<'deeds'>;

type DeedScheme = {
  bg: string;
  text: string;
  sub: string;
  bubble: string;
  icon: string;
  thumbOn: string;
};

const DEED_SCHEME_ACTIVE: DeedScheme = {
  bg: '#fff',
  text: Colors.text,
  sub: Colors.muted,
  bubble: Colors.surface,
  icon: Colors.primaryLight,
  thumbOn: Colors.success,
};

const INACTIVE_SCHEME: DeedScheme = {
  bg: '#fff',
  text: Colors.muted,
  sub: '#94a3b8',
  bubble: Colors.surface,
  icon: Colors.surface,
  thumbOn: Colors.primaryDark,
};

function schemeForAmount(_amount: number, isActive: boolean): DeedScheme {
  return isActive ? DEED_SCHEME_ACTIVE : INACTIVE_SCHEME;
}

function compareDeeds(a: Deed, b: Deed): number {
  if (a.amount !== b.amount) return a.amount - b.amount;
  return a.name.localeCompare(b.name, 'he');
}

const GRID_GAP = 12;

function DeedCube({
  deed,
  scheme,
  isDesktop,
  cubeWidth,
  onEdit,
  onDelete,
  onToggle,
}: {
  deed: Deed;
  scheme: DeedScheme;
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
          !deed.is_active && S.cubeInactive,
          isDesktop && S.cubeDesktop,
        ]}
        accessibilityLabel={`מעשה: ${deed.name}, ערך ${deed.amount}, ${deed.is_active ? 'פעיל' : 'לא פעיל'}`}
      >
        <View style={S.cubeTop}>
          <View style={[S.sparkleBubble, { backgroundColor: scheme.icon }]}>
            <Sparkles size={14} color={scheme.text} />
          </View>
          <View style={S.cubeActions}>
            <TactileIconBtn
              onPress={onEdit}
              depth={0}
              flat
              style={[S.cubeActionBtn, { backgroundColor: scheme.bubble }]}
              shadowColor="transparent"
              accessibilityLabel={`ערוך ${deed.name}`}
            >
              <Pencil size={14} color={scheme.text} />
            </TactileIconBtn>
            <TactileIconBtn
              onPress={onDelete}
              depth={0}
              flat
              style={[
                S.cubeActionBtn,
                deed.is_active ? S.cubeActionDanger : S.cubeActionDangerMuted,
              ]}
              shadowColor="transparent"
              accessibilityLabel={`מחק ${deed.name}`}
            >
              <Trash2 size={14} color={Colors.danger} />
            </TactileIconBtn>
          </View>
        </View>
        <View style={S.cubeBody}>
          <Text style={[S.pointsText, { color: scheme.text }]}>+{deed.amount}</Text>
          <Text style={[S.cubeName, { color: scheme.text }]} numberOfLines={3}>
            {deed.name}
          </Text>
        </View>
        <View style={[S.cubeFooter, { backgroundColor: scheme.bubble }]}>
          <Text style={[S.cubeStatus, { color: scheme.sub }]}>
            {deed.is_active ? 'פעיל' : 'מושבת'}
          </Text>
          <PrimarySwitch
            variant={deed.is_active ? 'onColor' : 'default'}
            thumbOnColor={scheme.thumbOn}
            value={deed.is_active}
            onValueChange={onToggle}
            accessibilityLabel={`${deed.is_active ? 'השבת' : 'הפעל'} ${deed.name}`}
            accessibilityState={{ checked: deed.is_active }}
          />
        </View>
      </View>
    </View>
  );
}

export default function AdminDeedsScreen() {
  const { listPad, pageContent, pagePadX, isDesktop, contentMaxW, isLarge } = useAdminLayout();
  const { width: screenWidth } = useWindowDimensions();
  const { t } = useTranslation();
  const router = useRouter();
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDeed, setEditingDeed] = useState<Deed | null>(null);
  const [name, setName]     = useState('');
  const [amount, setAmount] = useState('1');
  const [saving, setSaving] = useState(false);

  const cols = useMemo(() => {
    if (isLarge) return 3;
    if (isDesktop) return 3;
    return 2;
  }, [isLarge, isDesktop]);

  const listPadX = pagePadX * 2;
  const contentWidth = Math.min(screenWidth - listPadX, contentMaxW);
  const cubeWidth = Math.floor((contentWidth - GRID_GAP * (cols - 1)) / cols);

  const gridStyle = useMemo(
    () =>
      Platform.OS === 'web'
        ? ({
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: GRID_GAP,
            width: '100%',
            writingDirection: 'rtl',
          } as object)
        : {
            flexDirection: HEBREW_ROW,
            flexWrap: 'wrap',
            gap: GRID_GAP,
            width: '100%',
            alignContent: 'flex-start',
          },
    [cols],
  );

  const sortedDeeds = useMemo(
    () => [...deeds].sort(compareDeeds),
    [deeds],
  );

  const loadDeeds = useCallback(async () => {
    const { data, error } = await supabase
      .from('deeds')
      .select('*')
      .is('deleted_at', null);
    if (!error) setDeeds(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadDeeds(); }, [loadDeeds]);

  function openAdd()  { setEditingDeed(null); setName(''); setAmount('1'); setModalVisible(true); }
  function openEdit(deed: Deed) { setEditingDeed(deed); setName(deed.name); setAmount(String(deed.amount)); setModalVisible(true); }

  function closeDeedModal() {
    setModalVisible(false);
    setEditingDeed(null);
    setName('');
    setAmount('1');
  }

  async function handleSave() {
    const amountNum = parseInt(amount, 10);
    if (!name.trim()) { Alert.alert('שגיאה', 'שם המעשה הוא שדה חובה'); return; }
    if (isNaN(amountNum) || amountNum < 1 || amountNum > 10) { Alert.alert('שגיאה', 'הערך חייב להיות בין 1 ל-10'); return; }

    setSaving(true);
    let error: { message: string } | null = null;
    if (editingDeed) {
      ({ error } = await supabase.from('deeds').update({ name: name.trim(), amount: amountNum }).eq('id', editingDeed.id));
    } else {
      ({ error } = await supabase.from('deeds').insert({ name: name.trim(), amount: amountNum, is_active: true }));
    }
    setSaving(false);
    if (error) Alert.alert('שגיאה', error.message);
    else {
      closeDeedModal();
      loadDeeds();
    }
  }

  async function handleToggleActive(deed: Deed) {
    setDeeds(prev => prev.map(d => d.id === deed.id ? { ...d, is_active: !d.is_active } : d));
    const { error } = await supabase.from('deeds').update({ is_active: !deed.is_active }).eq('id', deed.id);
    if (error) {
      setDeeds(prev => prev.map(d => d.id === deed.id ? { ...d, is_active: deed.is_active } : d));
      Alert.alert('שגיאה', error.message);
    }
  }

  async function handleDelete(deed: Deed) {
    confirmAction(
      t('areYouSure'),
      `למחוק את המעשה "${deed.name}"?`,
      async () => {
        const { error } = await supabase
          .from('deeds')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', deed.id);
        if (error) Alert.alert('שגיאה', error.message);
        else loadDeeds();
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
            <Text style={AS.headerTitle} accessibilityRole="header">{t('deeds')}</Text>
          </View>
          <AddBtn onPress={openAdd} accessibilityLabel="הוסף מעשה חדש" />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} accessibilityLabel="טוען" />
      ) : (
        <ScrollView style={AS.list} contentContainerStyle={listPad}>
          <View style={pageContent}>
            <DismissiblePromoBanner
              promoId={PROMO_IDS.adminDeeds}
              variant="accent"
              icon={<Sparkles size={18} color={Colors.accent} />}
            >
              {`מעשים טובים הם הפעולות שהמורה בוחר כשנותן נקודות.\nכל מעשה מקבל ערך 1–10. ניתן להשבית ללא מחיקה.`}
            </DismissiblePromoBanner>

            {deeds.length === 0 ? (
              <View style={AS.emptyWrap}>
                <View style={[AS.emptyIcon, { backgroundColor: '#FEF3C7' }]}><BookOpen size={28} color="#D97706" /></View>
                <Text style={AS.emptyTitle}>אין מעשים טובים עדיין</Text>
                <Text style={AS.emptyHint}>לחץ על "+ הוספה" כדי להוסיף.</Text>
              </View>
            ) : (
              <View style={[S.grid, gridStyle]}>
                {sortedDeeds.map((deed, index) => (
                  <StaggeredItem key={deed.id} index={index}>
                    <DeedCube
                      deed={deed}
                      scheme={schemeForAmount(deed.amount, deed.is_active)}
                      isDesktop={isDesktop}
                      cubeWidth={cubeWidth}
                      onEdit={() => openEdit(deed)}
                      onDelete={() => handleDelete(deed)}
                      onToggle={() => handleToggleActive(deed)}
                    />
                  </StaggeredItem>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <AdminSheet visible={modalVisible} onClose={closeDeedModal}>
        <Text style={AS.sheetTitle} accessibilityRole="header">
          {editingDeed ? `ערוך: ${editingDeed.name}` : t('addDeed')}
        </Text>

        <Text style={AS.fieldLabel}>{t('deedName')}</Text>
        <Text style={AS.fieldHint}>{t('deedNameHint')}</Text>
        <TextInput value={name} onChangeText={setName} placeholder="עזרה לחבר" placeholderTextColor="#94a3b8" textAlign="right" style={AS.input} accessibilityLabel="שם המעשה" />

        <Text style={AS.fieldLabel}>{t('deedAmount')}</Text>
        <Text style={AS.fieldHint}>{t('deedAmountHint')}</Text>
        <View style={S.amtPickerWrap}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const active = amount === String(n);
            return (
              <TouchableOpacity
                key={n}
                onPress={() => setAmount(String(n))}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`ערך ${n}`}
                style={[S.amtBtn, active ? S.amtBtnActive : S.amtBtnInactive, webPointer]}
              >
                <Text style={[S.amtBtnText, active ? S.amtBtnTextActive : S.amtBtnTextInactive]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={AS.sheetBtns}>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[saving ? AS.saveBtnDisabled : AS.saveBtn, webPointer]} accessibilityRole="button" accessibilityLabel="שמור">
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={AS.saveBtnText}>{t('save')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={closeDeedModal} style={[AS.cancelBtn, webPointer]} accessibilityRole="button" accessibilityLabel="ביטול">
            <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </AdminSheet>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  grid: { width: '100%' },

  cube: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    minHeight: 168,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,197,171,0.4)',
    ...shadow('#785900', 0, 8, 0.05, 12),
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
    flexDirection: RTL_CHILD_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    zIndex: 1,
  },
  sparkleBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubeActions: { flexDirection: RTL_CHILD_ROW, gap: 6 },
  cubeActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cubeActionDanger: {
    backgroundColor: '#fff',
    borderColor: 'rgba(186,26,26,0.15)',
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
  pointsText: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
    lineHeight: 38,
    color: Colors.primaryDark,
  } as any,
  cubeName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 24,
    marginTop: 4,
  } as any,

  cubeFooter: {
    flexDirection: HEBREW_ROW,
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

  amtPickerWrap: { flexDirection: HEBREW_ROW, flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  amtBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  amtBtnActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  amtBtnInactive: { backgroundColor: '#fff', borderColor: Colors.border },
  amtBtnText: { fontWeight: '700', fontSize: 15 } as any,
  amtBtnTextActive:   { color: Colors.primaryDark },
  amtBtnTextInactive: { color: '#334155' },
});
