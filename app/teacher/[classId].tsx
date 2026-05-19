/**
 * Class Detail Screen — /teacher/[classId]
 *
 * Layout (mobile, scrollable):
 *   1. Back header
 *   2. PomPomJar (class total vs. goal) — centred, top of content
 *   3. "הוסף נקודות לכיתה" CTA → opens DeedPickerSheet (awards deed to every student)
 *   4. Student list (each row: name, credits, per-student give-credit & history buttons)
 *
 * Deed picker sheet: scrollable list of pill-style selectable buttons, confirm button.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Plus, ClipboardList, Users, Trash2, Pencil, UserPlus, Trophy, Upload } from 'lucide-react-native';

import { PomPomJar } from '@/components/PomPomJar';
import AdminSheet from '@/components/AdminSheet';
import { Colors } from '@/components/ui';
import { AS } from '@/lib/adminStyles';
import { shadow } from '@/lib/shadow';

import { useClassStudents, CreditEventWithDetails } from '@/hooks/useClassStudents';
import { useDeeds } from '@/hooks/useDeeds';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminLayout } from '@/lib/adminStyles';
import { confirmAction } from '@/lib/confirm';
import { safeBack } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';

import type { Tables } from '@/types/supabase';
import moment from 'moment';
import 'moment/locale/he';

moment.locale('he');

type StudentRow = Tables<'students'>;
type DeedRow    = Tables<'deeds'>;
type ClassRow   = Tables<'classes'>;

const ptr = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};

// ── Deed Picker Sheet ─────────────────────────────────────────────────────────

interface DeedPickerSheetProps {
  visible: boolean;
  className: string;
  studentCount: number;
  deeds: DeedRow[];
  onClose: () => void;
  onConfirm: (deed: DeedRow) => Promise<void>;
}

function DeedPickerSheet({
  visible,
  className,
  studentCount,
  deeds,
  onClose,
  onConfirm,
}: DeedPickerSheetProps) {
  const [selectedDeedId, setSelectedDeedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sortedDeeds = useMemo(
    () => [...deeds].sort((a, b) => b.amount - a.amount),
    [deeds],
  );
  const selectedDeed = deeds.find((d) => d.id === selectedDeedId);

  async function handleConfirm() {
    if (!selectedDeed) return;
    setSubmitting(true);
    try {
      await onConfirm(selectedDeed);
      setSelectedDeedId(null);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setSelectedDeedId(null);
    onClose();
  }

  const canConfirm = !!selectedDeedId && !submitting;

  return (
    <AdminSheet visible={visible} onClose={handleClose}>
      <Text style={S.sheetTitle} accessibilityRole="header">
        הוסף נקודות לכיתה
      </Text>
      <Text style={S.sheetSub}>
        כיתה {className} · {studentCount} תלמידים יקבלו נקודות
      </Text>

      {/* Deed list */}
      <Text style={S.sectionLabel}>בחר מעשה טוב</Text>
      <Text style={S.sectionHint}>כל תלמידי הכיתה יקבלו את הנקודות</Text>

      <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ maxHeight: 300 }}
          contentContainerStyle={S.deedList}
          accessibilityRole="radiogroup"
          accessibilityLabel="רשימת מעשים טובים"
        >
          {sortedDeeds.map((deed) => {
            const active = selectedDeedId === deed.id;
            return (
              <TouchableOpacity
                key={deed.id}
                onPress={() => setSelectedDeedId(deed.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={`${deed.name} — ${deed.amount} נקודות`}
                style={[
                  S.deedPill,
                  active ? S.deedPillActive : S.deedPillInactive,
                  ptr,
                ]}
              >
                <Text style={[S.deedAmount, active ? S.deedAmountActive : S.deedAmountInactive]}>
                  +{deed.amount}
                </Text>
                <Text style={[S.deedName, active ? S.deedNameActive : S.deedNameInactive]}>
                  {deed.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

      {/* Selected summary */}
      {selectedDeed && (
        <View style={S.selectedSummary}>
          <Text style={S.selectedSummaryText}>
            {studentCount} תלמידים יקבלו {selectedDeed.amount} נקודות כל אחד
          </Text>
          <Text style={S.selectedSummaryTotal}>
            סה״כ: +{selectedDeed.amount * studentCount} נקודות לכיתה
          </Text>
        </View>
      )}

      {/* Buttons */}
      <View style={[AS.sheetBtns, { marginTop: 20 }]}>
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={!canConfirm}
          accessibilityRole="button"
          accessibilityLabel="אשר הוספת נקודות לכיתה"
          accessibilityState={{ disabled: !canConfirm }}
          style={[
            canConfirm ? AS.saveBtn : AS.saveBtnDisabled,
            ptr,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.primaryDark} />
          ) : (
            <Text style={AS.saveBtnText}>הוסף נקודות</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="ביטול"
          style={[AS.cancelBtn, ptr]}
        >
          <Text style={AS.cancelBtnText}>ביטול</Text>
        </TouchableOpacity>
      </View>
    </AdminSheet>
  );
}

// ── Give Credit Modal (per student) ──────────────────────────────────────────

interface GiveCreditSheetProps {
  visible: boolean;
  student: StudentRow | null;
  deeds: DeedRow[];
  userId: string;
  onClose: () => void;
  onSuccess: (studentId: string, amount: number) => void;
}

function GiveCreditSheet({ visible, student, deeds, userId, onClose, onSuccess }: GiveCreditSheetProps) {
  const [selectedDeedId, setSelectedDeedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const sortedDeeds = useMemo(
    () => [...deeds].sort((a, b) => b.amount - a.amount),
    [deeds],
  );
  const selectedDeed = deeds.find((d) => d.id === selectedDeedId);

  async function handleSubmit() {
    if (!student || !selectedDeedId || !selectedDeed) return;
    setSubmitting(true);
    const { error } = await supabase.from('credit_events').insert({
      student_id: student.id,
      deed_id:    selectedDeedId,
      amount:     selectedDeed.amount,
      note:       note.trim() || null,
      given_by:   userId,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('שגיאה', error.message);
    } else {
      setSelectedDeedId(null);
      setNote('');
      onSuccess(student.id, selectedDeed.amount);
    }
  }

  function handleClose() {
    setSelectedDeedId(null);
    setNote('');
    onClose();
  }

  const canConfirm = !!selectedDeedId && !submitting;

  return (
    <AdminSheet visible={visible} onClose={handleClose}>
      <Text style={S.sheetTitle} accessibilityRole="header">הוסף נקודה</Text>
      {student && (
        <Text style={S.sheetSub}>עבור {student.first_name} {student.last_name}</Text>
      )}

      <Text style={S.sectionLabel}>בחר מעשה טוב</Text>
      <View style={S.deedRowWrap}>
        {sortedDeeds.map((deed) => {
          const active = selectedDeedId === deed.id;
          return (
            <TouchableOpacity
              key={deed.id}
              onPress={() => setSelectedDeedId(deed.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${deed.name} — ${deed.amount} נקודות`}
              style={[S.deedPill, active ? S.deedPillActive : S.deedPillInactive, ptr]}
            >
              <Text style={[S.deedAmount, active ? S.deedAmountActive : S.deedAmountInactive]}>
                +{deed.amount}
              </Text>
              <Text style={[S.deedName, active ? S.deedNameActive : S.deedNameInactive]}>
                {deed.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[S.sectionLabel, { marginTop: 8 }]}>הערה (אופציונלי)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="לדוגמה: עזרה לחבר בשיעורי בית"
        placeholderTextColor="#94a3b8"
        textAlign="right"
        multiline
        numberOfLines={2}
        style={S.noteInput}
        accessibilityLabel="הערה על המעשה הטוב"
      />

      <View style={[AS.sheetBtns, { marginTop: 4 }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canConfirm}
          accessibilityRole="button"
          accessibilityLabel="אשר הוספת נקודה"
          accessibilityState={{ disabled: !canConfirm }}
          style={[canConfirm ? AS.saveBtn : AS.saveBtnDisabled, ptr]}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.primaryDark} />
          ) : (
            <Text style={AS.saveBtnText}>אשר</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="ביטול"
          style={[AS.cancelBtn, ptr]}
        >
          <Text style={AS.cancelBtnText}>ביטול</Text>
        </TouchableOpacity>
      </View>
    </AdminSheet>
  );
}

// ── Class-wide credit (1–10 points, no per-student attribution) ─────────────

interface ClassCreditSheetProps {
  visible: boolean;
  className: string;
  userId: string;
  classId: string;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

function ClassCreditSheet({
  visible,
  className,
  userId,
  classId,
  onClose,
  onSuccess,
}: ClassCreditSheetProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!amount) return;
    setSubmitting(true);
    const { error } = await supabase.from('class_credit_events').insert({
      class_id: classId,
      amount,
      note: note.trim() || null,
      given_by: userId,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('שגיאה', error.message);
    } else {
      setAmount(null);
      setNote('');
      onSuccess(amount);
    }
  }

  function handleClose() {
    setAmount(null);
    setNote('');
    onClose();
  }

  const canConfirm = !!amount && !submitting;

  return (
    <AdminSheet visible={visible} onClose={handleClose}>
      <Text style={S.sheetTitle} accessibilityRole="header">זיכוי לכל הכיתה</Text>
      <Text style={S.sheetSub}>כיתה {className} — הנקודות יתווספו לסך הכיתה</Text>

      <Text style={S.sectionLabel}>כמות נקודות</Text>
      <View style={S.amountRow}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const active = amount === n;
          return (
            <TouchableOpacity
              key={n}
              onPress={() => setAmount(n)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${n} נקודות`}
              style={[S.amountBtn, active ? S.amountBtnActive : S.amountBtnInactive, ptr]}
            >
              <Text style={[S.amountBtnText, active && S.amountBtnTextActive]}>{n}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[S.sectionLabel, { marginTop: 8 }]}>הערה (אופציונלי)</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="לדוגמה: עזרה בניקיון הכיתה"
        placeholderTextColor="#94a3b8"
        textAlign="right"
        multiline
        numberOfLines={2}
        style={S.noteInput}
        accessibilityLabel="הערה"
      />

      <View style={[AS.sheetBtns, { marginTop: 4 }]}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canConfirm}
          accessibilityRole="button"
          accessibilityLabel="אשר זיכוי לכיתה"
          style={[canConfirm ? AS.saveBtn : AS.saveBtnDisabled, ptr]}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.primaryDark} />
          ) : (
            <Text style={AS.saveBtnText}>אשר</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClose} style={[AS.cancelBtn, ptr]} accessibilityRole="button" accessibilityLabel="ביטול">
          <Text style={AS.cancelBtnText}>ביטול</Text>
        </TouchableOpacity>
      </View>
    </AdminSheet>
  );
}

// ── History Sheet (per student) ───────────────────────────────────────────────

interface HistorySheetProps {
  visible: boolean;
  student: StudentRow | null;
  events: CreditEventWithDetails[];
  currentUserId: string;
  isAdmin: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

function HistorySheet({ visible, student, events, currentUserId, isAdmin, onClose, onDeleted }: HistorySheetProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const studentEvents = events.filter((e) => e.student_id === student?.id);

  async function handleDelete(eventId: string) {
    confirmAction(
      'מחיקת נקודה',
      'למחוק את הנקודה?',
      async () => {
        setDeleting(eventId);
        const { error } = await supabase.from('credit_events').delete().eq('id', eventId);
        setDeleting(null);
        if (error) Alert.alert('שגיאה', error.message);
        else onDeleted();
      },
    );
  }

  return (
    <AdminSheet visible={visible} onClose={onClose}>
      <View style={S.historyHeader}>
        <Text style={S.sheetTitle} accessibilityRole="header">היסטוריית נקודות</Text>
        {student && (
          <Text style={S.sheetSub}>{student.first_name} {student.last_name}</Text>
        )}
      </View>

      <FlatList
        data={studentEvents}
        keyExtractor={(item) => item.id}
        style={{ maxHeight: 420 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={S.emptyText}>אין נקודות עדיין</Text>
        }
        renderItem={({ item }) => {
          const canDelete = isAdmin || item.given_by === currentUserId;
          return (
            <View
              style={S.historyItem}
              accessibilityLabel={`${item.deed?.name ?? 'מעשה טוב'} — ${item.amount} נקודות, ${moment(item.created_at).fromNow()}`}
            >
              <View style={S.historyItemLeft}>
                <View style={S.historyTopRow}>
                  <View style={S.historyAmtBadge}>
                    <Text style={S.historyAmtText}>+{item.amount}</Text>
                  </View>
                  <Text style={S.historyDeedName}>{item.deed?.name ?? 'מעשה טוב'}</Text>
                </View>
                {item.note && <Text style={S.historyNote}>{item.note}</Text>}
                <View style={S.historyMeta}>
                  <Text style={S.historyMetaText}>{moment(item.created_at).fromNow()}</Text>
                  <Text style={S.historyMetaDot}>·</Text>
                  <Text style={S.historyMetaText}>{item.given_by_user?.display_name ?? 'מורה'}</Text>
                </View>
              </View>
              {canDelete && (
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`מחק נקודה: ${item.deed?.name}`}
                  style={[S.deleteBtn, ptr]}
                >
                  {deleting === item.id ? (
                    <ActivityIndicator size="small" color={Colors.danger} />
                  ) : (
                    <Trash2 size={16} color={Colors.danger} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </AdminSheet>
  );
}

// ── Student Row ───────────────────────────────────────────────────────────────

interface StudentItemProps {
  student: StudentRow;
  credits: number;
  onGiveCredit: () => void;
  onViewHistory: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function StudentItem({ student, credits, onGiveCredit, onViewHistory, onEdit, onDelete }: StudentItemProps) {
  const { first_name, last_name } = student;
  return (
    <View
      style={S.studentRow}
      accessibilityLabel={`${first_name} ${last_name} — ${credits} נקודות`}
    >
      {/* Left: avatar + name */}
      <View style={S.studentLeft}>
        <View style={S.studentAvatar}>
          <Text style={S.studentAvatarText}>
            {first_name.charAt(0)}{last_name.charAt(0)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.studentName}>{first_name} {last_name}</Text>
          <Text style={S.studentPoints}>{credits} נקודות</Text>
        </View>
      </View>

      {/* Right: action buttons */}
      <View style={S.studentActions}>
        <TouchableOpacity
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`מחק ${first_name} ${last_name}`}
          style={[S.studentDeleteBtn, ptr]}
        >
          <Trash2 size={15} color={Colors.danger} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`ערוך ${first_name} ${last_name}`}
          style={[S.studentSecondaryBtn, ptr]}
        >
          <Pencil size={15} color={Colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onViewHistory}
          accessibilityRole="button"
          accessibilityLabel={`היסטוריית נקודות של ${first_name} ${last_name}`}
          style={[S.studentSecondaryBtn, ptr]}
        >
          <ClipboardList size={15} color={Colors.muted} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onGiveCredit}
          accessibilityRole="button"
          accessibilityLabel={`הוסף נקודה ל${first_name} ${last_name}`}
          style={[S.giveBtn, ptr]}
        >
          <Plus size={13} color="#fff" />
          <Text style={S.giveBtnText}>נקודה</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ClassDetailScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const { user, isAdmin } = useAuth();          // ← single call, shared below
  const { settings } = useSettings();
  const { pageContent } = useAdminLayout();
  const { deeds } = useDeeds();                  // ← single call, passed to sheets

  // Fetch only this one class (not all classes)
  const [classRow, setClassRow] = useState<ClassRow | null>(null);
  React.useEffect(() => {
    if (!classId) return;
    supabase.from('classes').select('*').eq('id', classId).maybeSingle()
      .then(({ data }) => setClassRow(data ?? null));
  }, [classId]);

  const {
    students,
    creditEvents,
    classLevelCredits,
    loading: studentsLoading,
    error: studentsError,
    refetch,
  } = useClassStudents(classId ?? null);

  const goal = settings?.global_goal ?? 100;

  // Local optimistic state
  const [deletedStudentIds,      setDeletedStudentIds]      = useState<Set<string>>(new Set());
  const [locallyAddedStudents,   setLocallyAddedStudents]   = useState<Array<{ student: StudentRow; credits: number }>>([]);
  const [localCreditAdjustments, setLocalCreditAdjustments] = useState<Record<string, number>>({});
  const [localClassCredits, setLocalClassCredits] = useState(0);

  // Sheet visibility
  const [deedPickerVisible,  setDeedPickerVisible]  = useState(false);
  const [classCreditVisible, setClassCreditVisible] = useState(false);
  const [giveCreditStudent,  setGiveCreditStudent]  = useState<StudentRow | null>(null);
  const [historyStudent,     setHistoryStudent]     = useState<StudentRow | null>(null);
  const [studentSheetVisible,setStudentSheetVisible]= useState(false);
  const [editingStudent,     setEditingStudent]     = useState<StudentRow | null>(null);
  const [studentFirstName,   setStudentFirstName]   = useState('');
  const [studentLastName,    setStudentLastName]    = useState('');
  const [savingStudent,      setSavingStudent]      = useState(false);

  // Derived student list (with optimistic mutations)
  const visibleStudents = useMemo(() => [
    ...students
      .filter(({ student }) => !deletedStudentIds.has(student.id))
      .map(({ student, credits }) => ({
        student,
        credits: credits + (localCreditAdjustments[student.id] ?? 0),
      })),
    ...locallyAddedStudents
      .filter(({ student }) => !deletedStudentIds.has(student.id))
      .map(({ student, credits }) => ({
        student,
        credits: credits + (localCreditAdjustments[student.id] ?? 0),
      })),
  ], [students, locallyAddedStudents, deletedStudentIds, localCreditAdjustments]);

  const studentTotal = visibleStudents.reduce((sum, s) => sum + s.credits, 0);
  const classTotal   = studentTotal + classLevelCredits + localClassCredits;
  const cappedTotal  = Math.min(classTotal, goal);

  // ── Class-wide deed: insert credit_events for every student ──────────────
  const handleClassDeed = useCallback(async (deed: DeedRow) => {
    if (!classId || !user) throw new Error('חסרים נתונים');
    if (visibleStudents.length === 0) {
      Alert.alert('אין תלמידים', 'הכיתה ריקה — אין תלמידים לתת נקודות');
      return;
    }

    const rows = visibleStudents.map(({ student }) => ({
      student_id: student.id,
      deed_id:    deed.id,
      amount:     deed.amount,
      note:       null as string | null,
      given_by:   user.id,
    }));

    const { error } = await supabase.from('credit_events').insert(rows);
    if (error) {
      Alert.alert('שגיאה', error.message);
      return;
    }

    // Optimistic: bump every student's local credits
    setLocalCreditAdjustments((prev) => {
      const next = { ...prev };
      for (const { student } of visibleStudents) {
        next[student.id] = (next[student.id] ?? 0) + deed.amount;
      }
      return next;
    });

    setDeedPickerVisible(false);
    refetch();
  }, [classId, user, visibleStudents, refetch]);

  // ── Student CRUD ──────────────────────────────────────────────────────────
  function openAddStudent() {
    setEditingStudent(null);
    setStudentFirstName('');
    setStudentLastName('');
    setStudentSheetVisible(true);
  }
  function openEditStudent(s: StudentRow) {
    setEditingStudent(s);
    setStudentFirstName(s.first_name);
    setStudentLastName(s.last_name);
    setStudentSheetVisible(true);
  }

  async function handleSaveStudent() {
    if (!studentFirstName.trim() || !studentLastName.trim()) {
      Alert.alert('שגיאה', 'נא למלא שם פרטי ושם משפחה');
      return;
    }
    if (!classId) return;
    setSavingStudent(true);

    if (editingStudent) {
      const { error } = await supabase
        .from('students')
        .update({ first_name: studentFirstName.trim(), last_name: studentLastName.trim() })
        .eq('id', editingStudent.id);
      setSavingStudent(false);
      if (error) { Alert.alert('שגיאה', error.message); return; }
      setLocallyAddedStudents([]);
      setDeletedStudentIds(new Set());
      refetch();
    } else {
      const { data: newStudent, error } = await supabase
        .from('students')
        .insert({ first_name: studentFirstName.trim(), last_name: studentLastName.trim(), class_id: classId })
        .select()
        .single();
      setSavingStudent(false);
      if (error) { Alert.alert('שגיאה', error.message); return; }
      setLocallyAddedStudents((prev) => [...prev, { student: newStudent, credits: 0 }]);
    }
    setStudentSheetVisible(false);
  }

  async function handleDeleteStudent(s: StudentRow) {
    confirmAction(
      'מחיקת תלמיד',
      `למחוק את ${s.first_name} ${s.last_name}?`,
      async () => {
        const { error } = await supabase.from('students').delete().eq('id', s.id);
        if (error) Alert.alert('שגיאה', error.message);
        else setDeletedStudentIds((prev) => new Set([...prev, s.id]));
      },
      'מחק',
    );
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (!classId) {
    return (
      <SafeAreaView style={S.screen}>
        <Text style={S.emptyText}>לא נבחרה כיתה</Text>
      </SafeAreaView>
    );
  }

  const className = classRow?.name ?? '';

  return (
    <SafeAreaView style={S.screen}>

      {/* ── Header ── */}
      <View style={S.headerBar}>
        <View style={[S.header, pageContent]}>
          <TouchableOpacity
            onPress={() => safeBack(router, '/teacher')}
            accessibilityRole="button"
            accessibilityLabel="חזור"
            style={[S.backBtn, ptr]}
          >
            <ChevronRight size={20} color={Colors.primaryDark} />
          </TouchableOpacity>
          <View style={S.headerTitleWrap}>
            <Text style={S.headerTitle} accessibilityRole="header">
              כיתה {className}
            </Text>
            <Text style={S.headerSub}>
              {visibleStudents.length} תלמידים
              {classRow?.grade ? ` · שכבה ${classRow.grade}` : ''}
            </Text>
          </View>
          {/* Add student button */}
          <TouchableOpacity
            onPress={openAddStudent}
            accessibilityRole="button"
            accessibilityLabel="הוסף תלמיד"
            style={[S.headerAddBtn, ptr]}
          >
            <UserPlus size={18} color={Colors.primaryDark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={pageContent}>

        {/* ── 1. PomPom Jar ── */}
        <View style={S.jarSection}>
          <PomPomJar current={cappedTotal} goal={goal} />
          {cappedTotal >= goal && (
            <View style={S.goalReachedBadge}>
              <Trophy size={14} color="#065f46" />
              <Text style={S.goalReachedText}>הכיתה הגיעה למטרה!</Text>
            </View>
          )}
        </View>

        {/* ── 2. Class credit CTAs ── */}
        <View style={S.classCtaRow}>
          <TouchableOpacity
            onPress={() => setDeedPickerVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="הוסף נקודות לכל תלמידי הכיתה"
            style={[S.classCtaBtn, S.classCtaBtnHalf, ptr]}
            disabled={visibleStudents.length === 0}
          >
            <Plus size={18} color={Colors.primaryDark} />
            <Text style={S.classCtaBtnText}>נקודות לכל תלמיד</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setClassCreditVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="זיכוי לכל הכיתה"
            style={[S.classCtaBtnAlt, S.classCtaBtnHalf, ptr]}
          >
            <Plus size={18} color="#fff" />
            <Text style={S.classCtaBtnAltText}>זיכוי לכל הכיתה</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. Student list ── */}
        <View style={S.studentsSection}>
          <View style={S.studentsHeaderRow}>
            <Text style={S.studentsLabel}>
              תלמידים ({visibleStudents.length})
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/teacher/upload?classId=${classId}`)}
              accessibilityRole="button"
              accessibilityLabel="העלאת רשימת תלמידים מ-CSV"
              style={[S.uploadBtn, ptr]}
            >
              <Upload size={13} color={Colors.primary} />
              <Text style={S.uploadBtnText}>ייבוא CSV</Text>
            </TouchableOpacity>
          </View>

          {studentsLoading ? (
            <ActivityIndicator
              color={Colors.primary}
              style={{ marginVertical: 40 }}
              accessibilityLabel="טוען תלמידים"
            />
          ) : studentsError ? (
            <Text style={[S.emptyText, { color: Colors.danger }]}>{studentsError}</Text>
          ) : visibleStudents.length === 0 ? (
            <View style={S.emptyCard}>
              <View style={S.emptyIconBox}>
                <Users size={24} color={Colors.muted} />
              </View>
              <Text style={S.emptyCardText}>אין תלמידים בכיתה</Text>
              <TouchableOpacity
                onPress={() => router.push(`/teacher/upload?classId=${classId}`)}
                accessibilityRole="button"
                accessibilityLabel="העלה רשימת תלמידים"
                style={[S.uploadLink, ptr]}
              >
                <Upload size={14} color={Colors.primary} />
                <Text style={S.uploadLinkText}>העלה רשימת תלמידים</Text>
              </TouchableOpacity>
            </View>
          ) : (
            visibleStudents.map(({ student, credits }) => (
              <StudentItem
                key={student.id}
                student={student}
                credits={credits}
                onGiveCredit={() => setGiveCreditStudent(student)}
                onViewHistory={() => setHistoryStudent(student)}
                onEdit={() => openEditStudent(student)}
                onDelete={() => handleDeleteStudent(student)}
              />
            ))
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 32 }} />
      </View>{/* /pageContent */}
      </ScrollView>

      <ClassCreditSheet
        visible={classCreditVisible}
        className={className}
        userId={user?.id ?? ''}
        classId={classId}
        onClose={() => setClassCreditVisible(false)}
        onSuccess={(amt) => {
          setClassCreditVisible(false);
          setLocalClassCredits((prev) => prev + amt);
          refetch();
        }}
      />

      {/* ── Class Deed Picker Sheet ── */}
      <DeedPickerSheet
        visible={deedPickerVisible}
        className={className}
        studentCount={visibleStudents.length}
        deeds={deeds}
        onClose={() => setDeedPickerVisible(false)}
        onConfirm={handleClassDeed}
      />

      {/* ── Per-Student Give Credit Sheet ── */}
      <GiveCreditSheet
        visible={!!giveCreditStudent}
        student={giveCreditStudent}
        deeds={deeds}
        userId={user?.id ?? ''}
        onClose={() => setGiveCreditStudent(null)}
        onSuccess={(studentId, amount) => {
          setGiveCreditStudent(null);
          setLocalCreditAdjustments((prev) => ({
            ...prev,
            [studentId]: (prev[studentId] ?? 0) + amount,
          }));
          refetch();
        }}
      />

      {/* ── Per-Student History Sheet ── */}
      <HistorySheet
        visible={!!historyStudent}
        student={historyStudent}
        events={creditEvents}
        currentUserId={user?.id ?? ''}
        isAdmin={isAdmin}
        onClose={() => setHistoryStudent(null)}
        onDeleted={refetch}
      />

      {/* ── Add / Edit Student Sheet ── */}
      <AdminSheet visible={studentSheetVisible} onClose={() => setStudentSheetVisible(false)}>
        <Text style={S.sheetTitle} accessibilityRole="header">
          {editingStudent
            ? `ערוך תלמיד — ${editingStudent.first_name} ${editingStudent.last_name}`
            : 'הוסף תלמיד'}
        </Text>

        <Text style={AS.fieldLabel}>שם פרטי</Text>
        <TextInput
          value={studentFirstName}
          onChangeText={setStudentFirstName}
          placeholder="לדוגמה: יוסי"
          placeholderTextColor="#94a3b8"
          textAlign="right"
          style={S.formInput}
          accessibilityLabel="שם פרטי"
          autoCapitalize="words"
        />

        <Text style={AS.fieldLabel}>שם משפחה</Text>
        <TextInput
          value={studentLastName}
          onChangeText={setStudentLastName}
          placeholder="לדוגמה: כהן"
          placeholderTextColor="#94a3b8"
          textAlign="right"
          style={[S.formInput, { marginBottom: 24 }]}
          accessibilityLabel="שם משפחה"
          autoCapitalize="words"
        />

        <View style={AS.sheetBtns}>
          <TouchableOpacity
            onPress={handleSaveStudent}
            disabled={savingStudent || !studentFirstName.trim() || !studentLastName.trim()}
            accessibilityRole="button"
            accessibilityLabel="שמור תלמיד"
            style={[
              (savingStudent || !studentFirstName.trim() || !studentLastName.trim())
                ? AS.saveBtnDisabled
                : AS.saveBtn,
              ptr,
            ]}
          >
            {savingStudent ? (
              <ActivityIndicator color={Colors.primaryDark} />
            ) : (
              <Text style={AS.saveBtnText}>
                {editingStudent ? 'שמור שינויים' : 'הוסף תלמיד'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStudentSheetVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="ביטול"
            style={[AS.cancelBtn, ptr]}
          >
            <Text style={AS.cancelBtnText}>ביטול</Text>
          </TouchableOpacity>
        </View>
      </AdminSheet>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },

  // ── Header ──
  headerBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 3px 0 #5b4300' } as any) : {}),
  },
  headerTitleWrap: { flex: 1, alignItems: 'flex-end' },
  headerTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl', textAlign: 'right',
  } as any,
  headerSub: {
    fontSize: 12, color: Colors.muted,
    writingDirection: 'rtl', textAlign: 'right', marginTop: 1,
  } as any,
  headerAddBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Scroll content ──
  scrollContent: {
    paddingBottom: 32,
  },

  // ── Jar section ──
  jarSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  goalReachedBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#d1fae5',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 16,
  },
  goalReachedText: {
    color: '#065f46', fontWeight: '700', fontSize: 14,
    writingDirection: 'rtl',
  } as any,

  classCtaRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  classCtaBtnHalf: { flex: 1 },
  classCtaBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    minHeight: 52,
    ...shadow(Colors.primaryDark, 4, 0, 1, 4),
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 5px 0 #5b4300' } as any) : {}),
  },
  classCtaBtnText: {
    color: Colors.primaryDark,
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
  } as any,
  classCtaBtnAlt: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    paddingVertical: 14,
    minHeight: 52,
    ...shadow('#1e3a5f', 4, 0, 1, 4),
  },
  classCtaBtnAltText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
  } as any,
  amountRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  amountBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  amountBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  amountBtnInactive: { backgroundColor: '#fff', borderColor: Colors.border },
  amountBtnText: { fontWeight: '700', fontSize: 16, color: '#334155' } as any,
  amountBtnTextActive: { color: Colors.primaryDark },

  // ── Students section ──
  studentsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  studentsHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  studentsLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    writingDirection: 'rtl',
  } as any,
  uploadBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryLight, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 7, minHeight: 36,
  },
  uploadBtnText: {
    color: Colors.primary, fontSize: 12, fontWeight: '600',
    writingDirection: 'rtl',
  } as any,

  // ── Student row ──
  studentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    ...shadow('#64748b', 2, 8, 0.08, 3),
  },
  studentLeft: {
    flexDirection: 'row-reverse', alignItems: 'center', flex: 1, gap: 10,
  },
  studentAvatar: {
    backgroundColor: Colors.primaryLight, borderRadius: 12,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  studentAvatarText: {
    color: Colors.primaryDark, fontWeight: '700', fontSize: 12,
  } as any,
  studentName: {
    color: '#1e293b', fontWeight: '700', fontSize: 14,
    textAlign: 'right', writingDirection: 'rtl',
  } as any,
  studentPoints: {
    color: '#94a3b8', fontSize: 12, textAlign: 'right', writingDirection: 'rtl', marginTop: 1,
  } as any,
  studentActions: { flexDirection: 'row-reverse', gap: 6, alignItems: 'center' },
  studentSecondaryBtn: {
    backgroundColor: '#f8fafc', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0',
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  studentDeleteBtn: {
    backgroundColor: '#FEF2F2', borderRadius: 10, borderWidth: 1, borderColor: '#fecaca',
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  giveBtn: {
    backgroundColor: Colors.primary, borderRadius: 10, height: 36,
    paddingHorizontal: 12, flexDirection: 'row-reverse', alignItems: 'center', gap: 4,
  },
  giveBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' } as any,

  // ── Empty card ──
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9',
  },
  emptyIconBox: {
    width: 56, height: 56, backgroundColor: '#f1f5f9', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyCardText: {
    color: Colors.muted, fontSize: 14, textAlign: 'center', writingDirection: 'rtl',
  } as any,
  uploadLink: {
    marginTop: 12, minHeight: 44, flexDirection: 'row-reverse',
    justifyContent: 'center', alignItems: 'center', gap: 6,
  },
  uploadLinkText: {
    color: Colors.primary, fontSize: 14, fontWeight: '500', writingDirection: 'rtl',
  } as any,
  emptyText: {
    color: Colors.muted, textAlign: 'center', paddingVertical: 32, writingDirection: 'rtl',
  } as any,

  // ── Sheet titles ──
  sheetTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.primaryDark,
    textAlign: 'right', marginBottom: 4,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  sheetSub: {
    color: Colors.muted, fontSize: 14, textAlign: 'right',
    marginBottom: 20, writingDirection: 'rtl',
  } as any,
  sectionLabel: {
    color: '#334155', fontWeight: '600', fontSize: 14,
    textAlign: 'right', marginBottom: 4, writingDirection: 'rtl',
  } as any,
  sectionHint: {
    color: '#94a3b8', fontSize: 12, textAlign: 'right',
    marginBottom: 12, writingDirection: 'rtl',
  } as any,

  // ── Deed pills ──
  deedList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  deedRowWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  deedPill: {
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 14, borderWidth: 2,
    alignItems: 'center', minWidth: 80,
  },
  deedPillActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  deedPillInactive: { backgroundColor: '#fff', borderColor: Colors.border },
  deedAmount: { fontWeight: '700', fontSize: 18 } as any,
  deedAmountActive:   { color: Colors.primaryDark },
  deedAmountInactive: { color: '#1e293b' },
  deedName: { fontSize: 11, marginTop: 3, textAlign: 'center', writingDirection: 'rtl' } as any,
  deedNameActive:   { color: Colors.primaryDark },
  deedNameInactive: { color: '#94a3b8' },

  // ── Selected summary ──
  selectedSummary: {
    backgroundColor: Colors.primaryLight, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12, marginTop: 8,
    alignItems: 'flex-end',
  },
  selectedSummaryText: {
    color: Colors.primaryDark, fontSize: 14, fontWeight: '600',
    textAlign: 'right', writingDirection: 'rtl',
  } as any,
  selectedSummaryTotal: {
    color: Colors.primaryDark, fontSize: 16, fontWeight: '700',
    textAlign: 'right', writingDirection: 'rtl', marginTop: 4,
    fontFamily: 'Baloo2_700Bold',
  } as any,

  // ── Note input ──
  noteInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: '#1e293b', fontSize: 14, textAlign: 'right', marginBottom: 20,
    writingDirection: 'rtl',
    fontFamily: 'Nunito_400Regular',
  } as any,

  // ── Form input ──
  formInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: Colors.text, fontSize: 16, textAlign: 'right', marginBottom: 12,
    writingDirection: 'rtl',
  } as any,

  // ── History items ──
  historyHeader: { alignItems: 'flex-end', marginBottom: 4 },
  historyItem: {
    flexDirection: 'row-reverse', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: Colors.bg, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9',
  },
  historyItemLeft: { flex: 1, marginLeft: 12 },
  historyTopRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 2 },
  historyAmtBadge: {
    backgroundColor: '#DBEAFE', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2,
  },
  historyAmtText: { color: '#1d4ed8', fontWeight: '700', fontSize: 12 } as any,
  historyDeedName: {
    color: '#1e293b', fontWeight: '500', fontSize: 14,
    textAlign: 'right', writingDirection: 'rtl',
  } as any,
  historyNote: {
    color: '#64748b', fontSize: 12, textAlign: 'right', marginTop: 2, writingDirection: 'rtl',
  } as any,
  historyMeta: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 4 },
  historyMetaText: { color: '#94a3b8', fontSize: 12, writingDirection: 'rtl' } as any,
  historyMetaDot:  { color: '#cbd5e1', fontSize: 12 },
  deleteBtn: {
    backgroundColor: '#FEF2F2', borderRadius: 12,
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
  },
});
