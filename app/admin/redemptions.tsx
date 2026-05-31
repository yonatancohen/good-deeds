import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Trophy, Gift as GiftIcon, ChevronRight, Plus, Trash2, AlertTriangle, Check } from 'lucide-react-native';
import { confirmAction } from '@/lib/confirm';
import { Colors, TactileIconBtn, AddBtn } from '@/components/ui';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';
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
import AdminSheet from '@/components/AdminSheet';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { safeBack } from '@/lib/navigation';
import { useSettings } from '@/hooks/useSettings';
import type { Tables } from '@/types/supabase';
import moment from 'moment';
import 'moment/locale/he';

import { HEBREW_ROW } from '@/lib/rtlLayout';
moment.locale('he');

type ClassRow = Tables<'classes'>;
type Gift = Tables<'gifts'>;
type RedemptionRound = Tables<'redemption_rounds'> & {
  classes?: ClassRow | null;
  gifts?: Gift | null;
};

const S = StyleSheet.create({
  infoBanner: {
    flexDirection: HEBREW_ROW,
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
  redemptionRow: {
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9',
  },
  redemptionTop: { flexDirection: HEBREW_ROW, alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  redemptionClass: { fontSize: 15, fontWeight: '700', color: Colors.text, writingDirection: 'rtl' } as any,
  redemptionDate: { color: '#94a3b8', fontSize: 12 } as any,
  redemptionGift: { color: '#64748b', fontSize: 13, textAlign: 'right', marginBottom: 4, writingDirection: 'rtl' } as any,
  redemptionGiftName: { fontWeight: '600', color: '#334155' },
  redemptionNote: { color: '#94a3b8', fontSize: 12, textAlign: 'right', writingDirection: 'rtl' } as any,
  redemptionTime: { color: '#cbd5e1', fontSize: 11, textAlign: 'right', marginTop: 4, writingDirection: 'rtl' } as any,
  addBtn: {
    backgroundColor: Colors.success, borderRadius: 12, height: 44,
    paddingHorizontal: 16, flexDirection: HEBREW_ROW, alignItems: 'center', gap: 6,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 } as any,
  sectionLabel: {
    color: '#334155', fontWeight: '600', fontSize: 14, textAlign: 'right', marginBottom: 4, writingDirection: 'rtl',
  } as any,
  sectionHint: {
    color: '#94a3b8', fontSize: 12, textAlign: 'right', marginBottom: 8, writingDirection: 'rtl',
  } as any,
  pillRow: {
    flexDirection: HEBREW_ROW, flexWrap: 'wrap', gap: 8, marginBottom: 16,
  },
  noGiftsBanner: {
    flexDirection: HEBREW_ROW, alignItems: 'center', gap: 10,
    backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FCD34D',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  noGiftsText: {
    flex: 1, color: '#92400E', fontSize: 13, textAlign: 'right', writingDirection: 'rtl',
  } as any,
  pill: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 2, minHeight: 44, justifyContent: 'center',
  },
  pillActiveClass:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillActiveGift:    { backgroundColor: Colors.success, borderColor: Colors.success },
  pillInactive:      { backgroundColor: '#fff', borderColor: Colors.border },
  pillTextActive:    { color: '#fff', fontWeight: '600', fontSize: 14 } as any,
  pillTextInactive:  { color: '#334155', fontWeight: '600', fontSize: 14 } as any,
  pillNone:          { backgroundColor: Colors.muted, borderColor: Colors.muted },
  noteInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: Colors.text, fontSize: 14, textAlign: 'right', marginBottom: 20, writingDirection: 'rtl',
  } as any,
  saveActive:   { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.primary },
  saveDisabled: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: Colors.surfaceDim },
  yearHeader: {
    fontSize: 13, fontWeight: '700', color: Colors.primary,
    textAlign: 'right', writingDirection: 'rtl',
    marginBottom: 4, marginTop: 8, paddingHorizontal: 4,
    fontFamily: 'Baloo2_700Bold',
  } as any,
  yearCount: {
    fontSize: 11, color: '#94a3b8', textAlign: 'right', writingDirection: 'rtl',
    paddingHorizontal: 4, marginBottom: 8,
  } as any,
  filterRow: {
    flexDirection: HEBREW_ROW, flexWrap: 'wrap', gap: 8, marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipInactive: { backgroundColor: '#fff', borderColor: Colors.border },
  filterChipText: { fontSize: 13, fontWeight: '600', writingDirection: 'rtl' } as any,
  statusBadge: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
  },
  statusFulfilled: { backgroundColor: '#D1FAE5' },
  statusPending: { backgroundColor: '#FFEDD5' },
  statusText: { fontSize: 11, fontWeight: '700', writingDirection: 'rtl' } as any,
  fulfillRow: {
    flexDirection: HEBREW_ROW, alignItems: 'center', gap: 8, marginTop: 10,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  fulfillBtn: {
    flexDirection: HEBREW_ROW, alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.bg,
  },
  fulfillBtnDone: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  fulfillBtnText: { fontSize: 13, fontWeight: '600', color: '#334155', writingDirection: 'rtl' } as any,
});

