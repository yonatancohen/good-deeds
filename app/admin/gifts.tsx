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
import { Gift as GiftIcon, Pencil, Trash2, Plus, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/components/ui';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { confirmAction } from '@/lib/confirm';
import type { Tables } from '@/types/supabase';

type Gift = Tables<'gifts'>;

const S = StyleSheet.create({
  infoBanner: {
    backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
  },
  infoBannerText: { color: '#3730A3', fontSize: 13, textAlign: 'right', writingDirection: 'rtl' } as any,
  giftIconBox: {
    width: 48, height: 48, backgroundColor: '#FFEDD5',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 12,
  },
  giftName: { fontWeight: '600', fontSize: 15, textAlign: 'right', writingDirection: 'rtl' } as any,
  giftDesc: { color: '#94a3b8', fontSize: 12, textAlign: 'right', marginTop: 2, writingDirection: 'rtl' } as any,
  switchWrap: { alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  rowDivider: { width: 1, height: 28, backgroundColor: '#e2e8f0', marginHorizontal: 4 },
});

export default function AdminGiftsScreen() {
  const { listPad, pageContent } = useAdminLayout();
  const { t } = useTranslation();
  const router = useRouter();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | null>(null);
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const loadGifts = useCallback(async () => {
    const { data, error } = await supabase
      .from('gifts')
      .select('*')
      .is('deleted_at', null)
      .order('name');
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
    const { error } = await supabase.from('gifts').update({ is_active: !gift.is_active }).eq('id', gift.id);
    if (error) Alert.alert('שגיאה', error.message);
    else loadGifts();
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
        <View style={AS.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={[AS.backBtn, webPointer]} accessibilityRole="button" accessibilityLabel="חזרה">
            <ChevronRight size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={AS.headerTitle} accessibilityRole="header">{t('gifts')}</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={[AS.addBtn, webPointer]} accessibilityRole="button" accessibilityLabel="הוסף פרס">
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
              gifts.map((gift) => (
                <View
                  key={gift.id}
                  style={[AS.row, !gift.is_active && { opacity: 0.6 }]}
                  accessibilityLabel={`מתנה: ${gift.name}, ${gift.is_active ? 'פעילה' : 'לא פעילה'}`}
                >
                  <View style={AS.rowLeft}>
                    <Text style={[S.giftName, { color: gift.is_active ? Colors.text : '#94a3b8' }]}>{gift.name}</Text>
                    {gift.description && <Text style={S.giftDesc}>{gift.description}</Text>}
                  </View>
                  <View style={S.switchWrap}>
                    <PrimarySwitch
                      value={gift.is_active}
                      onValueChange={() => handleToggleActive(gift)}
                      accessibilityLabel={`${gift.is_active ? 'השבת' : 'הפעל'} ${gift.name}`}
                      accessibilityState={{ checked: gift.is_active }}
                    />
                  </View>
                  <View style={S.rowDivider} />
                  <View style={AS.rowActions}>
                    <TouchableOpacity onPress={() => openEdit(gift)} style={[AS.iconBtn, webPointer]} accessibilityRole="button" accessibilityLabel={`ערוך ${gift.name}`}>
                      <Pencil size={16} color={Colors.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(gift)} style={[AS.iconBtnDanger, webPointer]} accessibilityRole="button" accessibilityLabel={`מחק ${gift.name}`}>
                      <Trash2 size={16} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <AdminSheet visible={modalVisible} onClose={() => setModalVisible(false)}>
        <Text style={AS.sheetTitle} accessibilityRole="header">
          {editingGift ? 'ערוך פרס' : 'הוסף פרס'}
        </Text>

        <Text style={AS.fieldLabel}>שם הפרס *</Text>
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
