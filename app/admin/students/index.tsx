import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronRight, UserPlus, Upload, Plus, Trash2 } from 'lucide-react-native';
import AdminSheet from '@/components/AdminSheet';
import StudentCsvUploadSheet from '@/components/StudentCsvUploadSheet';
import { Colors, TactileIconBtn } from '@/components/ui';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';
import { safeBack } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/hooks/useSettings';
import { insertStudents, type ParsedStudentRow } from '@/lib/studentImport';
import { getClassColorScheme } from '@/lib/classColors';
import { studentCountLabel } from '@/lib/studentCountLabel';
import type { Tables } from '@/types/supabase';

import { HEBREW_ROW } from '@/lib/rtlLayout';
type ClassRow = Tables<'classes'>;

const S = StyleSheet.create({
  classCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  classCircleText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
  } as any,
  rowPress: {
    flex: 1,
    flexDirection: HEBREW_ROW,
    alignItems: 'center',
    minWidth: 0,
  },
  manualRow: {
    flexDirection: HEBREW_ROW,
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    width: '100%',
    minWidth: 0,
  },
  manualInputWrap: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
  manualInput: {
    width: '100%',
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
    flexShrink: 0,
  },
  addRowBtn: {
    flexDirection: HEBREW_ROW,
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
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<ClassRow | null>(null);
  const [uploadClass, setUploadClass] = useState<ClassRow | null>(null);
  const [manualRows, setManualRows] = useState<ManualRow[]>([
    { id: '1', first_name: '', last_name: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoading(true);

    const settingsRes = await supabase
      .from('settings')
      .select('current_year')
      .limit(1)
      .maybeSingle();
    const schoolYear = settingsRes.data?.current_year ?? null;

    let classesQuery = supabase
      .from('classes')
      .select('*')
      .is('deleted_at', null)
      .order('name');
    if (schoolYear) classesQuery = classesQuery.eq('year', schoolYear);

    const [classesRes, studentsRes] = await Promise.all([
      classesQuery,
      supabase.from('students').select('class_id'),
    ]);
    if (!classesRes.error) setClasses(classesRes.data ?? []);
    const counts: Record<string, number> = {};
    if (!studentsRes.error) {
      for (const s of studentsRes.data ?? []) {
        counts[s.class_id] = (counts[s.class_id] ?? 0) + 1;
      }
    }
    setStudentCounts(counts);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClasses();
    }, [loadClasses]),
  );

  const visibleClasses = classes;

  const emptyManualRows = (): ManualRow[] => [{ id: '1', first_name: '', last_name: '' }];

  function closeManualSheet() {
    setSelectedClass(null);
    setManualRows(emptyManualRows());
  }

  function openManual(cls: ClassRow) {
    setSelectedClass(cls);
    setManualRows(emptyManualRows());
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
      const className = selectedClass.name;
      closeManualSheet();
      Alert.alert('✅', `${count} תלמידים נוספו לכיתה ${className}`);
      loadClasses();
    }
  }

  return (
    <SafeAreaView style={AS.screen}>
      <View style={AS.header}>
        <View style={[AS.headerInner, pageContent]}>
          <View style={AS.headerLeft}>
            <TactileIconBtn
              onPress={() => safeBack(router, '/admin')}
              style={AS.backBtn}
              accessibilityLabel="חזרה"
            >
              <ChevronRight size={20} color={Colors.primaryDark} />
            </TactileIconBtn>
            <Text style={AS.headerTitle} accessibilityRole="header">כיתות ותלמידים</Text>
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
                <Text style={AS.emptyHint}>
                  {currentYear
                    ? `אין כיתות לשנת לימודים ${currentYear}. הוסף כיתות בדף הכיתות.`
                    : 'הוסף כיתות בדף הכיתות תחילה.'}
                </Text>
              </View>
            ) : (
              visibleClasses.map((cls) => {
                const scheme = getClassColorScheme(cls.grade ?? cls.name);
                const count = studentCounts[cls.id] ?? 0;
                return (
                  <View key={cls.id} style={AS.row}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/admin/students/classId',
                          params: { classId: cls.id },
                        })
                      }
                      style={[S.rowPress, webPointer]}
                      accessibilityRole="button"
                      accessibilityLabel={`כיתה ${cls.name}, ${studentCountLabel(count)}`}
                    >
                      <View style={[S.classCircle, { backgroundColor: scheme.bg }]}>
                        <Text style={[S.classCircleText, { color: scheme.text }]}>
                          {cls.grade ?? cls.name.charAt(0)}
                        </Text>
                      </View>
                      <View style={AS.rowLeft}>
                        <Text style={AS.rowTitle}>{cls.name}</Text>
                        <Text style={AS.rowSub}>
                          {studentCountLabel(count)}
                          {cls.grade ? ` · שכבה ${cls.grade}` : ''}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <View style={AS.rowActions}>
                      <TactileIconBtn
                        onPress={() => setUploadClass(cls)}
                        style={AS.iconBtnSecondary}
                        shadowColor="rgba(0,96,172,0.2)"
                        accessibilityLabel={`ייבוא CSV לכיתה ${cls.name}`}
                      >
                        <Upload size={16} color={Colors.secondary} />
                      </TactileIconBtn>
                      <TactileIconBtn
                        onPress={() => openManual(cls)}
                        style={AS.iconBtn}
                        accessibilityLabel={`הוסף תלמידים ידנית לכיתה ${cls.name}`}
                      >
                        <UserPlus size={16} color={Colors.muted} />
                      </TactileIconBtn>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {uploadClass ? (
        <StudentCsvUploadSheet
          visible={!!uploadClass}
          classId={uploadClass.id}
          className={uploadClass.name}
          onClose={() => setUploadClass(null)}
          onImported={() => {
            setUploadClass(null);
            loadClasses();
          }}
        />
      ) : null}

      <AdminSheet visible={!!selectedClass} onClose={closeManualSheet}>
        <Text style={AS.sheetTitle} accessibilityRole="header">
          הוספת תלמידים — {selectedClass?.name}
        </Text>

        {manualRows.map((row) => (
          <View key={row.id} style={S.manualRow}>
            <View style={S.manualInputWrap}>
              <TextInput
                value={row.first_name}
                onChangeText={(v) => updateRow(row.id, 'first_name', v)}
                placeholder="שם פרטי"
                placeholderTextColor="#94a3b8"
                style={S.manualInput}
                textAlign="right"
                accessibilityLabel="שם פרטי"
              />
            </View>
            <View style={S.manualInputWrap}>
              <TextInput
                value={row.last_name}
                onChangeText={(v) => updateRow(row.id, 'last_name', v)}
                placeholder="שם משפחה"
                placeholderTextColor="#94a3b8"
                style={S.manualInput}
                textAlign="right"
                accessibilityLabel="שם משפחה"
              />
            </View>
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
            onPress={closeManualSheet}
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