type FulfillFilter = 'unfulfilled' | 'fulfilled' | 'all';

export default function AdminRedemptionsScreen() {
  const { listPad, pageContent } = useAdminLayout();
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSettings();
  const currentYear = settings?.current_year ?? '';

  const [classes, setClasses]         = useState<ClassRow[]>([]);
  const [gifts, setGifts]             = useState<Gift[]>([]);
  const [redemptions, setRedemptions] = useState<RedemptionRound[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedGiftId,  setSelectedGiftId]  = useState<string | null>(null);
  const [note, setNote]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [fulfillFilter, setFulfillFilter] = useState<FulfillFilter>('unfulfilled');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Classes available in the picker: current year only (deleted_at filtered at DB level)
  const pickerClasses = useMemo(() =>
    classes
      .filter(c => currentYear ? c.year === currentYear : true)
      .sort((a, b) => a.name.localeCompare(b.name)),
    [classes, currentYear],
  );

  const filteredRedemptions = useMemo(() => {
    if (fulfillFilter === 'all') return redemptions;
    if (fulfillFilter === 'fulfilled') return redemptions.filter((r) => r.fulfilled);
    return redemptions.filter((r) => !r.fulfilled);
  }, [redemptions, fulfillFilter]);

  // Redemptions grouped by class year (insertion order = newest first due to DESC sort)
  const groupedRedemptions = useMemo(() => {
    const map = new Map<string, RedemptionRound[]>();
    for (const r of filteredRedemptions) {
      const year = r.classes?.year ?? 'ללא שנה';
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(r);
    }
    return Array.from(map.entries());
  }, [filteredRedemptions]);

  async function handleToggleFulfilled(r: RedemptionRound) {
    if (!user) return;
    setTogglingId(r.id);
    const nextFulfilled = !r.fulfilled;
    const { error } = await supabase
      .from('redemption_rounds')
      .update({
        fulfilled: nextFulfilled,
        fulfilled_at: nextFulfilled ? new Date().toISOString() : null,
        fulfilled_by: nextFulfilled ? user.id : null,
      })
      .eq('id', r.id);
    setTogglingId(null);
    if (error) Alert.alert('שגיאה', error.message);
    else loadData();
  }

  const loadData = useCallback(async () => {
    const [classesRes, giftsRes, redemptionsRes] = await Promise.all([
      supabase.from('classes').select('*').is('deleted_at', null).order('name'),
      supabase.from('gifts').select('*').eq('is_active', true).is('deleted_at', null).order('name'),
      supabase.from('redemption_rounds').select('*, classes(*), gifts(*)').order('redeemed_at', { ascending: false }).limit(200),
    ]);

    if (!classesRes.error) setClasses(classesRes.data ?? []);
    if (!giftsRes.error)   setGifts(giftsRes.data ?? []);
    if (!redemptionsRes.error) setRedemptions((redemptionsRes.data ?? []) as RedemptionRound[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function handleDelete(r: RedemptionRound) {
    const label = r.classes?.name ? `כיתה ${r.classes.name}` : 'רישום זה';
    confirmAction(
      'מחיקת רישום מתנה',
      `למחוק את הרישום של ${label}?\nהנקודות שנצברו לפני הרישום יחזרו לכיתה.`,
      async () => {
        setDeletingId(r.id);
        const { error } = await supabase.from('redemption_rounds').delete().eq('id', r.id);
        setDeletingId(null);
        if (error) Alert.alert('שגיאה', error.message);
        else loadData();
      },
      'מחק',
    );
  }

  async function handleSave() {
    if (!selectedClassId || !user) { Alert.alert('שגיאה', 'יש לבחור כיתה'); return; }
    if (!selectedGiftId) { Alert.alert('שגיאה', 'יש לבחור מתנה'); return; }
    setSaving(true);

    const { error } = await supabase.from('redemption_rounds').insert({
      class_id: selectedClassId,
      gift_id: selectedGiftId || null,
      note: note.trim() || null,
      marked_by: user.id,
    });

    setSaving(false);
    if (error) {
      Alert.alert('שגיאה', error.message);
    } else {
      setModalVisible(false);
      setSelectedClassId(null);
      setSelectedGiftId(null);
      setNote('');
      loadData();
    }
  }

  return (
    <SafeAreaView style={AS.screen}>
      <View style={AS.header}>
        <View style={[AS.headerInner, pageContent]}>
          <View style={AS.headerLeft}>
            <TactileIconBtn onPress={() => safeBack(router, '/admin')} style={AS.backBtn} accessibilityLabel="חזרה">
              <ChevronRight size={20} color={Colors.primaryDark} />
            </TactileIconBtn>
            <Text style={AS.headerTitle} accessibilityRole="header">{t('redemptions')}</Text>
          </View>
          <AddBtn onPress={() => setModalVisible(true)} accessibilityLabel="רשום מתנה לכיתה" />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} accessibilityLabel="טוען" />
      ) : (
        <ScrollView style={AS.list} contentContainerStyle={listPad}>
          <View style={pageContent}>
            <View style={S.infoBanner}>
              <View style={S.infoIcon}>
                <Trophy size={18} color={Colors.success} />
              </View>
              <Text style={S.infoBannerText}>
                כשכיתה מגיעה למטרה ובוחרת מתנה — לחץ "רשום מתנה".{'\n'}
                הנקודות של הכיתה יתאפסו אוטומטית. סמן "מומש" כשהפרס נמסר בפועל.
              </Text>
            </View>

            <View style={S.filterRow}>
              {([
                ['unfulfilled', 'שטרם מומשו'],
                ['fulfilled', 'מומשו'],
                ['all', 'הכל'],
              ] as const).map(([key, label]) => {
                const active = fulfillFilter === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setFulfillFilter(key)}
                    style={[S.filterChip, active ? S.filterChipActive : S.filterChipInactive, webPointer]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={label}
                  >
                    <Text style={[S.filterChipText, { color: active ? '#fff' : '#334155' }]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {filteredRedemptions.length === 0 ? (
              <View style={AS.emptyWrap}>
                <View style={[AS.emptyIcon, { backgroundColor: '#FFEDD5' }]}><Trophy size={28} color={Colors.accent} /></View>
                <Text style={AS.emptyTitle}>
                  {redemptions.length === 0 ? 'אין מתנות לכיתה עדיין' : 'אין רשומות בפילטר זה'}
                </Text>
                <Text style={AS.emptyHint}>
                  {redemptions.length === 0 ? 'לחץ על "+ הוספה" כדי להוסיף.' : 'נסה פילטר אחר.'}
                </Text>
              </View>
            ) : (
              groupedRedemptions.map(([year, rows]) => (
                <View key={year}>
                  {/* Year section header */}
                  <Text style={S.yearHeader}>{year}</Text>
                  <Text style={S.yearCount}>{rows.length} {rows.length === 1 ? 'רישום' : 'רישומים'}</Text>

                  {rows.map((r) => (
                    <View
                      key={r.id}
                      style={S.redemptionRow}
                      accessibilityLabel={`מתנה לכיתה ${r.classes?.name ?? ''}, ${moment(r.redeemed_at).format('DD/MM/YY')}`}
                    >
                      <View style={S.redemptionTop}>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <Text style={S.redemptionClass}>כיתה {r.classes?.name ?? '—'}</Text>
                          <View style={[S.statusBadge, r.fulfilled ? S.statusFulfilled : S.statusPending, { marginTop: 6 }]}>
                            <Text style={[S.statusText, { color: r.fulfilled ? '#065f46' : '#9A3412' }]}>
                              {r.fulfilled ? 'מומש' : 'ממתין'}
                            </Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: HEBREW_ROW, alignItems: 'center', gap: 8 }}>
                          <Text style={S.redemptionDate}>{moment(r.redeemed_at).format('DD/MM/YYYY')}</Text>
                          <TouchableOpacity
                            onPress={() => handleDelete(r)}
                            disabled={deletingId === r.id}
                            accessibilityRole="button"
                            accessibilityLabel="מחק רישום"
                            style={[AS.iconBtnDanger, { width: 34, height: 34, borderRadius: 10 }, webPointer]}
                          >
                            {deletingId === r.id
                              ? <ActivityIndicator size="small" color="#ef4444" />
                              : <Trash2 size={15} color="#ef4444" />}
                          </TouchableOpacity>
                        </View>
                      </View>
                      {r.gifts && (
                        <Text style={S.redemptionGift}>
                          מתנה: <Text style={S.redemptionGiftName}>{r.gifts.name}</Text>
                        </Text>
                      )}
                      {r.note && <Text style={S.redemptionNote}>{r.note}</Text>}
                      <Text style={S.redemptionTime}>{moment(r.redeemed_at).fromNow()}</Text>
                      <View style={S.fulfillRow}>
                        <TouchableOpacity
                          onPress={() => handleToggleFulfilled(r)}
                          disabled={togglingId === r.id}
                          style={[S.fulfillBtn, r.fulfilled && S.fulfillBtnDone, webPointer]}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: r.fulfilled }}
                          accessibilityLabel={r.fulfilled ? 'בטל סימון מומש' : 'סמן כמומש'}
                        >
                          {togglingId === r.id ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                          ) : (
                            <>
                              <View style={{
                                width: 18, height: 18, borderRadius: 4, borderWidth: 2,
                                borderColor: r.fulfilled ? Colors.success : '#cbd5e1',
                                backgroundColor: r.fulfilled ? Colors.success : 'transparent',
                                alignItems: 'center', justifyContent: 'center',
                              }}>
                                {r.fulfilled && <Check size={12} color="#fff" />}
                              </View>
                              <Text style={S.fulfillBtnText}>
                                {r.fulfilled ? 'מומש — לחץ לביטול' : 'סמן כמומש'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <AdminSheet visible={modalVisible} onClose={() => setModalVisible(false)}>
            <Text style={AS.sheetTitle} accessibilityRole="header">רשום מתנה לכיתה</Text>

            {/* Class picker */}
            <Text style={S.sectionLabel}>כיתה</Text>
            <Text style={S.sectionHint}>
              {currentYear ? `כיתות שנת ${currentYear} (לא מחוקות)` : 'בחר את הכיתה שהגיעה למטרה'}
            </Text>
            {pickerClasses.length === 0 ? (
              <TouchableOpacity
                style={[S.noGiftsBanner, webPointer]}
                onPress={() => { setModalVisible(false); router.push('/admin/classes' as any); }}
                accessibilityRole="link"
                accessibilityLabel="עבור לדף כיתות"
              >
                <AlertTriangle size={18} color="#D97706" />
                <Text style={S.noGiftsText}>
                  אין כיתות מוגדרות. לחץ להוסיף כיתה בדף{' '}
                  <Text style={{ fontWeight: '700', textDecorationLine: 'underline' }}>כיתות</Text>
                  .
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={S.pillRow}>
                {pickerClasses.map((cls) => {
                  const active = selectedClassId === cls.id;
                  return (
                    <TouchableOpacity
                      key={cls.id}
                      onPress={() => setSelectedClassId(cls.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`כיתה ${cls.name}`}
                      style={[S.pill, active ? S.pillActiveClass : S.pillInactive, webPointer]}
                    >
                      <Text style={active ? S.pillTextActive : S.pillTextInactive}>{cls.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Gift picker */}
            <Text style={S.sectionLabel}>מתנה</Text>
            <Text style={S.sectionHint}>המתנה שהכיתה בחרה</Text>
            {gifts.length === 0 ? (
              <TouchableOpacity
                style={[S.noGiftsBanner, webPointer]}
                onPress={() => { setModalVisible(false); router.push('/admin/gifts' as any); }}
                accessibilityRole="link"
                accessibilityLabel="עבור לדף מתנות לכיתה"
              >
                <AlertTriangle size={18} color="#D97706" />
                <Text style={S.noGiftsText}>
                  אין מתנות פעילות. לחץ להוסיף מתנה בדף{' '}
                  <Text style={{ fontWeight: '700', textDecorationLine: 'underline' }}>מתנות לכיתה</Text>
                  .
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={S.pillRow}>
                {gifts.map((gift) => {
                  const active = selectedGiftId === gift.id;
                  return (
                    <TouchableOpacity
                      key={gift.id}
                      onPress={() => setSelectedGiftId(gift.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      accessibilityLabel={`מתנה: ${gift.name}`}
                      style={[S.pill, active ? S.pillActiveGift : S.pillInactive, webPointer]}
                    >
                      <Text style={active ? S.pillTextActive : S.pillTextInactive}>{gift.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Note */}
            <Text style={S.sectionLabel}>הערה (אופציונלי)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="לדוגמה: אכלנו פיצה ביחד ב-15.01"
              placeholderTextColor="#94a3b8"
              textAlign="right"
              multiline
              numberOfLines={2}
              style={S.noteInput}
              accessibilityLabel="הערה על המתנה"
            />

            <View style={AS.sheetBtns}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!selectedClassId || !selectedGiftId || saving}
                style={[(!selectedClassId || !selectedGiftId || saving) ? S.saveDisabled : S.saveActive, webPointer]}
                accessibilityRole="button"
                accessibilityLabel="רשום מתנה"
                accessibilityState={{ disabled: !selectedClassId || !selectedGiftId || saving }}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={AS.saveBtnText}>רשום מתנה</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[AS.cancelBtn, webPointer]} accessibilityRole="button" accessibilityLabel="ביטול">
                <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
      </AdminSheet>
    </SafeAreaView>
  );
}
