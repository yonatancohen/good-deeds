import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  
  TextInput,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
} from 'react-native';
import { useBreakpoint } from '@/lib/responsive';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Upload, ClipboardList, Users, Settings2, LogOut,
  Plus, Trash2, Pencil, ChevronDown, Check, UserPlus, Search, Trophy,
} from 'lucide-react-native';
import AdminSheet from '@/components/AdminSheet';
import { AS } from '@/lib/adminStyles';
import '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { useTeacherClasses } from '@/hooks/useTeacherClasses';
import { useClassStudents, CreditEventWithDetails } from '@/hooks/useClassStudents';
import { useDeeds } from '@/hooks/useDeeds';
import { useSettings } from '@/hooks/useSettings';
import { supabase } from '@/lib/supabase';
import { confirmAction } from '@/lib/confirm';
import type { Tables } from '@/types/supabase';
import moment from 'moment';
import 'moment/locale/he';
import { Colors, ProgressBar } from '@/components/ui';
import { shadow } from '@/lib/shadow';

moment.locale('he');

type StudentRow = Tables<'students'>;
type GiftRow    = Tables<'gifts'>;
type RedemptionWithGift = {
  id: string;
  class_id: string;
  gift_id: string | null;
  gift_name: string | null;
  marked_by: string;
  note: string | null;
  redeemed_at: string;
};

// ── Hebrew year helpers ────────────────────────────────────────────────────────
const HEB_UNITS: Record<number, string> = {
  1: 'א', 2: 'ב', 3: 'ג', 4: 'ד', 5: 'ה', 6: 'ו', 7: 'ז', 8: 'ח', 9: 'ט',
};
const HEB_TENS: Record<number, string> = { 80: 'פ', 90: 'צ' };
function toHebrewYear(g: number): string {
  const h = g + 3761; const mod = h % 100;
  return `תש${HEB_TENS[Math.floor(mod / 10) * 10] ?? ''}״${HEB_UNITS[mod % 10] ?? ''}`;
}
function getSchoolYears(): string[] {
  const now = new Date();
  const base = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return [0, 1, 2].map(i => toHebrewYear(base + i));
}

