/**
 * Class Detail Screen — /teacher/[classId]
 *
 * Layout (mobile, scrollable):
 *   1. Back header
 *   2. PompomJar (class total vs. goal) — centred, top of content
 *   3. "הוספת נקודות לכיתה" CTA
 *   4. Student list (each row: name, credits, per-student actions)
 */

import React, { useState, useMemo } from 'react';
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
import { ChevronRight, Plus, ClipboardList, Users, Trash2, Pencil, Trophy, Upload } from 'lucide-react-native';

import { PompomJar } from '@/components/PomPomJar';
import AdminSheet from '@/components/AdminSheet';
import StudentCsvUploadSheet from '@/components/StudentCsvUploadSheet';
import { Colors, TactileIconBtn, AddBtn, DepthPressable } from '@/components/ui';
import { AS } from '@/lib/adminStyles';

import { useClassStudents, CreditEventWithDetails, ClassCreditEventWithDetails } from '@/hooks/useClassStudents';
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
      <Text style={S.sheetTitle} accessibilityRole="header">הוספת נקודות לכיתה</Text>
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
          accessibilityLabel="אשר הוספת נקודות לכיתה"
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

// ── Edit class credit entry ───────────────────────────────────────────────────

interface EditClassCreditSheetProps {
  visible: boolean;
  event: ClassCreditEventWithDetails | null;
  onClose: () => void;
  onSaved: () => void;
}

function EditClassCreditSheet({ visible, event, onClose, onSaved }: EditClassCreditSheetProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (event) {
      setAmount(event.amount);
      setNote(event.note ?? '');
    }
  }, [event]);

  async function handleSubmit() {
    if (!event || !amount) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('class_credit_events')
      .update({ amount, note: note.trim() || null })
      .eq('id', event.id);
    setSubmitting(false);
    if (error) Alert.alert('שגיאה', error.message);
    else onSaved();
  }

  function handleClose() {
    setAmount(null);
    setNote('');
    onClose();
  }

  const canConfirm = !!amount && !submitting;

  return (
    <AdminSheet visible={visible} onClose={handleClose}>
      <Text style={S.sheetTitle} accessibilityRole="header">עריכת נקודות לכיתה</Text>
      <Text style={S.sheetSub}>עדכון כמות או הערה</Text>

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
        placeholder="הערה"
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
          style={[canConfirm ? AS.saveBtn : AS.saveBtnDisabled, ptr]}
          accessibilityRole="button"
          accessibilityLabel="שמור שינויים"
        >
          {submitting ? (
            <ActivityIndicator color={Colors.primaryDark} />
          ) : (
            <Text style={AS.saveBtnText}>שמור</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClose} style={[AS.cancelBtn, ptr]} accessibilityRole="button" accessibilityLabel="ביטול">
          <Text style={AS.cancelBtnText}>ביטול</Text>
        </TouchableOpacity>
      </View>
    </AdminSheet>
  );
}

// ── Class credit history (inline list) ────────────────────────────────────────

interface ClassCreditHistoryProps {
  events: ClassCreditEventWithDetails[];
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (event: ClassCreditEventWithDetails) => void;
  onDeleted: () => void;
}

function ClassCreditHistory({
  events,
  currentUserId,
  isAdmin,
  onEdit,
  onDeleted,
}: ClassCreditHistoryProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(eventId: string) {
    confirmAction(
      'מחיקת נקודות',
      'למחוק את הנקודות שניתנו לכיתה?',
      async () => {
        setDeleting(eventId);
        const { error } = await supabase.from('class_credit_events').delete().eq('id', eventId);
        setDeleting(null);
        if (error) Alert.alert('שגיאה', error.message);
        else onDeleted();
      },
    );
  }

  if (events.length === 0) return null;

  return (
    <View style={S.classHistorySection}>
      <View style={S.studentsHeaderRow}>
        <Text style={S.studentsLabel}>
          נקודות לכיתה ({events.length})
        </Text>
      </View>
      {events.map((item) => {
        const canManage = isAdmin || item.given_by === currentUserId;
        return (
          <ClassCreditItem
            key={item.id}
            item={item}
            canManage={canManage}
            deleting={deleting === item.id}
            onEdit={() => onEdit(item)}
            onDelete={() => handleDelete(item.id)}
          />
        );
      })}
    </View>
  );
}

