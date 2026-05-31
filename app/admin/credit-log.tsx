import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { ChevronDown, ChevronRight, Pencil, Trash2, Check } from 'lucide-react-native';
import AdminSheet from '@/components/AdminSheet';
import { Colors, TactileIconBtn } from '@/components/ui';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';
import { safeBack } from '@/lib/navigation';
import { confirmAction } from '@/lib/confirm';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';
import moment from 'moment';
import 'moment/locale/he';

import { HEBREW_ROW } from '@/lib/rtlLayout';
moment.locale('he');

type ClassRow = Tables<'classes'>;
type DeedRow = Tables<'deeds'>;
type UserRow = Tables<'users'>;

type LogKind = 'student' | 'class';

interface CreditLogEntry {
  id: string;
  kind: LogKind;
  created_at: string;
  amount: number;
  note: string | null;
  class_id: string;
  class_name: string;
  student_label: string;
  deed_name: string | null;
  teacher_name: string;
  given_by: string | null;
}

const S = StyleSheet.create({
  filters: { marginBottom: 16, gap: 10 },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  chipRow: {
    flexDirection: HEBREW_ROW,
    flexWrap: 'wrap',
    gap: 8,
    alignSelf: 'stretch',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipInactive: { backgroundColor: '#fff', borderColor: Colors.border },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  selectField: {
    flexDirection: HEBREW_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectFieldText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  searchInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'right',
    fontSize: 14,
    writingDirection: 'rtl',
    marginBottom: 12,
  } as any,
  teacherRow: {
    flexDirection: HEBREW_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  teacherRowActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  teacherRowInactive: { backgroundColor: '#fff', borderColor: Colors.border },
  teacherRowText: { flex: 1, fontWeight: '600', fontSize: 14, textAlign: 'right', writingDirection: 'rtl' } as any,
  teacherRowTextActive: { color: Colors.primaryDark },
  teacherRowTextInactive: { color: '#334155' },
  logRow: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  logTop: {
    flexDirection: HEBREW_ROW,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  logClass: { fontSize: 14, fontWeight: '700', color: Colors.text, writingDirection: 'rtl' } as any,
  logDate: { fontSize: 11, color: '#94a3b8' } as any,
  logMeta: { fontSize: 13, color: '#64748b', textAlign: 'right', writingDirection: 'rtl' } as any,
  logNote: { fontSize: 12, color: '#94a3b8', textAlign: 'right', marginTop: 4, writingDirection: 'rtl' } as any,
  logActions: { flexDirection: HEBREW_ROW, gap: 8, marginTop: 10 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'right',
    fontSize: 13,
    writingDirection: 'rtl',
  } as any,
});

export default function AdminCreditLogScreen() {
  const router = useRouter();
  const { listPad, pageContent } = useAdminLayout();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  const [entries, setEntries] = useState<CreditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterClassId, setFilterClassId] = useState<string | 'all'>('all');
  const [filterTeacherId, setFilterTeacherId] = useState<string | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [teacherPickerVisible, setTeacherPickerVisible] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');

  const [editing, setEditing] = useState<CreditLogEntry | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    const [classesRes, usersRes, studentsRes, deedsRes, creditRes, classCreditRes] =
      await Promise.all([
        supabase.from('classes').select('*').is('deleted_at', null).order('name'),
        supabase.from('users').select('*').is('deleted_at', null),
        supabase.from('students').select('id, first_name, last_name, class_id'),
        supabase.from('deeds').select('*'),
        supabase
          .from('credit_events')
          .select('id, student_id, deed_id, amount, note, given_by, created_at')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('class_credit_events')
          .select('id, class_id, amount, note, given_by, created_at')
          .order('created_at', { ascending: false })
          .limit(500),
      ]);

    if (classesRes.error || creditRes.error || classCreditRes.error) {
      setLoading(false);
      return;
    }

    const classMap = new Map((classesRes.data ?? []).map((c) => [c.id, c.name]));
    const studentMap = new Map(
      (studentsRes.data ?? []).map((s) => [
        s.id,
        { name: `${s.first_name} ${s.last_name}`, class_id: s.class_id },
      ]),
    );
    const deedMap = new Map((deedsRes.data ?? []).map((d: DeedRow) => [d.id, d.name]));
    const allUsers = usersRes.data ?? [];
    const userMap = new Map(allUsers.map((u) => [u.id, u.display_name]));

    const merged: CreditLogEntry[] = [];

    for (const e of creditRes.data ?? []) {
      const student = studentMap.get(e.student_id);
      if (!student) continue;
      merged.push({
        id: e.id,
        kind: 'student',
        created_at: e.created_at,
        amount: e.amount,
        note: e.note,
        class_id: student.class_id,
        class_name: classMap.get(student.class_id) ?? '—',
        student_label: student.name,
        deed_name: deedMap.get(e.deed_id) ?? null,
        teacher_name: userMap.get(e.given_by) ?? 'מורה',
        given_by: e.given_by,
      });
    }

    for (const e of classCreditRes.data ?? []) {
      merged.push({
        id: e.id,
        kind: 'class',
        created_at: e.created_at,
        amount: e.amount,
        note: e.note,
        class_id: e.class_id,
        class_name: classMap.get(e.class_id) ?? '—',
        student_label: 'כל הכיתה',
        deed_name: null,
        teacher_name: e.given_by ? (userMap.get(e.given_by) ?? 'מורה') : '—',
        given_by: e.given_by,
      });
    }

    merged.sort((a, b) => b.created_at.localeCompare(a.created_at));

    setClasses(classesRes.data ?? []);
    setTeachers(allUsers.filter((u) => u.role === 'teacher'));
    setEntries(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selectedTeacherLabel = useMemo(() => {
    if (filterTeacherId === 'all') return 'כל המורים';
    return teachers.find((t) => t.id === filterTeacherId)?.display_name ?? 'כל המורים';
  }, [filterTeacherId, teachers]);

  const pickerTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    const sorted = [...teachers].sort((a, b) =>
      a.display_name.localeCompare(b.display_name, 'he'),
    );
    if (!q) return sorted;
    return sorted.filter((t) => t.display_name.toLowerCase().includes(q));
  }, [teachers, teacherSearch]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filterClassId !== 'all' && e.class_id !== filterClassId) return false;
      if (filterTeacherId !== 'all' && e.given_by !== filterTeacherId) return false;
      if (dateFrom && e.created_at < `${dateFrom}T00:00:00`) return false;
      if (dateTo && e.created_at > `${dateTo}T23:59:59`) return false;
      return true;
    });
  }, [entries, filterClassId, filterTeacherId, dateFrom, dateTo]);

  function selectTeacher(id: string | 'all') {
    setFilterTeacherId(id);
    setTeacherPickerVisible(false);
    setTeacherSearch('');
  }

  function openTeacherPicker() {
    setTeacherSearch('');
    setTeacherPickerVisible(true);
  }

  function openEdit(entry: CreditLogEntry) {
    setEditing(entry);
    setEditAmount(String(entry.amount));
    setEditNote(entry.note ?? '');
  }

  async function handleSaveEdit() {
    if (!editing) return;
    const amount = parseInt(editAmount, 10);
    if (Number.isNaN(amount) || amount < 1 || amount > 10) {
      Alert.alert('שגיאה', 'כמות חייבת להיות בין 1 ל-10');
      return;
    }

    setSaving(true);
    const table = editing.kind === 'student' ? 'credit_events' : 'class_credit_events';
    const { error } = await supabase
      .from(table)
      .update({ amount, note: editNote.trim() || null })
      .eq('id', editing.id);
    setSaving(false);

    if (error) Alert.alert('שגיאה', error.message);
    else {
      setEditing(null);
      load();
    }
  }

  function handleDelete(entry: CreditLogEntry) {
    confirmAction(
      'מחיקת זיכוי',
      'למחוק את הרשומה?',
      async () => {
        const table = entry.kind === 'student' ? 'credit_events' : 'class_credit_events';
        const { error } = await supabase.from(table).delete().eq('id', entry.id);
        if (error) Alert.alert('שגיאה', error.message);
        else load();
      },
      'מחק',
    );
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
            <Text style={AS.headerTitle} accessibilityRole="header">יומן זיכויים</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <ScrollView style={AS.list} contentContainerStyle={listPad}>
          <View style={pageContent}>
            <View style={S.filters}>
              <Text style={S.filterLabel}>כיתה</Text>
              <View style={S.chipRow}>
                <TouchableOpacity
                  onPress={() => setFilterClassId('all')}
                  style={[S.chip, filterClassId === 'all' ? S.chipActive : S.chipInactive, webPointer]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: filterClassId === 'all' }}
                  accessibilityLabel="כל הכיתות"
                >
                  <Text style={[S.chipText, { color: filterClassId === 'all' ? '#fff' : '#334155' }]}>הכל</Text>
                </TouchableOpacity>
                {classes.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setFilterClassId(c.id)}
                    style={[S.chip, filterClassId === c.id ? S.chipActive : S.chipInactive, webPointer]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: filterClassId === c.id }}
                    accessibilityLabel={c.name}
                  >
                    <Text style={[S.chipText, { color: filterClassId === c.id ? '#fff' : '#334155' }]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[S.filterLabel, { marginTop: 8 }]}>מורה</Text>
              <TouchableOpacity
                onPress={openTeacherPicker}
                style={[S.selectField, webPointer]}
                accessibilityRole="button"
                accessibilityLabel={`מורה: ${selectedTeacherLabel}`}
                accessibilityHint="פתח רשימת מורים"
              >
                <Text style={S.selectFieldText}>{selectedTeacherLabel}</Text>
                <ChevronDown size={18} color={Colors.muted} />
              </TouchableOpacity>

              <Text style={[S.filterLabel, { marginTop: 8 }]}>טווח תאריכים (YYYY-MM-DD)</Text>
              <View style={{ flexDirection: HEBREW_ROW, gap: 8 }}>
                <TextInput
                  value={dateFrom}
                  onChangeText={setDateFrom}
                  placeholder="מתאריך"
                  placeholderTextColor="#94a3b8"
                  style={[S.dateInput, { flex: 1 }]}
                  textAlign="right"
                />
                <TextInput
                  value={dateTo}
                  onChangeText={setDateTo}
                  placeholder="עד תאריך"
                  placeholderTextColor="#94a3b8"
                  style={[S.dateInput, { flex: 1 }]}
                  textAlign="right"
                />
              </View>
            </View>

            {filtered.length === 0 ? (
              <View style={AS.emptyWrap}>
                <Text style={AS.emptyTitle}>אין רשומות</Text>
              </View>
            ) : (
              filtered.map((e) => (
                <View key={`${e.kind}-${e.id}`} style={S.logRow}>
                  <View style={S.logTop}>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={S.logClass}>{e.class_name}</Text>
                    </View>
                    <Text style={S.logDate}>{moment(e.created_at).format('DD/MM/YY HH:mm')}</Text>
                  </View>
                  <Text style={S.logMeta}>
                    {e.student_label} · +{e.amount}
                    {e.deed_name ? ` · ${e.deed_name}` : ''} · {e.teacher_name}
                  </Text>
                  {e.note ? <Text style={S.logNote}>{e.note}</Text> : null}
                  <View style={S.logActions}>
                    <TouchableOpacity
                      onPress={() => openEdit(e)}
                      style={[S.iconBtn, webPointer]}
                      accessibilityRole="button"
                      accessibilityLabel="ערוך"
                    >
                      <Pencil size={15} color={Colors.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(e)}
                      style={[S.iconBtn, webPointer]}
                      accessibilityRole="button"
                      accessibilityLabel="מחק"
                    >
                      <Trash2 size={15} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <AdminSheet
        visible={teacherPickerVisible}
        onClose={() => {
          setTeacherPickerVisible(false);
          setTeacherSearch('');
        }}
        maxHeightFraction={0.75}
      >
        <Text style={AS.sheetTitle} accessibilityRole="header">בחירת מורה</Text>

        <TextInput
          value={teacherSearch}
          onChangeText={setTeacherSearch}
          placeholder="חיפוש מורה..."
          placeholderTextColor="#94a3b8"
          style={S.searchInput}
          textAlign="right"
          accessibilityLabel="חיפוש מורה"
        />

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            onPress={() => selectTeacher('all')}
            style={[
              S.teacherRow,
              filterTeacherId === 'all' ? S.teacherRowActive : S.teacherRowInactive,
              webPointer,
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: filterTeacherId === 'all' }}
            accessibilityLabel="כל המורים"
          >
            <Text
              style={[
                S.teacherRowText,
                filterTeacherId === 'all' ? S.teacherRowTextActive : S.teacherRowTextInactive,
              ]}
            >
              כל המורים
            </Text>
            {filterTeacherId === 'all' ? (
              <Check size={18} color={Colors.primaryDark} />
            ) : (
              <View style={{ width: 18 }} />
            )}
          </TouchableOpacity>

          {pickerTeachers.length === 0 ? (
            <Text style={[S.logMeta, { marginBottom: 12 }]}>לא נמצאו מורים</Text>
          ) : (
            pickerTeachers.map((t) => {
              const active = filterTeacherId === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => selectTeacher(t.id)}
                  style={[S.teacherRow, active ? S.teacherRowActive : S.teacherRowInactive, webPointer]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={t.display_name}
                >
                  <Text
                    style={[S.teacherRowText, active ? S.teacherRowTextActive : S.teacherRowTextInactive]}
                  >
                    {t.display_name}
                  </Text>
                  {active ? (
                    <Check size={18} color={Colors.primaryDark} />
                  ) : (
                    <View style={{ width: 18 }} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </AdminSheet>

      <AdminSheet visible={!!editing} onClose={() => setEditing(null)}>
        <Text style={AS.sheetTitle} accessibilityRole="header">עריכת זיכוי</Text>

        <Text style={AS.fieldLabel}>כמות (1–10)</Text>
        <TextInput
          value={editAmount}
          onChangeText={setEditAmount}
          keyboardType="number-pad"
          style={AS.input}
          textAlign="right"
        />

        <Text style={AS.fieldLabel}>הערה</Text>
        <TextInput
          value={editNote}
          onChangeText={setEditNote}
          style={[AS.input, { marginBottom: 20 }]}
          textAlign="right"
          multiline
        />

        <View style={AS.sheetBtns}>
          <TouchableOpacity
            onPress={handleSaveEdit}
            disabled={saving}
            style={[saving ? AS.saveBtnDisabled : AS.saveBtn, webPointer]}
          >
            {saving ? <ActivityIndicator color={Colors.primaryDark} /> : <Text style={AS.saveBtnText}>שמור</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditing(null)} style={[AS.cancelBtn, webPointer]}>
            <Text style={AS.cancelBtnText}>ביטול</Text>
          </TouchableOpacity>
        </View>
      </AdminSheet>
    </SafeAreaView>
  );
}
