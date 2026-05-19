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
} from 'react-native';
import PrimarySwitch from '@/components/PrimarySwitch';
import AdminSheet from '@/components/AdminSheet';
import { BookOpen, Pencil, Trash2, Plus, ChevronRight, Sparkles } from 'lucide-react-native';
import { Colors, TactileIconBtn } from '@/components/ui';
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

type Deed = Tables<'deeds'>;

type DeedScheme = {
  bg: string;
  text: string;
  sub: string;
  bubble: string;
  icon: string;
};

const DEED_SCHEMES: DeedScheme[] = [
  { bg: Colors.primary,    text: Colors.primaryDark, sub: 'rgba(120,89,0,0.65)',    bubble: 'rgba(255,255,255,0.45)', icon: 'rgba(255,255,255,0.22)' },
  { bg: Colors.accent,     text: '#ffffff',          sub: 'rgba(255,255,255,0.72)', bubble: 'rgba(255,255,255,0.28)', icon: 'rgba(255,255,255,0.22)' },
  { bg: Colors.secondary,  text: '#ffffff',          sub: 'rgba(255,255,255,0.72)', bubble: 'rgba(255,255,255,0.28)', icon: 'rgba(255,255,255,0.22)' },
  { bg: Colors.success,    text: '#ffffff',          sub: 'rgba(255,255,255,0.72)', bubble: 'rgba(255,255,255,0.28)', icon: 'rgba(255,255,255,0.22)' },
  { bg: Colors.salmon,     text: '#ffffff',          sub: 'rgba(255,255,255,0.72)', bubble: 'rgba(255,255,255,0.28)', icon: 'rgba(255,255,255,0.22)' },
  { bg: Colors.peach,      text: Colors.primaryDark, sub: 'rgba(120,89,0,0.65)',    bubble: 'rgba(255,255,255,0.45)', icon: 'rgba(255,255,255,0.35)' },
];

const INACTIVE_SCHEME: DeedScheme = {
  bg: '#fff',
  text: Colors.muted,
  sub: '#94a3b8',
  bubble: Colors.surface,
  icon: Colors.surface,
};

function schemeForDeed(deed: Deed, index: number): DeedScheme {
  if (!deed.is_active) return INACTIVE_SCHEME;
  return DEED_SCHEMES[(deed.amount + index) % DEED_SCHEMES.length];
}

function chunkRows<T>(items: T[], cols: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += cols) {
    rows.push(items.slice(i, i + cols));
  }
  return rows;
}