interface ClassCreditItemProps {
  item: ClassCreditEventWithDetails;
  canManage: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function ClassCreditItem({
  item,
  canManage,
  deleting,
  onEdit,
  onDelete,
}: ClassCreditItemProps) {
  const meta = `${moment(item.created_at).fromNow()} · ${item.given_by_user?.display_name ?? 'מורה'}`;

  return (
    <View
      style={[AS.row, S.listRowInset]}
      accessibilityLabel={`${item.amount} נקודות לכיתה, ${moment(item.created_at).fromNow()}`}
    >
      <View style={S.studentAvatar}>
        <Text
          style={[
            S.studentAvatarText,
            item.amount >= 10 && S.classCreditAvatarSm,
          ]}
        >
          +{item.amount}
        </Text>
      </View>
      <View style={AS.rowLeft}>
        <Text style={AS.rowTitle}>נקודות לכיתה</Text>
        {item.note ? <Text style={S.classCreditNote}>{item.note}</Text> : null}
        <Text style={AS.rowSub}>
          {item.amount} נקודות · {meta}
        </Text>
      </View>
      {canManage && (
        <View style={AS.rowActions}>
          <TactileIconBtn
            onPress={onEdit}
            style={AS.iconBtn}
            shadowColor="rgba(79,70,50,0.12)"
            accessibilityLabel="ערוך נקודות לכיתה"
          >
            <Pencil size={16} color={Colors.muted} />
          </TactileIconBtn>
          <TactileIconBtn
            onPress={() => { if (!deleting) onDelete(); }}
            style={AS.iconBtnDanger}
            shadowColor="rgba(186,26,26,0.18)"
            accessibilityLabel="מחק נקודות לכיתה"
          >
            {deleting ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <Trash2 size={16} color={Colors.danger} />
            )}
          </TactileIconBtn>
        </View>
      )}
    </View>
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
}

function StudentItem({ student, credits, onGiveCredit, onViewHistory, onEdit }: StudentItemProps) {
  const { first_name, last_name } = student;
  return (
    <View
      style={[AS.row, S.listRowInset]}
      accessibilityLabel={`${first_name} ${last_name} — ${credits} נקודות`}
    >
      <View style={S.studentAvatar}>
        <Text style={S.studentAvatarText}>
          {first_name.charAt(0)}{last_name.charAt(0)}
        </Text>
      </View>
      <View style={AS.rowLeft}>
        <Text style={AS.rowTitle}>{first_name} {last_name}</Text>
        <Text style={AS.rowSub}>{credits} נקודות</Text>
      </View>
      <View style={AS.rowActions}>
        <TactileIconBtn
          onPress={onGiveCredit}
          style={AS.iconBtnPrimary}
          shadowColor="rgba(120,89,0,0.22)"
          accessibilityLabel={`הוסף נקודה ל${first_name} ${last_name}`}
        >
          <Plus size={16} color={Colors.primaryDark} />
        </TactileIconBtn>
        <TactileIconBtn
          onPress={onViewHistory}
          style={AS.iconBtnSecondary}
          shadowColor="rgba(0,96,172,0.2)"
          accessibilityLabel={`היסטוריית נקודות של ${first_name} ${last_name}`}
        >
          <ClipboardList size={16} color={Colors.secondary} />
        </TactileIconBtn>
        <TactileIconBtn
          onPress={onEdit}
          style={AS.iconBtn}
          shadowColor="rgba(79,70,50,0.12)"
          accessibilityLabel={`ערוך ${first_name} ${last_name}`}
        >
          <Pencil size={16} color={Colors.muted} />
        </TactileIconBtn>
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
  const { pageContent, isDesktop } = useAdminLayout();
  const scrollWrap = isDesktop
    ? { maxWidth: 960, alignSelf: 'center' as const, width: '100%' as const }
    : undefined;
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
    classCreditEvents,
    classLevelCredits,
    loading: studentsLoading,
    error: studentsError,
    refetch,
  } = useClassStudents(classId ?? null);

  const goal = settings?.global_goal ?? 100;

  // Local optimistic state
  const [locallyAddedStudents,   setLocallyAddedStudents]   = useState<Array<{ student: StudentRow; credits: number }>>([]);
  const [localCreditAdjustments, setLocalCreditAdjustments] = useState<Record<string, number>>({});
  const [localClassCredits, setLocalClassCredits] = useState(0);

  // Sheet visibility
  const [classCreditVisible, setClassCreditVisible] = useState(false);
  const [editingClassCredit, setEditingClassCredit] = useState<ClassCreditEventWithDetails | null>(null);
  const [giveCreditStudent,  setGiveCreditStudent]  = useState<StudentRow | null>(null);
  const [historyStudent,     setHistoryStudent]     = useState<StudentRow | null>(null);
  const [studentSheetVisible,setStudentSheetVisible]= useState(false);
  const [editingStudent,     setEditingStudent]     = useState<StudentRow | null>(null);
  const [studentFirstName,   setStudentFirstName]   = useState('');
  const [studentLastName,    setStudentLastName]    = useState('');
  const [savingStudent,      setSavingStudent]      = useState(false);
  const [uploadVisible,      setUploadVisible]      = useState(false);

  // Derived student list (with optimistic mutations)
  const visibleStudents = useMemo(() => [
    ...students.map(({ student, credits }) => ({
      student,
      credits: credits + (localCreditAdjustments[student.id] ?? 0),
    })),
    ...locallyAddedStudents.map(({ student, credits }) => ({
      student,
      credits: credits + (localCreditAdjustments[student.id] ?? 0),
    })),
  ], [students, locallyAddedStudents, localCreditAdjustments]);

  const studentTotal = visibleStudents.reduce((sum, s) => sum + s.credits, 0);
  const classTotal   = studentTotal + classLevelCredits + localClassCredits;
  const cappedTotal  = Math.min(classTotal, goal);

  function refreshCredits() {
    setLocalClassCredits(0);
    setLocalCreditAdjustments({});
    refetch();
  }

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
    <SafeAreaView style={S.screen} edges={['top', 'left', 'right']}>

      {/* ── Header ── */}
      <View style={AS.header}>
        <View style={[AS.headerInner, pageContent, S.headerInner]}>
          <View style={AS.headerLeft}>
            <TactileIconBtn
              onPress={() => safeBack(router, '/teacher')}
              accessibilityLabel="חזור"
              style={[AS.backBtn, ptr]}
            >
              <ChevronRight size={20} color={Colors.primaryDark} />
            </TactileIconBtn>
            <View style={S.headerTitleWrap}>
              <Text style={AS.headerTitle} accessibilityRole="header">
                כיתה {className}
              </Text>
              <Text style={S.headerSub}>
                {visibleStudents.length} תלמידים
                {classRow?.grade ? ` · שכבה ${classRow.grade}` : ''}
              </Text>
            </View>
          </View>
          <AddBtn
            onPress={openAddStudent}
            accessibilityLabel="הוסף תלמיד"
            style={ptr}
          />
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={scrollWrap}>

        {/* ── 1. PomPom Jar ── */}
        <View style={S.jarSection}>
          <PompomJar value={cappedTotal} max={goal} size="lg" showHeroStats />
          {cappedTotal >= goal && (
            <View style={S.goalReachedBadge}>
              <Trophy size={14} color="#065f46" />
              <Text style={S.goalReachedText}>הכיתה הגיעה למטרה!</Text>
            </View>
          )}
        </View>

        {/* ── 2. Class credit CTA ── */}
        <View style={S.classCtaRow}>
          <DepthPressable
            onPress={() => setClassCreditVisible(true)}
            accessibilityLabel="הוספת נקודות לכיתה"
            style={[S.classCtaBtnAlt, ptr]}
            depth={4}
            borderRadius={16}
            color="#1e3a5f"
          >
            <Plus size={18} color="#fff" />
            <Text style={S.classCtaBtnAltText}>הוספת נקודות לכיתה</Text>
          </DepthPressable>
        </View>

        {/* ── 2b. Class credit history ── */}
        <ClassCreditHistory
          events={classCreditEvents}
          currentUserId={user?.id ?? ''}
          isAdmin={isAdmin}
          onEdit={setEditingClassCredit}
          onDeleted={refreshCredits}
        />

        {/* ── 3. Student list ── */}
        <View style={S.studentsSection}>
          <View style={S.studentsHeaderRow}>
            <Text style={S.studentsLabel}>
              תלמידים ({visibleStudents.length})
            </Text>
            <TactileIconBtn
              onPress={() => setUploadVisible(true)}
              style={AS.iconBtnSecondary}
              shadowColor="rgba(0,96,172,0.2)"
              accessibilityLabel="ייבוא CSV"
            >
              <Upload size={16} color={Colors.secondary} />
            </TactileIconBtn>
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
              <TactileIconBtn
                onPress={() => setUploadVisible(true)}
                style={[AS.iconBtnSecondary, { marginTop: 12 }]}
                shadowColor="rgba(0,96,172,0.2)"
                accessibilityLabel="העלה רשימת תלמידים מ-CSV"
              >
                <Upload size={16} color={Colors.secondary} />
              </TactileIconBtn>
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
              />
            ))
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 32 }} />
      </View>{/* /pageContent */}
      </ScrollView>

      {classId ? (
        <StudentCsvUploadSheet
          visible={uploadVisible}
          classId={classId}
          className={className}
          onClose={() => setUploadVisible(false)}
          onImported={() => {
            setUploadVisible(false);
            setLocallyAddedStudents([]);
            refetch();
          }}
        />
      ) : null}

      <ClassCreditSheet
        visible={classCreditVisible}
        className={className}
        userId={user?.id ?? ''}
        classId={classId}
        onClose={() => setClassCreditVisible(false)}
        onSuccess={() => {
          setClassCreditVisible(false);
          refreshCredits();
        }}
      />

      <EditClassCreditSheet
        visible={!!editingClassCredit}
        event={editingClassCredit}
        onClose={() => setEditingClassCredit(null)}
        onSaved={() => {
          setEditingClassCredit(null);
          refreshCredits();
        }}
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

  // ── Header (bar uses AS.header / AS.headerInner) ──
  headerInner: { paddingTop: 8, paddingBottom: 8 },
  headerTitleWrap: { alignItems: 'flex-end' },
  headerSub: {
    fontSize: 12, color: Colors.muted,
    writingDirection: 'rtl', textAlign: 'right', marginTop: 1,
  } as any,

  // ── Scroll content ──
  scrollContent: {
    paddingBottom: 32,
  },

  // ── Jar section ──
  jarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: Colors.jarBand,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    marginTop: 12,
  },
  goalReachedText: {
    color: '#065f46', fontWeight: '700', fontSize: 14,
    writingDirection: 'rtl',
  } as any,

  classCtaRow: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  classHistorySection: {
    paddingTop: 20,
  },
  listRowInset: {
    marginHorizontal: 16,
  },
  classCreditNote: {
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'right',
    marginTop: 2,
    writingDirection: 'rtl',
  } as any,
  classCreditAvatarSm: {
    fontSize: 11,
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
    paddingTop: 20,
  },
  studentsHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  studentsLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
    writingDirection: 'rtl',
  } as any,
  studentAvatar: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  studentAvatarText: {
    color: Colors.primaryDark,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'Baloo2_700Bold',
  } as any,

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