// ── StyleSheet ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  screen:   { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },

  // ── Header ──
  header: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  headerGreeting: {
    fontSize: 12, color: '#94a3b8', writingDirection: 'rtl', textAlign: 'right',
  } as any,
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: Colors.text,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl', textAlign: 'right',
  } as any,
  headerBtns: { flexDirection: 'row-reverse', gap: 8 },
  headerBtn: {
    backgroundColor: '#f1f5f9', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, minHeight: 44,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
  },
  headerBtnText: { color: Colors.muted, fontSize: 14, fontWeight: '500' } as any,

  // ── Class picker ──
  pickerWrap: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  pickerLabel: {
    fontSize: 11, fontWeight: '700', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.8,
    textAlign: 'right', marginBottom: 8, writingDirection: 'rtl',
  } as any,
  noClassBanner: {
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, marginBottom: 12,
  },
  noClassText: {
    color: '#92400e', fontSize: 14, textAlign: 'center', writingDirection: 'rtl',
  } as any,
  // Dropdown trigger
  classDropdown: {
    backgroundColor: Colors.card, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 16, height: 52, flexDirection: 'row-reverse',
    alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  classDropdownOpen: { borderColor: Colors.primary },
  classDropdownText: {
    fontSize: 16, fontWeight: '700', color: Colors.primary,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  classDropdownSub: {
    fontSize: 12, color: '#94a3b8', writingDirection: 'rtl', marginTop: 1,
  } as any,
  classDropdownLeft: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1, gap: 10 },
  classDropdownTextWrap: { flex: 1 },
  // Sheet list row
  classListRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 4, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  classListRowActive: { backgroundColor: Colors.primaryLight, borderRadius: 12, paddingHorizontal: 12 },
  classListName: {
    fontSize: 16, fontWeight: '600', color: '#1e293b', writingDirection: 'rtl',
  } as any,
  classListNameActive: { color: Colors.primary } as any,
  classListSub: { fontSize: 12, color: '#94a3b8', writingDirection: 'rtl', marginTop: 2 } as any,
  classListUnassigned: {
    fontSize: 11, color: '#94a3b8', backgroundColor: '#f1f5f9',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2,
  } as any,

  // ── Progress card ──
  progressCard: {
    marginHorizontal: 16, backgroundColor: Colors.card,
    borderRadius: 20, overflow: 'hidden', marginBottom: 24,
    ...shadow('#785900', 4, 12, 0.10, 4),
  },
  progressCardInner: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  progressRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  progressClassName: {
    fontSize: 15, fontWeight: '700', color: '#1e293b', writingDirection: 'rtl',
  } as any,
  goalBadge: {
    backgroundColor: '#d1fae5', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
  },
  goalBadgeText: { color: '#065f46', fontWeight: '600', fontSize: 12 } as any,
  progressCount: { color: '#64748b', fontSize: 14 } as any,
  progressGoalText: {
    color: '#94a3b8', fontSize: 12, textAlign: 'right', marginTop: 4, writingDirection: 'rtl',
  } as any,

  // ── Students section ──
  studentsWrap: { paddingHorizontal: 16, paddingTop: 8 },
  studentsHeaderRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8,
  },
  studentsCountLabel: {
    fontSize: 11, fontWeight: '700', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.8, writingDirection: 'rtl',
  } as any,
  uploadBtn: {
    backgroundColor: Colors.primaryLight, borderRadius: 10, borderWidth: 1, borderColor: Colors.primary,
    paddingHorizontal: 12, paddingVertical: 6, minHeight: 36,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
  },
  uploadBtnText: { color: Colors.primary, fontSize: 12, fontWeight: '600' } as any,
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9',
  },
  emptyIconBox: {
    width: 56, height: 56, backgroundColor: '#f1f5f9', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyText: {
    color: Colors.muted, fontSize: 14, textAlign: 'center', writingDirection: 'rtl',
  } as any,
  uploadLink: { marginTop: 12, minHeight: 44, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 6 },
  uploadLinkText: { color: Colors.primary, fontSize: 14, fontWeight: '500', writingDirection: 'rtl' } as any,

  // ── Student row ──
  studentRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
    marginBottom: 10,
    ...shadow('#64748b', 2, 8, 0.08, 3),
  },
  studentLeft: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1 },

  // Year picker pills
  yearPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  yearPillActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  yearPillText:       { color: Colors.muted, fontWeight: '600', fontSize: 14 } as any,
  yearPillTextActive: { color: '#fff', fontWeight: '600', fontSize: 14 } as any,
  deletedBadge: {
    backgroundColor: '#FEE2E2', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-end',
  },
  deletedBadgeText: { color: '#DC2626', fontSize: 11, fontWeight: '600' } as any,

  // Redemption
  redeemBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, height: 34,
  },
  redeemBtnFull: {
    backgroundColor: Colors.primary,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 50,
  },
  redeemBtnFullDisabled: {
    backgroundColor: Colors.surfaceDim,
  },
  redeemBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 } as any,
  redemptionClassBadge: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  redemptionClassBadgeText: { color: Colors.primary, fontWeight: '600', fontSize: 14 } as any,
  redemptionHistoryItem: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.primarySurface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  redemptionHistoryLeft: { flex: 1, marginLeft: 10 },
  redemptionHistoryGift: {
    fontSize: 14, fontWeight: '700', color: '#1e293b', writingDirection: 'rtl', textAlign: 'right',
  } as any,
  redemptionHistoryNote: {
    fontSize: 12, color: '#64748b', writingDirection: 'rtl', textAlign: 'right', marginTop: 2,
  } as any,
  redemptionHistoryDate: {
    fontSize: 11, color: '#94a3b8', writingDirection: 'rtl', textAlign: 'right', marginTop: 4,
  } as any,
  redemptionDivider: {
    height: 1, backgroundColor: Colors.border, marginVertical: 16,
  },
  giftPill: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  giftPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  giftPillText:   { color: Colors.muted, fontWeight: '600', fontSize: 14 } as any,
  giftPillTextActive: { color: '#fff' } as any,
  searchWrap: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12, marginBottom: 12,
    ...shadow('transparent', 0, 0, 0, 0),
  },
  searchWrapFocused: {
    backgroundColor: '#fff', borderColor: Colors.primary,
    ...shadow(Colors.primary, 0, 6, 0.15, 2),
  },
  searchInput: {
    flex: 1, height: 44, fontSize: 15, color: '#1e293b',
    writingDirection: 'rtl', backgroundColor: 'transparent',
    outlineStyle: 'none',
  } as any,
  searchIcon: { marginLeft: 6 },
  studentAvatar: {
    backgroundColor: Colors.primaryLight, borderRadius: 12, width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center', marginLeft: 10,
  },
  studentAvatarText: { color: Colors.primary, fontWeight: '700', fontSize: 13 } as any,
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
  // Student form
  studentFormInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: Colors.text, fontSize: 16, textAlign: 'right', marginBottom: 12,
    writingDirection: 'rtl',
  } as any,

  // ── Modal overlay ──
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },

  // ── Give Credit Modal ──
  modalTitle: {
    fontSize: 20, fontWeight: '700', color: Colors.text,
    textAlign: 'right', marginBottom: 4,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  modalSub: {
    color: Colors.muted, fontSize: 14, textAlign: 'right', marginBottom: 20, writingDirection: 'rtl',
  } as any,
  sectionTitle: {
    color: '#334155', fontWeight: '600', fontSize: 14, textAlign: 'right', marginBottom: 4, writingDirection: 'rtl',
  } as any,
  sectionHint: {
    color: '#94a3b8', fontSize: 12, textAlign: 'right', marginBottom: 8, writingDirection: 'rtl',
  } as any,
  deedPill: {
    marginLeft: 8, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, borderWidth: 2, alignItems: 'center', minWidth: 80,
  },
  deedPillActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  deedPillInactive: { backgroundColor: '#fff', borderColor: Colors.border },
  deedAmount: { fontWeight: '700', fontSize: 16 } as any,
  deedAmountActive:   { color: '#fff' },
  deedAmountInactive: { color: '#1e293b' },
  deedName: { fontSize: 11, marginTop: 2, textAlign: 'center' } as any,
  deedNameActive:   { color: '#c7d2fe' },
  deedNameInactive: { color: '#94a3b8' },
  noteInput: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    color: '#1e293b', fontSize: 14, textAlign: 'right', marginBottom: 20,
    fontFamily: 'Nunito_400Regular', writingDirection: 'rtl',
  } as any,
  modalBtns: { flexDirection: 'row-reverse', gap: 12 },
  confirmBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  confirmBtnActive:    { backgroundColor: Colors.primary },
  confirmBtnDisabled:  { backgroundColor: Colors.surfaceDim },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 } as any,
  cancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9',
  },
  cancelBtnText: { color: '#475569', fontWeight: '700', fontSize: 16 } as any,

  // ── History Modal ──
  historyHeader: {
    alignItems: 'flex-end', marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18, fontWeight: '700', color: Colors.text, writingDirection: 'rtl', textAlign: 'right',
  } as any,
  historyStudentName: {
    color: Colors.muted, fontSize: 15, writingDirection: 'rtl', textAlign: 'right', marginTop: 2,
  } as any,
  historyEmpty: {
    color: '#94a3b8', textAlign: 'center', paddingVertical: 32, writingDirection: 'rtl',
  } as any,
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
    color: '#1e293b', fontWeight: '500', fontSize: 14, textAlign: 'right', writingDirection: 'rtl',
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

