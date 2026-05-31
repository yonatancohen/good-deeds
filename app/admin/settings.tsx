import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/hooks/useSettings';
import { safeBack } from '@/lib/navigation';
import { Colors, TactileIconBtn } from '@/components/ui';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';

import { HEBREW_ROW } from '@/lib/rtlLayout';
// ── Hebrew year helpers (shared with classes screen) ─────────────────────────
const HEB_UNITS: Record<number, string> = {
  1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט',
};
const HEB_TENS: Record<number, string> = { 80: 'פ', 90: 'צ' };
function toHebrewYear(gregorianAcademicStart: number): string {
  const h = gregorianAcademicStart + 3761;
  const mod = h % 100;
  const tens = Math.floor(mod / 10) * 10;
  const units = mod % 10;
  return `תש${HEB_TENS[tens] ?? ''}״${HEB_UNITS[units] ?? ''}`;
}
function getSchoolYears(): string[] {
  const now = new Date();
  const base = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return [-1, 0, 1].map(i => toHebrewYear(base + i));
}

// ── Pill selector ─────────────────────────────────────────────────────────────
function PillGroup({
  options, value, onSelect, fullWidth,
}: {
  options: string[];
  value: string;
  onSelect: (v: string) => void;
  fullWidth?: boolean;
}) {
  return (
    <View style={[P.group, fullWidth && P.groupFull]}>
      {options.map(opt => {
        const on = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={[P.pill, fullWidth && P.pillFull, on ? P.pillOn : P.pillOff, webPointer]}
          >
            <Text style={[P.pillText, on ? P.pillTextOn : P.pillTextOff]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const P = StyleSheet.create({
  group: { flexDirection: HEBREW_ROW, flexWrap: 'wrap', gap: 8, marginTop: 8 },
  groupFull: { flexWrap: 'nowrap', width: '100%' },
  pill: {
    height: 44, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18,
  },
  pillFull: { flex: 1, minWidth: 0, paddingHorizontal: 4 },
  pillOn:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillOff: { backgroundColor: Colors.surface, borderColor: Colors.border },
  pillText: { fontSize: 15, fontWeight: '700', fontFamily: 'Baloo2_700Bold' } as any,
  pillTextOn:  { color: '#fff' },
  pillTextOff: { color: Colors.muted },
});

export default function AdminSettingsScreen() {
  const { listPad, pageContent, isDesktop } = useAdminLayout();
  const { t } = useTranslation();
  const router = useRouter();
  const { settings, loading } = useSettings();

  const schoolYears = useMemo(() => getSchoolYears(), []);
  const [schoolName,  setSchoolName]  = useState('');
  const [currentYear, setCurrentYear] = useState('');
  const [globalGoal,  setGlobalGoal]  = useState('100');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setSchoolName(settings.school_name ?? '');
      setCurrentYear(settings.current_year ?? '');
      setGlobalGoal(String(settings.global_goal ?? 100));
    }
  }, [settings]);

  async function handleSave() {
    const goalNum = parseInt(globalGoal, 10);
    if (isNaN(goalNum) || goalNum < 1 || goalNum > 10000) {
      Alert.alert('שגיאה', 'מטרת הנקודות חייבת להיות מספר בין 1 ל-10000');
      return;
    }
    if (!schoolName.trim()) {
      Alert.alert('שגיאה', 'שם בית הספר הוא שדה חובה');
      return;
    }

    setSaving(true);
    let error;

    if (settings?.id) {
      const res = await supabase.from('settings')
        .update({ school_name: schoolName.trim(), current_year: currentYear.trim() || null, global_goal: goalNum })
        .eq('id', settings.id);
      error = res.error;
    } else {
      const res = await supabase.from('settings')
        .insert({ school_name: schoolName.trim(), current_year: currentYear.trim() || null, global_goal: goalNum });
      error = res.error;
    }

    setSaving(false);
    if (error) {
      Alert.alert('שגיאה', error.message);
    } else {
      Alert.alert('✅', t('saved'), [{ text: 'אישור', onPress: () => safeBack(router, '/admin') }]);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={AS.centered}>
        <ActivityIndicator size="large" color={Colors.primary} accessibilityLabel="טוען" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={AS.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={AS.header}>
          <View style={[AS.headerInner, pageContent, { justifyContent: 'flex-start' }]}>
            <TactileIconBtn onPress={() => safeBack(router, '/admin')} style={AS.backBtn} accessibilityLabel="חזרה">
              <ChevronRight size={20} color={Colors.primaryDark} />
            </TactileIconBtn>
            <Text style={AS.headerTitle} accessibilityRole="header">{t('settings')}</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={listPad} keyboardShouldPersistTaps="handled">
          <View style={pageContent}>
            <View style={{
              backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#f1f5f9',
              paddingHorizontal: 16, paddingVertical: 20, gap: 20,
            }}>
              {/* School Name */}
              <View>
                <Text style={AS.fieldLabel}>{t('schoolName')}</Text>
                <Text style={AS.fieldHint}>{t('schoolNameHint')}</Text>
                <TextInput
                  value={schoolName}
                  onChangeText={setSchoolName}
                  placeholder="בית ספר שלנו"
                  placeholderTextColor="#94a3b8"
                  textAlign="right"
                  style={AS.inputSmall}
                  accessibilityLabel="שדה שם בית הספר"
                />
              </View>

              {/* Current Year */}
              <View>
                <Text style={AS.fieldLabel}>{t('currentYear')}</Text>
                <Text style={AS.fieldHint}>בחר את שנת הלימודים הנוכחית</Text>
                <PillGroup
                  options={schoolYears}
                  value={currentYear}
                  onSelect={setCurrentYear}
                  fullWidth={!isDesktop}
                />
              </View>

              {/* Global Goal */}
              <View>
                <Text style={AS.fieldLabel}>{t('globalGoal')}</Text>
                <Text style={AS.fieldHint}>{t('globalGoalHint')}</Text>
                <TextInput
                  value={globalGoal}
                  onChangeText={setGlobalGoal}
                  placeholder="100"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  textAlign="right"
                  style={AS.inputSmall}
                  accessibilityLabel="מטרת נקודות"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ── Sticky save button ── */}
        <View style={{
          paddingTop: 12, paddingBottom: 16,
          backgroundColor: Colors.bg,
          borderTopWidth: 1, borderTopColor: '#f1f5f9',
        }}>
          <View style={pageContent}>
            <View style={AS.sheetBtns}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={[saving ? AS.saveBtnDisabled : AS.saveBtn, webPointer]}
                accessibilityRole="button"
                accessibilityLabel="שמור הגדרות"
                accessibilityState={{ disabled: saving }}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={AS.saveBtnText}>{t('save')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
