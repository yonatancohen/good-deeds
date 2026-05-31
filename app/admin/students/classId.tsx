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
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronRight, UserPlus, Upload, Plus, Trash2 } from 'lucide-react-native';
import AdminSheet from '@/components/AdminSheet';
import StudentCsvUploadSheet from '@/components/StudentCsvUploadSheet';
import { Colors, TactileIconBtn } from '@/components/ui';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';
import { safeBack } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';
import { insertStudents, type ParsedStudentRow } from '@/lib/studentImport';
import { getClassColorScheme } from '@/lib/classColors';
import { studentCountLabel } from '@/lib/studentCountLabel';
import { confirmAction } from '@/lib/confirm';
import type { Tables } from '@/types/supabase';

type ClassRow = Tables<'classes'>;
type StudentRow = Tables<'students'>;

const S = StyleSheet.create({
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold',
  } as any,
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

export default function AdminClassStudentsScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const { listPad, pageContent } = useAdminLayout();

  const [classRow, setClassRow] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [manualVisible, setManualVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [manualRows, setManualRows] = useState<ManualRow[]>([
    { id: '1', first_name: '', last_name: '' },
  ]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!classId) {
      setLoading(false);
      return;
    }
    const [classRes, studentsRes] = await Promise.all([
      supabase.from('classes').select('*').eq('id', classId).maybeSingle(),
      supabase.from('students').select('*').eq('class_id', classId).order('last_name'),
    ]);
    if (!classRes.error) setClassRow(classRes.data);
    if (!studentsRes.error) setStudents(studentsRes.data ?? []);
    setLoading(false);
  }, [classId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );

  function openManual() {
    setManualRows([{ id: '1', first_name: '', last_name: '' }]);
    setManualVisible(true);
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
    if (!classId) return;
    const toInsert: ParsedStudentRow[] = manualRows
      .map((r) => ({
        first_name: r.first_name.trim(),
        last_name: r.last_name.trim(),
      }))
      .filter((r) => r.first_name && r.last_name);

    if (toInsert.length === 0) {
      Alert.alert('שגיאה', 'יש למלא לפחות תלמיד אחד');
      return;
    }

    setSaving(true);
    const { count, error } = await insertStudents(classId, toInsert);
    setSaving(false);

    if (error) {
      Alert.alert('שגיאה', error);
    } else {
      Alert.alert('✅', `${count} תלמידים נוספו`);
      setManualVisible(false);
      load();
    }
  }

  function handleDeleteStudent(student: StudentRow) {
    confirmAction(
      'מחיקת תלמיד',
      `למחוק את ${student.first_name} ${student.last_name}?`,
      async () => {
        const { error } = await supabase.from('students').delete().eq('id', student.id);
        if (error) Alert.alert('שגיאה', error.message);
        else setStudents((prev) => prev.filter((s) => s.id !== student.id));
      },
      'מחק',
    );
  }

  const scheme = getClassColorScheme(classRow?.grade ?? classRow?.name ?? '');
  const className = classRow?.name ?? '';

  return (
    <SafeAreaView style={AS.screen}>
      <View style={AS.header}>
        <View style={[AS.headerInner, pageContent]}>
          <View style={AS.headerLeft}>
            <TactileIconBtn
              onPress={() => safeBack(router, '/admin/students')}
              style={AS.backBtn}
              accessibilityLabel="חזרה לרשימת כיתות"
            >
              <ChevronRight size={20} color={Colors.primaryDark} />
            </TactileIconBtn>
            <View>
              <Text style={AS.headerTitle} accessibilityRole="header">
                {className || 'כיתה'}
              </Text>
              {!loading && (
                <Text style={[AS.rowSub, { marginTop: 0 }]}>
                  {studentCountLabel(students.length)}
                  {classRow?.grade ? ` · שכבה ${classRow.grade}` : ''}
                </Text>
              )}
            </View>
          </View>
          {classId ? (
            <View style={AS.rowActions}>
              <TactileIconBtn
                onPress={() => setUploadVisible(true)}
                style={AS.iconBtnSecondary}
                shadowColor="rgba(0,96,172,0.2)"
                accessibilityLabel="ייבוא CSV"
              >
                <Upload size={16} color={Colors.secondary} />
              </TactileIconBtn>
              <TactileIconBtn
                onPress={openManual}
                style={AS.iconBtn}
                accessibilityLabel="הוסף תלמידים ידנית"
              >
                <UserPlus size={16} color={Colors.muted} />
              </TactileIconBtn>
            </View>
          ) : null}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} />
      ) : !classRow ? (
        <View style={AS.emptyWrap}>
          <Text style={AS.emptyTitle}>כיתה לא נמצאה</Text>
        </View>
      ) : (
        <ScrollView style={AS.list} contentContainerStyle={listPad}>
          <View style={pageContent}>
            {students.length === 0 ? (
              <View style={AS.emptyWrap}>
                <Text style={AS.emptyTitle}>אין תלמידים בכיתה</Text>
                <Text style={AS.emptyHint}>הוסף תלמידים ידנית או ייבא מקובץ CSV.</Text>
              </View>
            ) : (
              students.map((student) => (
                <View
                  key={student.id}
                  style={AS.row}
                  accessibilityLabel={`${student.first_name} ${student.last_name}`}
                >
                  <View style={[S.studentAvatar, { backgroundColor: scheme.bg }]}>
                    <Text style={[S.studentAvatarText, { color: scheme.text }]}>
                      {student.first_name.charAt(0)}
                      {student.last_name.charAt(0)}
                    </Text>
                  </View>
                  <View style={AS.rowLeft}>
                    <Text style={AS.rowTitle}>
                      {student.first_name} {student.last_name}
                    </Text>
                  </View>
                  <View style={AS.rowActions}>
                    <TactileIconBtn
                      onPress={() => handleDeleteStudent(student)}
                      style={AS.iconBtnDanger}
                      shadowColor="rgba(220,38,38,0.2)"
                      accessibilityLabel={`מחק ${student.first_name} ${student.last_name}`}
                    >
                      <Trash2 size={16} color={Colors.danger} />
                    </TactileIconBtn>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <AdminSheet visible={manualVisible} onClose={() => setManualVisible(false)}>
        <Text style={AS.sheetTitle} accessibilityRole="header">
          הוספת תלמידים — {className}
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
            onPress={() => setManualVisible(false)}
            style={[AS.cancelBtn, webPointer]}
            accessibilityRole="button"
            accessibilityLabel="ביטול"
          >
            <Text style={AS.cancelBtnText}>ביטול</Text>
          </TouchableOpacity>
        </View>
      </AdminSheet>

      {classId ? (
        <StudentCsvUploadSheet
          visible={uploadVisible}
          classId={classId}
          className={className}
          onClose={() => setUploadVisible(false)}
          onImported={() => {
            setUploadVisible(false);
            load();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