// ─── Give Credit Modal ────────────────────────────────────────────────────────

interface GiveCreditModalProps {
  visible: boolean;
  student: StudentRow | null;
  classId: string;
  onClose: () => void;
  onSuccess: (studentId: string, amount: number) => void;
}

function GiveCreditModal({ visible, student, classId, onClose, onSuccess }: GiveCreditModalProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { deeds } = useDeeds();
  const [selectedDeedId, setSelectedDeedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Sort descending: largest deed first (rightmost in row-reverse = most prominent)
  const sortedDeeds = React.useMemo(
    () => [...deeds].sort((a, b) => b.amount - a.amount),
    [deeds],
  );
  const selectedDeed = deeds.find((d) => d.id === selectedDeedId);

  async function handleSubmit() {
    if (!student || !selectedDeedId || !selectedDeed || !user) return;

    setSubmitting(true);
    const { error } = await supabase.from('credit_events').insert({
      student_id: student.id,
      deed_id: selectedDeedId,
      amount: selectedDeed.amount,
      note: note.trim() || null,
      given_by: user.id,
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
      <Text style={S.modalTitle} accessibilityRole="header">{t('giveCredit')}</Text>
      {student && (
        <Text style={S.modalSub}>עבור {student.first_name} {student.last_name}</Text>
      )}

      {/* Deed picker */}
      <Text style={S.sectionTitle}>{t('selectDeed')}</Text>
      <Text style={S.sectionHint}>בחר את המעשה הטוב שהתלמיד ביצע</Text>
      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {sortedDeeds.map((deed) => {
          const active = selectedDeedId === deed.id;
          return (
            <TouchableOpacity
              key={deed.id}
              onPress={() => setSelectedDeedId(deed.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLabel={`${deed.name} — ${deed.amount} נקודות`}
              style={[S.deedPill, active ? S.deedPillActive : S.deedPillInactive, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
            >
              <Text style={[S.deedAmount, active ? S.deedAmountActive : S.deedAmountInactive]}>+{deed.amount}</Text>
              <Text style={[S.deedName, active ? S.deedNameActive : S.deedNameInactive]}>{deed.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Note */}
      <Text style={S.sectionTitle}>{t('note')} (אופציונלי)</Text>
      <Text style={S.sectionHint}>{t('notePlaceholder')}</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder={t('notePlaceholder')}
        placeholderTextColor="#94a3b8"
        textAlign="right"
        multiline
        numberOfLines={2}
        style={S.noteInput}
        accessibilityLabel="הערה על המעשה הטוב"
      />

      {/* Buttons */}
      <View style={S.modalBtns}>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canConfirm}
          accessibilityRole="button"
          accessibilityLabel="אשר הוספת נקודה"
          accessibilityState={{ disabled: !canConfirm }}
          style={[S.confirmBtn, canConfirm ? S.confirmBtnActive : S.confirmBtnDisabled, Platform.OS === 'web' && { cursor: canConfirm ? 'pointer' : 'default' } as any]}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={S.confirmBtnText}>{t('confirm')}</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="ביטול"
          style={[S.cancelBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
        >
          <Text style={S.cancelBtnText}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    </AdminSheet>
  );
}

// ─── Student Row ──────────────────────────────────────────────────────────────

interface StudentRowProps {
  student: StudentRow;
  credits: number;
  onGiveCredit: () => void;
  onViewHistory: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function StudentItem({ student, credits, onGiveCredit, onViewHistory, onEdit, onDelete }: StudentRowProps) {
  const { t } = useTranslation();
  const { first_name, last_name } = student;

  return (
    <View
      style={S.studentRow}
      accessibilityLabel={`${first_name} ${last_name} — ${credits} נקודות`}
    >
      <View style={S.studentLeft}>
        <View style={{ flex: 1 }}>
          <Text style={S.studentName}>{first_name} {last_name}</Text>
          <Text style={S.studentPoints}>{credits} {t('points')}</Text>
        </View>
      </View>

      <View style={S.studentActions}>
        {/* Delete */}
        <TouchableOpacity
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`מחק ${first_name} ${last_name}`}
          style={[S.studentDeleteBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
        >
          <Trash2 size={15} color={Colors.danger} />
        </TouchableOpacity>

        {/* Edit */}
        <TouchableOpacity
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`ערוך ${first_name} ${last_name}`}
          style={[S.studentSecondaryBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
        >
          <Pencil size={15} color={Colors.muted} />
        </TouchableOpacity>

        {/* History */}
        <TouchableOpacity
          onPress={onViewHistory}
          accessibilityRole="button"
          accessibilityLabel={`היסטוריית נקודות של ${first_name} ${last_name}`}
          style={[S.studentSecondaryBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
        >
          <ClipboardList size={15} color={Colors.muted} />
        </TouchableOpacity>

        {/* Give Credit */}
        <TouchableOpacity
          onPress={onGiveCredit}
          accessibilityRole="button"
          accessibilityLabel={`הוסף נקודה ל${first_name} ${last_name}`}
          style={[S.giveBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
        >
          <Plus size={13} color="#fff" />
          <Text style={S.giveBtnText}>נקודה</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── History Modal ────────────────────────────────────────────────────────────

interface HistoryModalProps {
  visible: boolean;
  student: StudentRow | null;
  events: CreditEventWithDetails[];
  currentUserId: string;
  onClose: () => void;
  onDeleted: () => void;
}

function HistoryModal({ visible, student, events, currentUserId, onClose, onDeleted }: HistoryModalProps) {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [deleting, setDeleting] = useState<string | null>(null);

  const studentEvents = events.filter((e) => e.student_id === student?.id);

  async function handleDelete(eventId: string) {
    confirmAction(
      t('deleteCredit'),
      t('deleteCreditConfirm'),
      async () => {
        setDeleting(eventId);
        const { error } = await supabase
          .from('credit_events')
          .delete()
          .eq('id', eventId);
        setDeleting(null);
        if (error) {
          Alert.alert('שגיאה', error.message);
        } else {
          onDeleted();
        }
      },
    );
  }

  return (
    <AdminSheet visible={visible} onClose={onClose}>
      <View style={S.historyHeader}>
        <Text style={S.historyTitle} accessibilityRole="header">{t('creditHistory')}</Text>
        {student && (
          <Text style={S.historyStudentName}>{student.first_name} {student.last_name}</Text>
        )}
      </View>

      <FlatList
        data={studentEvents}
        keyExtractor={(item) => item.id}
        style={{ maxHeight: 420 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={S.historyEmpty}>אין נקודות עדיין</Text>}
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
                  <Text style={S.historyMetaText}>{item.given_by_user?.display_name ?? t('givenBy')}</Text>
                </View>
              </View>
              {canDelete && (
                <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`מחק נקודה: ${item.deed?.name}`}
                  style={[S.deleteBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                >
                  {deleting === item.id ? (
                    <ActivityIndicator size="small" color="#ef4444" />
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

// ─── Main Teacher Screen ──────────────────────────────────────────────────────

export default function TeacherScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { isDesktop } = useBreakpoint();
  const { settings } = useSettings();
  const { classes, loading: classesLoading } = useTeacherClasses();

  const schoolYears = React.useMemo(() => getSchoolYears(), []);
  const activeYear  = settings?.current_year ?? schoolYears[0];
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Initialise selectedYear once settings load
  React.useEffect(() => {
    if (activeYear && !selectedYear) setSelectedYear(activeYear);
  }, [activeYear]);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classPickerVisible, setClassPickerVisible] = useState(false);
  const { students, creditEvents, loading: studentsLoading, refetch } = useClassStudents(selectedClassId);

  const [giveCreditStudent, setGiveCreditStudent] = useState<StudentRow | null>(null);
  const [historyStudent,    setHistoryStudent]    = useState<StudentRow | null>(null);

  const [studentSearch, setStudentSearch]     = useState('');
  const [searchFocused,  setSearchFocused]    = useState(false);
  const [deletedStudentIds,    setDeletedStudentIds]    = useState<Set<string>>(new Set());
  const [locallyAddedStudents, setLocallyAddedStudents] = useState<Array<{ student: StudentRow; credits: number }>>([]);
  const [studentCountDelta,    setStudentCountDelta]    = useState(0);
  const [localCreditAdjustments, setLocalCreditAdjustments] = useState<Record<string, number>>({});

  // ── Redemption (gift recording) ──
  const [gifts,                 setGifts]                 = useState<GiftRow[]>([]);
  const [redemptionVisible,     setRedemptionVisible]     = useState(false);
  const [selectedGiftId,        setSelectedGiftId]        = useState<string | null>(null);
  const [redemptionNote,        setRedemptionNote]        = useState('');
  const [savingRedemption,      setSavingRedemption]      = useState(false);
  const [redemptions,           setRedemptions]           = useState<RedemptionWithGift[]>([]);
  const [loadingRedemptions,    setLoadingRedemptions]    = useState(false);
  const [deletingRedemptionId,  setDeletingRedemptionId]  = useState<string | null>(null);

  // ── Student management ──
  const [studentSheetVisible, setStudentSheetVisible] = useState(false);
  const [editingStudent,      setEditingStudent]      = useState<StudentRow | null>(null);
  const [studentFirstName,    setStudentFirstName]    = useState('');
  const [studentLastName,     setStudentLastName]     = useState('');
  const [savingStudent,       setSavingStudent]       = useState(false);

  function openAddStudent() {
    setEditingStudent(null); setStudentFirstName(''); setStudentLastName('');
    setStudentSheetVisible(true);
  }
  function openEditStudent(s: StudentRow) {
    setEditingStudent(s); setStudentFirstName(s.first_name); setStudentLastName(s.last_name);
    setStudentSheetVisible(true);
  }
  async function handleSaveStudent() {
    if (!studentFirstName.trim() || !studentLastName.trim()) {
      Alert.alert('שגיאה', 'נא למלא שם פרטי ושם משפחה'); return;
    }
    if (!selectedClassId) return;
    setSavingStudent(true);

    if (editingStudent) {
      const { error } = await supabase.from('students')
        .update({ first_name: studentFirstName.trim(), last_name: studentLastName.trim() })
        .eq('id', editingStudent.id);
      setSavingStudent(false);
      if (error) { Alert.alert('שגיאה', error.message); return; }
      // Clear local state so refetch is clean (no duplicates)
      setLocallyAddedStudents([]);
      setDeletedStudentIds(new Set());
      setStudentCountDelta(0);
      refetch();
    } else {
      const { data: newStudent, error } = await supabase.from('students')
        .insert({ first_name: studentFirstName.trim(), last_name: studentLastName.trim(), class_id: selectedClassId })
        .select()
        .single();
      setSavingStudent(false);
      if (error) { Alert.alert('שגיאה', error.message); return; }
      setLocallyAddedStudents(prev => [...prev, { student: newStudent, credits: 0 }]);
      setStudentCountDelta(prev => prev + 1);
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
        else {
          setDeletedStudentIds(prev => new Set([...prev, s.id]));
          setStudentCountDelta(prev => prev - 1);
        }
      },
      'מחק',
    );
  }

  // Reload active gifts every time the redemption sheet opens; clear on close to avoid stale flash
  React.useEffect(() => {
    if (!redemptionVisible) { setGifts([]); return; }
    supabase.from('gifts').select('*').eq('is_active', true).is('deleted_at', null).order('name')
      .then(({ data }) => setGifts(data ?? []));
  }, [redemptionVisible]);

  // Load redemptions when sheet opens
  React.useEffect(() => {
    if (redemptionVisible && selectedClassId) {
      setLoadingRedemptions(true);
      supabase
        .from('redemption_rounds')
        .select('*, gifts(name)')
        .eq('class_id', selectedClassId)
        .order('redeemed_at', { ascending: false })
        .then(({ data }) => {
          setRedemptions(
            (data ?? []).map((r: any) => ({ ...r, gift_name: r.gifts?.name ?? null }))
          );
          setLoadingRedemptions(false);
        });
    }
  }, [redemptionVisible, selectedClassId]);

  async function handleDeleteRedemption(id: string) {
    confirmAction(
      'מחיקת רישום',
      'למחוק את רישום המתנה?',
      async () => {
        setDeletingRedemptionId(id);
        const { error } = await supabase.from('redemption_rounds').delete().eq('id', id);
        setDeletingRedemptionId(null);
        if (error) Alert.alert('שגיאה', error.message);
        else setRedemptions(prev => prev.filter(r => r.id !== id));
      },
      'מחק',
    );
  }

  async function handleRecordRedemption() {
    if (!selectedClassId || !user) return;
    setSavingRedemption(true);
    const { data: inserted, error } = await supabase
      .from('redemption_rounds')
      .insert({
        class_id:  selectedClassId,
        gift_id:   selectedGiftId || null,
        note:      redemptionNote.trim() || null,
        marked_by: user.id,
      })
      .select()
      .single();
    setSavingRedemption(false);
    if (error) { Alert.alert('שגיאה', error.message); return; }
    // Prepend to list optimistically so it shows immediately
    const giftName = gifts.find(g => g.id === selectedGiftId)?.name ?? null;
    setRedemptions(prev => [{ ...inserted, gift_name: giftName }, ...prev]);
    setSelectedGiftId(null);
    setRedemptionNote('');
  }

  const selectedClass = classes.find((c) => c.class.id === selectedClassId);
  const goal = settings?.global_goal ?? 100;

  const visibleStudents = [
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
  ];

  const classTotal = visibleStudents.reduce((sum, s) => sum + s.credits, 0);
  const filteredStudents = studentSearch.trim()
    ? visibleStudents.filter(({ student }) =>
        `${student.first_name} ${student.last_name}`
          .toLowerCase()
          .includes(studentSearch.trim().toLowerCase())
      )
    : visibleStudents;
  const cappedTotal = Math.min(classTotal, goal);
  const goalReached = classTotal >= goal;

  // Reset local state when class changes
  React.useEffect(() => {
    setDeletedStudentIds(new Set());
    setLocallyAddedStudents([]);
    setStudentCountDelta(0);
    setLocalCreditAdjustments({});
    setRedemptions([]);
  }, [selectedClassId]);

  // Auto-select first assigned class
  React.useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      const firstAssigned = classes.find((c) => c.isAssigned);
      if (firstAssigned) setSelectedClassId(firstAssigned.class.id);
    }
  }, [classes, selectedClassId]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  }

  if (classesLoading) {
    return (
      <SafeAreaView style={S.centered}>
        <ActivityIndicator size="large" color={Colors.primary} accessibilityLabel="טוען כיתות" />
      </SafeAreaView>
    );
  }

  // For teacher: only active year. For admin: selected year (can include deleted).
  const yearFilter = isAdmin ? selectedYear : activeYear;
  const yearClasses = yearFilter
    ? classes.filter((c) => c.class.year === yearFilter)
    : classes;

  const assignedClasses   = yearClasses.filter((c) =>  c.isAssigned);
  const unassignedClasses = yearClasses.filter((c) => !c.isAssigned);

  // Shared JSX fragments used in both desktop and mobile branches
  const progressCardJSX = selectedClassId && selectedClass ? (
    <View style={S.progressCard}>
      {/* Content area */}
      <View style={S.progressCardInner}>
        <View style={S.progressRow}>
          <Text style={S.progressClassName}>
            כיתה {selectedClass.class.name}
          </Text>
          {goalReached ? (
            <View style={S.goalBadge}>
              <Text style={S.goalBadgeText}>{t('waitingForGift')}</Text>
            </View>
          ) : (
            <Text style={S.progressCount}>{cappedTotal} / {goal}</Text>
          )}
        </View>

        <ProgressBar value={cappedTotal} max={goal} height={12} />

        <Text style={[S.progressGoalText, { marginTop: 10 }]}>
          {goal - cappedTotal > 0
            ? `עוד ${goal - cappedTotal} נקודות למטרה`
            : 'הכיתה הגיעה למטרה!'}
        </Text>
      </View>

      {/* Full-width button flush at bottom — corners clipped by card's overflow:hidden */}
      <TouchableOpacity
        onPress={() => setRedemptionVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={goalReached ? 'רשום מתנה לכיתה' : 'הכיתה טרם הגיעה למטרה'}
        accessibilityState={{ disabled: !goalReached }}
        disabled={!goalReached}
        style={[
          S.redeemBtnFull,
          !goalReached && S.redeemBtnFullDisabled,
          Platform.OS === 'web' && { cursor: goalReached ? 'pointer' : 'default' } as any,
        ]}
      >
        <Trophy size={15} color={goalReached ? '#fff' : '#94a3b8'} />
        <Text style={[S.redeemBtnText, !goalReached && { color: '#94a3b8' }]}>
          {goalReached ? 'רשום מתנה' : `עוד ${goal - cappedTotal} נקודות למטרה`}
        </Text>
      </TouchableOpacity>
    </View>
  ) : null;

  const studentsJSX = selectedClassId ? (
    <View style={S.studentsWrap}>
      <View style={S.studentsHeaderRow}>
        <Text style={S.studentsCountLabel}>
          תלמידים ({visibleStudents.length})
        </Text>
        <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
          <TouchableOpacity
            onPress={openAddStudent}
            accessibilityRole="button"
            accessibilityLabel="הוסף תלמיד ידנית"
            style={[S.uploadBtn, { backgroundColor: Colors.primary, borderColor: Colors.primary, borderWidth: 1 }, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
          >
            <UserPlus size={14} color="#fff" />
            <Text style={[S.uploadBtnText, { color: '#fff' }]}>הוסף</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/teacher/upload?classId=${selectedClassId}`)}
            accessibilityRole="button"
            accessibilityLabel="העלאת רשימת תלמידים מ-CSV"
            style={[S.uploadBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
          >
            <Upload size={14} color={Colors.primary} />
            <Text style={S.uploadBtnText}>{t('uploadCsv')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      {!studentsLoading && visibleStudents.length > 0 && (
        <View style={[S.searchWrap, searchFocused && S.searchWrapFocused]}>
          <TextInput
            value={studentSearch}
            onChangeText={setStudentSearch}
            placeholder="חיפוש תלמיד..."
            placeholderTextColor="#94a3b8"
            textAlign="right"
            style={S.searchInput}
            accessibilityLabel="חיפוש תלמיד"
            clearButtonMode="while-editing"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <Search size={16} color={searchFocused ? Colors.primary : '#94a3b8'} style={S.searchIcon as any} />
        </View>
      )}

      {studentsLoading ? (
        <ActivityIndicator
          color={Colors.primary}
          style={{ marginVertical: 32 }}
          accessibilityLabel="טוען תלמידים"
        />
      ) : visibleStudents.length === 0 ? (
        <View style={S.emptyCard}>
          <View style={S.emptyIconBox}>
            <Users size={24} color={Colors.muted} />
          </View>
          <Text style={S.emptyText}>{t('noStudents')}</Text>
          <TouchableOpacity
            onPress={() => router.push(`/teacher/upload?classId=${selectedClassId}`)}
            style={[S.uploadLink, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
            accessibilityRole="button"
            accessibilityLabel="העלה רשימת תלמידים"
          >
            <Upload size={14} color={Colors.primary} />
            <Text style={S.uploadLinkText}>העלה רשימת תלמידים</Text>
          </TouchableOpacity>
        </View>
      ) : (
        filteredStudents.map(({ student, credits }) => (
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
  ) : null;

  return (
    <SafeAreaView style={[S.screen, isDesktop && { backgroundColor: 'transparent' }]}>
      <View style={[{ flex: 1 }, isDesktop && { alignSelf: 'center', width: '100%', maxWidth: 1100, backgroundColor: '#fff' }]}>

      {/* ── Header — same for both layouts ── */}
      <View style={S.header}>
        <View style={S.headerRow}>
          <View>
            <Text style={S.headerGreeting}>שלום,</Text>
            <Text style={S.headerTitle} accessibilityRole="header">
              {user?.display_name ?? 'מורה'}
            </Text>
          </View>
          <View style={S.headerBtns}>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => router.push('/admin')}
                accessibilityRole="button"
                accessibilityLabel="עבור לניהול"
                style={[S.headerBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
              >
                <Settings2 size={15} color={Colors.muted} />
                <Text style={S.headerBtnText}>{t('admin')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleLogout}
              accessibilityRole="button"
              accessibilityLabel="התנתק מהמערכת"
              style={[S.headerBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
            >
              <LogOut size={15} color={Colors.muted} />
              <Text style={S.headerBtnText}>{t('logout')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {isDesktop ? (
        /* ── DESKTOP: two-column layout ── */
        <View style={{ flex: 1, flexDirection: 'row-reverse' }}>

          {/* RIGHT panel: class picker */}
          <ScrollView
            style={{ width: 300, borderLeftWidth: 1, borderLeftColor: Colors.border, backgroundColor: Colors.surface }}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Year picker — admin only */}
            {isAdmin && (
              <View style={[S.pickerWrap, { paddingHorizontal: 0, paddingTop: 0 }]}>
                <Text style={S.pickerLabel}>שנת לימודים</Text>
                <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                  {schoolYears.map((yr) => {
                    const on = selectedYear === yr;
                    return (
                      <TouchableOpacity
                        key={yr}
                        onPress={() => { setSelectedYear(yr); setSelectedClassId(null); }}
                        style={[S.yearPill, on && S.yearPillActive, { flex: 1, alignItems: 'center', justifyContent: 'center' }, { cursor: 'pointer' } as any]}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                      >
                        <Text style={[S.yearPillText, on && S.yearPillTextActive]}>{yr}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Class list */}
            <Text style={[S.pickerLabel, { marginBottom: 8, marginTop: isAdmin ? 16 : 0 }]}>כיתה</Text>
            {yearClasses.map((tc) => {
              const active = selectedClassId === tc.class.id;
              return (
                <TouchableOpacity
                  key={tc.class.id}
                  onPress={() => setSelectedClassId(tc.class.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLabel={`כיתה ${tc.class.name}, ${tc.studentCount + (active ? studentCountDelta : 0)} תלמידים`}
                  style={[{
                    backgroundColor: active ? Colors.primary : '#fff',
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: active ? Colors.primary : Colors.border,
                  }, { cursor: 'pointer' } as any]}
                >
                  <Text style={{
                    color: active ? '#fff' : '#0F172A',
                    fontWeight: '700',
                    fontSize: 15,
                    textAlign: 'right',
                    fontFamily: 'Baloo2_700Bold',
                    writingDirection: 'rtl',
                  } as any}>
                    כיתה {tc.class.name}
                  </Text>
                  <Text style={{
                    color: active ? 'rgba(255,255,255,0.8)' : '#64748b',
                    fontSize: 12,
                    textAlign: 'right',
                    writingDirection: 'rtl',
                    marginTop: 2,
                  } as any}>
                    {tc.studentCount + (active ? studentCountDelta : 0)} תלמידים{tc.class.grade ? ` · שכבה ${tc.class.grade}` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* LEFT panel: class detail */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {!selectedClassId ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
                <Text style={{ color: '#94a3b8', fontSize: 16, textAlign: 'center', writingDirection: 'rtl' } as any}>
                  בחר כיתה מהרשימה
                </Text>
              </View>
            ) : (
              <>
                {progressCardJSX}
                {studentsJSX}
              </>
            )}
          </ScrollView>
        </View>
      ) : (
        /* ── MOBILE: single-column scrollview (unchanged) ── */
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {/* ── Year picker (admin only) ── */}
          {isAdmin && (
            <View style={S.pickerWrap}>
              <Text style={S.pickerLabel}>שנת לימודים</Text>
              <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
                {schoolYears.map((yr) => {
                  const on = selectedYear === yr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      onPress={() => { setSelectedYear(yr); setSelectedClassId(null); }}
                      style={[S.yearPill, on && S.yearPillActive, { flex: 1, alignItems: 'center', justifyContent: 'center' }, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                    >
                      <Text style={[S.yearPillText, on && S.yearPillTextActive]}>{yr}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Class Picker ── */}
          <View style={S.pickerWrap}>
            <Text style={S.pickerLabel}>{isAdmin ? 'כיתה' : t('myClasses')}</Text>

            {assignedClasses.length === 0 && !isAdmin ? (
              <View style={S.noClassBanner}>
                <Text style={S.noClassText}>{t('waitingForClass')}</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setClassPickerVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={selectedClass ? `כיתה ${selectedClass.class.name} — החלף כיתה` : 'בחר כיתה'}
                style={[S.classDropdown, classPickerVisible && S.classDropdownOpen, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
              >
                <View style={S.classDropdownLeft}>
                  <View style={S.classDropdownTextWrap}>
                    <Text style={S.classDropdownText}>
                      {selectedClass ? `כיתה ${selectedClass.class.name}` : 'בחר כיתה'}
                    </Text>
                    {selectedClass && (
                      <Text style={S.classDropdownSub}>
                        {selectedClass.studentCount + studentCountDelta} תלמידים
                        {selectedClass.class.grade ? ` · שכבה ${selectedClass.class.grade}` : ''}
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronDown size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── Selected Class Progress ── */}
          {progressCardJSX}

          {/* ── Students List ── */}
          {studentsJSX}
        </ScrollView>
      )}

      {/* ── Add / Edit Student Sheet ── */}
      <AdminSheet visible={studentSheetVisible} onClose={() => setStudentSheetVisible(false)}>
        <Text style={AS.sheetTitle} accessibilityRole="header">
          {editingStudent ? `ערוך תלמיד — ${editingStudent.first_name} ${editingStudent.last_name}` : 'הוסף תלמיד'}
        </Text>

        <Text style={AS.fieldLabel}>שם פרטי</Text>
        <TextInput
          value={studentFirstName}
          onChangeText={setStudentFirstName}
          placeholder="לדוגמה: יוסי"
          placeholderTextColor="#94a3b8"
          textAlign="right"
          style={S.studentFormInput}
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
          style={[S.studentFormInput, { marginBottom: 24 }]}
          accessibilityLabel="שם משפחה"
          autoCapitalize="words"
        />

        <View style={AS.sheetBtns}>
          <TouchableOpacity
            onPress={handleSaveStudent}
            disabled={savingStudent || !studentFirstName.trim() || !studentLastName.trim()}
            style={[
              (savingStudent || !studentFirstName.trim() || !studentLastName.trim()) ? AS.saveBtnDisabled : AS.saveBtn,
              Platform.OS === 'web' && { cursor: 'pointer' } as any,
            ]}
            accessibilityRole="button"
            accessibilityLabel="שמור תלמיד"
          >
            {savingStudent ? <ActivityIndicator color="#fff" /> : <Text style={AS.saveBtnText}>{editingStudent ? 'שמור שינויים' : 'הוסף תלמיד'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setStudentSheetVisible(false)}
            style={[AS.cancelBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
            accessibilityRole="button"
            accessibilityLabel="ביטול"
          >
            <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </AdminSheet>

      {/* ── Class Picker Sheet ── */}
      <AdminSheet visible={classPickerVisible} onClose={() => setClassPickerVisible(false)}>
        <Text style={AS.sheetTitle} accessibilityRole="header">בחר כיתה</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
          {assignedClasses.length > 0 && (
            <>
              {assignedClasses.map(({ class: cls, studentCount }) => {
                const active = selectedClassId === cls.id;
                const displayCount = active ? studentCount + studentCountDelta : studentCount;
                return (
                  <TouchableOpacity
                    key={cls.id}
                    onPress={() => { setSelectedClassId(cls.id); setClassPickerVisible(false); }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={`כיתה ${cls.name}, ${displayCount} תלמידים`}
                    style={[S.classListRow, active && S.classListRowActive, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                  >
                    <View>
                      <Text style={[S.classListName, active && S.classListNameActive]}>כיתה {cls.name}</Text>
                      <Text style={S.classListSub}>{displayCount} תלמידים{cls.grade ? ` · שכבה ${cls.grade}` : ''}</Text>
                      {isAdmin && cls.deleted_at && (
                        <View style={S.deletedBadge}><Text style={S.deletedBadgeText}>מחוקה</Text></View>
                      )}
                    </View>
                    {active && <Check size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          {unassignedClasses.length > 0 && (
            <>
              <Text style={[AS.fieldLabel, { marginTop: 16, marginBottom: 4 }]}>שאר הכיתות</Text>
              {unassignedClasses.map(({ class: cls }) => {
                const active = selectedClassId === cls.id;
                return (
                  <TouchableOpacity
                    key={cls.id}
                    onPress={() => { setSelectedClassId(cls.id); setClassPickerVisible(false); }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    accessibilityLabel={`כיתה ${cls.name} (לא משויכת אליך)`}
                    style={[S.classListRow, active && S.classListRowActive, { opacity: 0.7 }, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                  >
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                      <Text style={[S.classListName, active && S.classListNameActive]}>כיתה {cls.name}</Text>
                      <Text style={S.classListUnassigned}>לא משויך</Text>
                    </View>
                    {active && <Check size={18} color={Colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          <View style={{ height: 16 }} />
        </ScrollView>
      </AdminSheet>

      {/* ── Give Credit Modal ── */}
      <GiveCreditModal
        visible={!!giveCreditStudent}
        student={giveCreditStudent}
        classId={selectedClassId ?? ''}
        onClose={() => setGiveCreditStudent(null)}
        onSuccess={(studentId, amount) => {
          setGiveCreditStudent(null);
          setLocalCreditAdjustments(prev => ({
            ...prev,
            [studentId]: (prev[studentId] ?? 0) + amount,
          }));
          refetch();
        }}
      />

      {/* ── History Modal ── */}
      <HistoryModal
        visible={!!historyStudent}
        student={historyStudent}
        events={creditEvents}
        currentUserId={user?.id ?? ''}
        onClose={() => setHistoryStudent(null)}
        onDeleted={() => {
          refetch();
        }}
      />

      {/* ── Redemption Sheet ── */}
      <AdminSheet visible={redemptionVisible} onClose={() => setRedemptionVisible(false)}>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={[AS.sheetTitle, { marginBottom: 0 }]} accessibilityRole="header">רישומי מתנות לכיתה</Text>
          {selectedClass && (
            <View style={S.redemptionClassBadge}>
              <Trophy size={14} color={Colors.primary} />
              <Text style={S.redemptionClassBadgeText}>כיתה {selectedClass.class.name}</Text>
            </View>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
          {/* ── Past redemptions ── */}
          {loadingRedemptions ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 12 }} />
          ) : redemptions.length > 0 ? (
            <>
              <Text style={[AS.fieldLabel, { marginBottom: 8 }]}>רישומים קודמים</Text>
              {redemptions.map((r) => {
                const canDelete = isAdmin || r.marked_by === user?.id;
                return (
                  <View key={r.id} style={S.redemptionHistoryItem} accessibilityLabel={`מתנה: ${r.gift_name ?? 'ללא מתנה'}, ${moment(r.redeemed_at).fromNow()}`}>
                    <View style={S.redemptionHistoryLeft}>
                      <Text style={S.redemptionHistoryGift}>{r.gift_name ?? 'ללא מתנה ספציפית'}</Text>
                      {r.note ? <Text style={S.redemptionHistoryNote}>{r.note}</Text> : null}
                      <Text style={S.redemptionHistoryDate}>{moment(r.redeemed_at).fromNow()}</Text>
                    </View>
                    {canDelete && (
                      <TouchableOpacity
                        onPress={() => handleDeleteRedemption(r.id)}
                        disabled={deletingRedemptionId === r.id}
                        accessibilityRole="button"
                        accessibilityLabel="מחק רישום"
                        style={[S.deleteBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                      >
                        {deletingRedemptionId === r.id
                          ? <ActivityIndicator size="small" color="#ef4444" />
                          : <Trash2 size={16} color={Colors.danger} />}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              <View style={S.redemptionDivider} />
            </>
          ) : (
            <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 12, writingDirection: 'rtl' } as any}>
              אין רישומים קודמים לכיתה זו
            </Text>
          )}

          {/* ── New redemption form ── */}
          <Text style={AS.fieldLabel}>רישום חדש</Text>
          <Text style={[AS.fieldHint, { marginBottom: 10 }]}>המתנה שהכיתה בחרה לקבל</Text>
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexDirection: 'row-reverse', gap: 8, paddingBottom: 4 }}
            style={{ marginBottom: 16 }}
          >
            <TouchableOpacity
              onPress={() => setSelectedGiftId(null)}
              style={[S.giftPill, selectedGiftId === null && S.giftPillActive, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
            >
              <Text style={[S.giftPillText, selectedGiftId === null && S.giftPillTextActive]}>לא נבחר</Text>
            </TouchableOpacity>
            {gifts.map((g) => {
              const active = selectedGiftId === g.id;
              return (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => setSelectedGiftId(g.id)}
                  style={[S.giftPill, active && S.giftPillActive, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                >
                  <Text style={[S.giftPillText, active && S.giftPillTextActive]}>{g.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={AS.fieldLabel}>הערה (אופציונלי)</Text>
          <TextInput
            value={redemptionNote}
            onChangeText={setRedemptionNote}
            placeholder="לדוגמה: אכלנו פיצה ביחד"
            placeholderTextColor="#94a3b8"
            textAlign="right"
            multiline
            numberOfLines={2}
            style={[AS.input, { marginBottom: 20 }]}
            accessibilityLabel="הערה על המתנה"
          />

          <View style={AS.sheetBtns}>
            <TouchableOpacity
              onPress={handleRecordRedemption}
              disabled={savingRedemption}
              style={[savingRedemption ? AS.saveBtnDisabled : AS.saveBtn, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
              accessibilityRole="button"
              accessibilityLabel="שמור רישום מתנה"
            >
              {savingRedemption
                ? <ActivityIndicator color="#fff" />
                : <Text style={AS.saveBtnText}>רשום מתנה</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRedemptionVisible(false)} style={AS.cancelBtn}>
              <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>
      </AdminSheet>
      </View>
    </SafeAreaView>
  );
}
