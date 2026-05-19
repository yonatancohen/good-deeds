import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, UserPlus, Upload, Plus, Trash2 } from 'lucide-react-native';
import AdminSheet from '@/components/AdminSheet';
import { Colors } from '@/components/ui';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';
import { safeBack } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/hooks/useSettings';
import { insertStudents, type ParsedStudentRow } from '@/lib/studentImport';
import type { Tables } from '@/types/supabase';

type ClassRow = Tables<'classes'>;

const S = StyleSheet.create({
  classRow: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  classMeta: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'right',
    marginTop: 2,
    writingDirection: 'rtl',
  } as any,
  actions: { flexDirection: 'row-reverse', gap: 8 },
  actionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionBtnText: { color: Colors.primary, fontSize: 12, fontWeight: '600', writingDirection: 'rtl' } as any,
  manualRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  manualInput: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'right',
    fontSize: 14,
    writingDirection: 'rtl',
  } as any,
  removeRowBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addRowBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  addRowText: { color: Colors.primary, fontWeight: '600', fontSize: 14, writingDirection: 'rtl' } as any,
});

interface ManualRow {
  id: string;
  first_name: string;
  last_name: string;
}

export default function AdminStudentsScreen() {
  const router = useRouter();
  const { listPad, pageContent } = useAdminLayout();
  const { settings } = useSettings();
  const currentYear = settings?.current_year ?? '';

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassRow | null>(null);
  const [manualRows, setManualRows] = useState<ManualRow[]>([
    { id: '1', first_name: '', last_name: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback(async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    if (!error) setClasses(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const visibleClasses = classes.filter((c) =>
    currentYear ? c.year === currentYear : true,
  );

  function openManual(cls: ClassRow) {
    setSelectedClass(cls);
    setManualRows([{ id: '1', first_name: '', last_name: '' }]);
  }

  function addManualRow() {
    setManualRows((prev) => [
      ...prev,
      { id: String(Date.now()), first_name: '', last_name: '' },
    ]);
  }

  function updateRow(id: string, field: 'first_name' | 'last_name', value: string) {
    setManualRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }

  function removeRow(id: string) {
    setManualRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  async function handleManualSave() {
    if (!selectedClass) return;
    const students: ParsedStudentRow[] = manualRows
      .map((r) => ({
        first_name: r.first_name.trim(),
        last_name: r.last_name.trim(),
      }))
      .filter((r) => r.first_name && r.last_name);

    if (students.length === 0) {
      Alert.alert('שגיאה', 'יש למלא לפחות תלמיד אחד');
      return;
    }

    setSaving(true);
    const { count, error } = await insertStudents(selectedClass.id, students);
    setSaving(false);

    if (error) {
      Alert.alert('שגיאה', error);
    } else {
      Alert.alert('✅', `${count} תלמידים נוספו לכיתה ${selectedClass.name}`);
      setSelectedClass(null);
    }
  }

  return (
    <SafeAreaView style={AS.screen}>
      <View style={AS.header}>
        <View style={[AS.headerInner, pageContent]}>
          <View style={AS.headerLeft}>
            <TouchableOpacity
              onPress={() => safeBack(router, '/admin')}
              style={[AS.backBtn, webPointer]}
              accessibilityRole="button"
              accessibilityLabel="חזרה"
            >
              <ChevronRight size={20} color={Colors.primaryDark} />
            </TouchableOpacity>
            <Text style={AS.headerTitle} accessibilityRole="header">תלמידים</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView style={AS.list} contentContainerStyle={listPad}>
          <View style={pageContent}>
            {visibleClasses.length === 0 ? (
              <View style={AS.emptyWrap}>
                <Text style={AS.emptyTitle}>אין כיתות</Text>
                <Text style={AS.emptyHint}>הוסף כיתות בדף הכיתות תחילה.</Text>
              </View>
            ) : (
              visibleClasses.map((cls) => (
                <View key={cls.id} style={S.classRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={S.className}>{cls.name}</Text>
                    {cls.grade && <Text style={S.classMeta}>שכבה {cls.grade}</Text>}
                  </View>
                  <View style={S.actions}>
                    <TouchableOpacity
                      onPress={() => openManual(cls)}
                      style={[S.actionBtn, webPointer]}
                      accessibilityRole="button"
                      accessibilityLabel={`הוסף תלמידים ידנית לכיתה ${cls.name}`}
                    >
                      <UserPlus size={14} color={Colors.primary} />
                      <Text style={S.actionBtnText}>ידני</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push(`/teacher/upload?classId=${cls.id}` as any)}
                      style={[S.actionBtn, webPointer]}
                      accessibilityRole="button"
                      accessibilityLabel={`ייבוא CSV לכיתה ${cls.name}`}
                    >
                      <Upload size={14} color={Colors.primary} />
                      <Text style={S.actionBtnText}>CSV</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <AdminSheet visible={!!selectedClass} onClose={() => setSelectedClass(null)}>
        <Text style={AS.sheetTitle} accessibilityRole="header">
          הוספת תלמידים — {selectedClass?.name}
        </Text>

        {manualRows.map((row) => (
          <View key={row.id} style={S.manualRow}>
            <TextInput
              value={row.first_name}
              onChangeText={(v) => updateRow(row.id, 'first_name', v)}
              placeholder="שם פרטי"
              placeholderTextColor="#94a3b8"
              style={S.manualInput}
              textAlign="right"
              accessibilityLabel="שם פרטי"
            />
            <TextInput
              value={row.last_name}
              onChangeText={(v) => updateRow(row.id, 'last_name', v)}
              placeholder="שם משפחה"
              placeholderTextColor="#94a3b8"
              style={S.manualInput}
              textAlign="right"
              accessibilityLabel="שם משפחה"
            />
            <TouchableOpacity
              onPress={() => removeRow(row.id)}
              style={S.removeRowBtn}
              accessibilityRole="button"
              accessibilityLabel="הסר שורה"
            >
              <Trash2 size={16} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          onPress={addManualRow}
          style={[S.addRowBtn, webPointer]}
          accessibilityRole="button"
          accessibilityLabel="הוסף שורה"
        >
          <Plus size={16} color={Colors.primary} />
          <Text style={S.addRowText}>הוסף שורה</Text>
        </TouchableOpacity>

        <View style={AS.sheetBtns}>
          <TouchableOpacity
            onPress={handleManualSave}
            disabled={saving}
            style={[saving ? AS.saveBtnDisabled : AS.saveBtn, webPointer]}
            accessibilityRole="button"
            accessibilityLabel="שמור תלמידים"
          >
            {saving ? (
              <ActivityIndicator color={Colors.primaryDark} />
            ) : (
              <Text style={AS.saveBtnText}>שמור</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedClass(null)}
            style={[AS.cancelBtn, webPointer]}
            accessibilityRole="button"
            accessibilityLabel="ביטול"
          >
            <Text style={AS.cancelBtnText}>ביטול</Text>
          </TouchableOpacity>
        </View>
      </AdminSheet>
    </SafeAreaView>
  );
}