export default function AdminDeedsScreen() {
  const { listPad, pageContent, isDesktop } = useAdminLayout();
  const { isLarge } = useBreakpoint();
  const { t } = useTranslation();
  const router = useRouter();
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDeed, setEditingDeed] = useState<Deed | null>(null);
  const [name, setName]     = useState('');
  const [amount, setAmount] = useState('1');
  const [saving, setSaving] = useState(false);

  const cols = isLarge ? 3 : isDesktop ? 3 : 2;
  const deedRows = useMemo(() => chunkRows(deeds, cols), [deeds, cols]);

  const loadDeeds = useCallback(async () => {
    const { data, error } = await supabase
      .from('deeds')
      .select('*')
      .is('deleted_at', null)
      .order('amount', { ascending: false });
    if (!error) setDeeds(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadDeeds(); }, [loadDeeds]);

  function openAdd()  { setEditingDeed(null); setName(''); setAmount('1'); setModalVisible(true); }
  function openEdit(deed: Deed) { setEditingDeed(deed); setName(deed.name); setAmount(String(deed.amount)); setModalVisible(true); }

  async function handleSave() {
    const amountNum = parseInt(amount, 10);
    if (!name.trim()) { Alert.alert('שגיאה', 'שם המעשה הוא שדה חובה'); return; }
    if (isNaN(amountNum) || amountNum < 1 || amountNum > 10) { Alert.alert('שגיאה', 'הערך חייב להיות בין 1 ל-10'); return; }

    setSaving(true);
    if (editingDeed) {
      const { error } = await supabase.from('deeds').update({ name: name.trim(), amount: amountNum }).eq('id', editingDeed.id);
      if (error) Alert.alert('שגיאה', error.message);
    } else {
      const { error } = await supabase.from('deeds').insert({ name: name.trim(), amount: amountNum, is_active: true });
      if (error) Alert.alert('שגיאה', error.message);
    }
    setSaving(false);
    setModalVisible(false);
    loadDeeds();
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
            <TouchableOpacity onPress={() => safeBack(router, '/admin')} style={[AS.backBtn, webPointer]} accessibilityRole="button" accessibilityLabel="חזרה">
              <ChevronRight size={20} color={Colors.primaryDark} />
            </TouchableOpacity>
            <Text style={AS.headerTitle} accessibilityRole="header">{t('deeds')}</Text>
          </View>
          <TouchableOpacity onPress={openAdd} style={[AS.addBtn, webPointer]} accessibilityRole="button" accessibilityLabel="הוסף מעשה חדש">
            <Plus size={15} color={Colors.primaryDark} />
            <Text style={AS.addBtnText}>הוספה</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} accessibilityLabel="טוען" />
      ) : (
        <ScrollView style={AS.list} contentContainerStyle={listPad}>
          <View style={pageContent}>
            <View style={S.infoBanner}>
              <View style={S.infoIcon}>
                <Sparkles size={18} color={Colors.primaryDark} />
              </View>
              <Text style={S.infoBannerText}>
                מעשים טובים הם הפעולות שהמורה בוחר כשנותן נקודות.{'\n'}
                כל מעשה מקבל ערך 1–10. ניתן להשבית ללא מחיקה.
              </Text>
            </View>

            {deeds.length === 0 ? (
              <View style={AS.emptyWrap}>
                <View style={[AS.emptyIcon, { backgroundColor: '#FEF3C7' }]}><BookOpen size={28} color="#D97706" /></View>
                <Text style={AS.emptyTitle}>אין מעשים טובים עדיין</Text>
                <Text style={AS.emptyHint}>לחץ על "+ הוספה" כדי להוסיף.</Text>
              </View>
            ) : (
              <View style={S.grid}>
                {deedRows.map((row, rowIdx) => (
                  <View key={rowIdx} style={S.gridRow}>
                    {row.map((deed, colIdx) => {
                      const globalIdx = rowIdx * cols + colIdx;
                      const scheme = schemeForDeed(deed, globalIdx);
                      return (
                        <View
                          key={deed.id}
                          style={[
                            S.cube,
                            { backgroundColor: scheme.bg },
                            !deed.is_active && S.cubeInactive,
                            isDesktop && S.cubeDesktop,
                          ]}
                          accessibilityLabel={`מעשה: ${deed.name}, ערך ${deed.amount}, ${deed.is_active ? 'פעיל' : 'לא פעיל'}`}
                        >
                          <View style={[S.cubeDecor, { backgroundColor: scheme.icon }]} />

                          <View style={S.cubeTop}>
                            <View style={[S.sparkleBubble, { backgroundColor: scheme.icon }]}>
                              <Sparkles size={14} color={scheme.text} />
                            </View>
                            <View style={S.cubeActions}>
                              <TactileIconBtn
                                onPress={() => openEdit(deed)}
                                style={[S.cubeActionBtn, { backgroundColor: scheme.bubble }]}
                                shadowColor="transparent"
                                accessibilityLabel={`ערוך ${deed.name}`}
                              >
                                <Pencil size={14} color={scheme.text} />
                              </TactileIconBtn>
                              <TactileIconBtn
                                onPress={() => handleDelete(deed)}
                                style={[S.cubeActionBtn, S.cubeActionDanger]}
                                shadowColor="rgba(186,26,26,0.15)"
                                accessibilityLabel={`מחק ${deed.name}`}
                              >
                                <Trash2 size={14} color={Colors.danger} />
                              </TactileIconBtn>
                            </View>
                          </View>

                          <View style={[S.pointsBubble, { backgroundColor: scheme.bubble }]}>
                            <Text style={[S.pointsText, { color: scheme.text }]}>+{deed.amount}</Text>
                          </View>

                          <Text style={[S.cubeName, { color: scheme.text }]} numberOfLines={2}>
                            {deed.name}
                          </Text>

                          <View style={[S.cubeFooter, { backgroundColor: scheme.bubble }]}>
                            <Text style={[S.cubeStatus, { color: scheme.sub }]}>
                              {deed.is_active ? 'פעיל' : 'מושבת'}
                            </Text>
                            <PrimarySwitch
                              value={deed.is_active}
                              onValueChange={() => handleToggleActive(deed)}
                              accessibilityLabel={`${deed.is_active ? 'השבת' : 'הפעל'} ${deed.name}`}
                              accessibilityState={{ checked: deed.is_active }}
                            />
                          </View>
                        </View>
                      );
                    })}
                    {row.length < cols &&
                      Array.from({ length: cols - row.length }).map((_, i) => (
                        <View key={`pad-${i}`} style={S.cubePad} />
                      ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <AdminSheet visible={modalVisible} onClose={() => setModalVisible(false)}>
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
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoBannerText: {
    flex: 1,
    color: Colors.primaryDark,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,

  grid: { gap: 12 },
  gridRow: { flexDirection: 'row-reverse', gap: 12 },

  cube: {
    flex: 1,
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
  cubePad: { flex: 1 },

  cubeDecor: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 88,
    height: 88,
    borderRadius: 44,
  },

  cubeTop: {
    flexDirection: 'row-reverse',
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
  cubeActions: { flexDirection: 'row-reverse', gap: 6 },
  cubeActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cubeActionDanger: {
    backgroundColor: 'rgba(255,255,255,0.92)',
  },

  pointsBubble: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pointsText: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
  } as any,

  cubeName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 20,
    marginBottom: 10,
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

  amtPickerWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
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
