import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback } from 'react';
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
import { BookOpen, Pencil, Trash2, Plus, ChevronRight } from 'lucide-react-native';
import { Colors, TactileIconBtn } from '@/components/ui';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { confirmAction } from '@/lib/confirm';
import { safeBack } from '@/lib/navigation';
import type { Tables } from '@/types/supabase';

type Deed = Tables<'deeds'>;

const S = StyleSheet.create({
  infoBanner: {
    backgroundColor: Colors.primarySurface, borderWidth: 1, borderColor: Colors.primaryLight,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
  },
  infoBannerText: { color: Colors.primaryDark, fontSize: 13, textAlign: 'right', writingDirection: 'rtl' } as any,
  amtBadgeActive:   { backgroundColor: Colors.primaryLight, width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  amtBadgeInactive: { backgroundColor: Colors.surface,      width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  amtTextActive:   { color: Colors.primary, fontWeight: '700', fontSize: 17 } as any,
  amtTextInactive: { color: '#94a3b8', fontWeight: '700', fontSize: 17 } as any,
  deedName: { fontWeight: '600', fontSize: 15, textAlign: 'right', writingDirection: 'rtl' } as any,
  switchWrap: {
    marginHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  rowDivider: {
    width: 1, height: 28, backgroundColor: '#e2e8f0', marginHorizontal: 4,
  },
  amtPickerWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  amtBtn: {
    width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  amtBtnActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  amtBtnInactive: { backgroundColor: '#fff', borderColor: Colors.border },
  amtBtnText: { fontWeight: '700', fontSize: 15 } as any,
  amtBtnTextActive:   { color: '#fff' },
  amtBtnTextInactive: { color: '#334155' },
});

export default function AdminDeedsScreen() {
  const { listPad, pageContent } = useAdminLayout();
  const { t } = useTranslation();
  const router = useRouter();
  const [deeds, setDeeds] = useState<Deed[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDeed, setEditingDeed] = useState<Deed | null>(null);
  const [name, setName]     = useState('');
  const [amount, setAmount] = useState('1');
  const [saving, setSaving] = useState(false);

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
        <View style={AS.headerLeft}>
          <TouchableOpacity onPress={() => safeBack(router, '/admin')} style={[AS.backBtn, webPointer]} accessibilityRole="button" accessibilityLabel="חזרה">
            <ChevronRight size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={AS.headerTitle} accessibilityRole="header">{t('deeds')}</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={[AS.addBtn, webPointer]} accessibilityRole="button" accessibilityLabel="הוסף מעשה חדש">
          <Plus size={15} color="#fff" />
          <Text style={AS.addBtnText}>הוספה</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} accessibilityLabel="טוען" />
      ) : (
        <ScrollView style={AS.list} contentContainerStyle={listPad}>
          <View style={pageContent}>
            <View style={S.infoBanner}>
              <Text style={S.infoBannerText}>
                מעשים טובים הם הפעולות שהמורה בוחר כשנותן נקודות.{'\n'}
                כל מעשה מקבל ערך 1-10. ניתן להשבית ללא מחיקה.
              </Text>
            </View>

            {deeds.length === 0 ? (
              <View style={AS.emptyWrap}>
                <View style={[AS.emptyIcon, { backgroundColor: '#FEF3C7' }]}><BookOpen size={28} color="#D97706" /></View>
                <Text style={AS.emptyTitle}>אין מעשים טובים עדיין</Text>
                <Text style={AS.emptyHint}>לחץ על "+ הוספה" כדי להוסיף.</Text>
              </View>
            ) : (
              deeds.map((deed) => (
                <View
                  key={deed.id}
                  style={[AS.row, !deed.is_active && { opacity: 0.5 }]}
                  accessibilityLabel={`מעשה: ${deed.name}, ערך ${deed.amount}, ${deed.is_active ? 'פעיל' : 'לא פעיל'}`}
                >
                  {/* Amount badge */}
                  <View style={deed.is_active ? S.amtBadgeActive : S.amtBadgeInactive}>
                    <Text style={deed.is_active ? S.amtTextActive : S.amtTextInactive}>+{deed.amount}</Text>
                  </View>

                  {/* Name */}
                  <View style={AS.rowLeft}>
                    <Text style={[S.deedName, { color: deed.is_active ? Colors.text : '#94a3b8' }]}>{deed.name}</Text>
                  </View>

                  {/* Toggle */}
                  <View style={S.switchWrap}>
                    <PrimarySwitch
                      value={deed.is_active}
                      onValueChange={() => handleToggleActive(deed)}
                      accessibilityLabel={`${deed.is_active ? 'השבת' : 'הפעל'} ${deed.name}`}
                      accessibilityState={{ checked: deed.is_active }}
                    />
                  </View>

                  {/* Divider */}
                  <View style={S.rowDivider} />

                  {/* Edit + Delete */}
                  <View style={AS.rowActions}>
                    <TactileIconBtn onPress={() => openEdit(deed)} style={AS.iconBtn} accessibilityLabel={`ערוך ${deed.name}`}>
                      <Pencil size={16} color={Colors.muted} />
                    </TactileIconBtn>
                    <TactileIconBtn onPress={() => handleDelete(deed)} style={AS.iconBtnDanger} shadowColor="rgba(186,26,26,0.2)" accessibilityLabel={`מחק ${deed.name}`}>
                      <Trash2 size={16} color={Colors.danger} />
                    </TactileIconBtn>
                  </View>
                </View>
              ))
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
