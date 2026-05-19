import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback } from 'react';
import { UserCheck, Trash2, Plus, ChevronRight, FileUp } from 'lucide-react-native';
import { Colors, TactileIconBtn } from '@/components/ui';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';
import { shadow } from '@/lib/shadow';
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
import AdminSheet from '@/components/AdminSheet';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { confirmAction } from '@/lib/confirm';
import { safeBack } from '@/lib/navigation';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import type { Tables } from '@/types/supabase';

type UserRow = Tables<'users'>;
type ClassRow = Tables<'classes'>;

interface TeacherWithClasses {
  user: UserRow;
  classIds: string[];
}

interface ParsedTeacher {
  display_name: string;
  email: string;
  status: 'new' | 'skip';
}

const S = StyleSheet.create({
  teacherCard: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(212,197,171,0.4)',
    ...shadow('#785900', 0, 8, 0.05, 12),
  },
  teacherTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  teacherAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.secondarySurface,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },
  teacherAvatarText: {
    fontSize: 16, fontWeight: '700', color: Colors.secondary,
    fontFamily: 'Baloo2_700Bold',
  } as any,
  teacherInfo: { flex: 1 },
  teacherName: { fontSize: 15, fontWeight: '700', color: Colors.text, textAlign: 'right', writingDirection: 'rtl' } as any,
  teacherEmail: { color: '#94a3b8', fontSize: 12, textAlign: 'right', writingDirection: 'rtl', marginTop: 1 } as any,
  teacherActions: { flexDirection: 'row-reverse', gap: 6 },
  assignBtn: {
    backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 12, height: 44,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
  },
  assignBtnText: { color: Colors.muted, fontSize: 12, fontWeight: '600' } as any,
  classChipRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  classChip: {
    backgroundColor: Colors.primaryLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
  },
  classChipText: { color: Colors.primary, fontSize: 12, fontWeight: '600' } as any,
  noClass: { color: '#94a3b8', fontSize: 12, writingDirection: 'rtl' } as any,
  assignSub: { color: '#94a3b8', fontSize: 13, textAlign: 'right', marginBottom: 4, writingDirection: 'rtl' } as any,
  assignHint: { color: '#64748b', fontSize: 12, textAlign: 'right', marginBottom: 12, writingDirection: 'rtl' } as any,
  classRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8, borderRadius: 12, borderWidth: 1, minHeight: 44,
  },
  classRowActive:   { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  classRowInactive: { backgroundColor: '#fff', borderColor: Colors.border },
  classRowText: { fontWeight: '600', fontSize: 14, writingDirection: 'rtl' } as any,
  classRowTextActive:   { color: Colors.primary },
  classRowTextInactive: { color: '#334155' },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive:   { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxInactive: { borderColor: '#cbd5e1' },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '700' } as any,
  selectAllRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  selectAllText:       { fontWeight: '700', fontSize: 14, color: Colors.primary, writingDirection: 'rtl' } as any,
  selectAllTextActive: { color: Colors.primary },

  // CSV import
  csvPickBtn: {
    backgroundColor: '#fff', borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1',
    borderRadius: 16, paddingVertical: 36, alignItems: 'center', marginBottom: 12,
  },
  csvPickIcon: {
    width: 56, height: 56, backgroundColor: Colors.primaryLight,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  csvPickTitle: { color: '#334155', fontWeight: '600', fontSize: 15, writingDirection: 'rtl' } as any,
  csvPickSub: { color: '#94a3b8', fontSize: 12, marginTop: 4, writingDirection: 'rtl' } as any,
  csvInfoBanner: {
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
  },
  csvInfoText: { color: '#3b82f6', fontSize: 12, textAlign: 'right', writingDirection: 'rtl' } as any,
  csvErrorBanner: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12,
  },
  csvErrorText: { color: '#dc2626', fontSize: 13, textAlign: 'right', writingDirection: 'rtl' } as any,
  csvSummaryRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 12 },
  csvSummaryCard: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  csvSummaryNew:  { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  csvSummarySkip: { backgroundColor: Colors.surface, borderColor: Colors.border },
  csvSummaryNum: { fontSize: 24, fontWeight: '700', marginBottom: 2 } as any,
  csvSummaryNumNew:  { color: '#065f46' },
  csvSummaryNumSkip: { color: '#64748b' },
  csvSummaryLabel: { fontSize: 11, fontWeight: '600' } as any,
  csvSummaryLabelNew:  { color: '#10B981' },
  csvSummaryLabelSkip: { color: '#94a3b8' },
  csvTable: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1,
    borderColor: '#f1f5f9', overflow: 'hidden', marginBottom: 12,
  },
  csvTableHead: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#f8fafc',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  csvTableHeadText: { color: Colors.muted, fontSize: 12, fontWeight: '700', writingDirection: 'rtl' } as any,
  csvTableRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  csvRowName: { color: '#334155', fontSize: 14, fontWeight: '600', writingDirection: 'rtl' } as any,
  csvRowEmail: { color: '#94a3b8', fontSize: 12, writingDirection: 'rtl' } as any,
  csvBadgeNew:  { backgroundColor: '#D1FAE5', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  csvBadgeSkip: { backgroundColor: '#f1f5f9', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  csvBadgeTextNew:  { color: '#065f46', fontSize: 11, fontWeight: '700' } as any,
  csvBadgeTextSkip: { color: '#94a3b8', fontSize: 11, fontWeight: '600' } as any,
});

export default function AdminTeachersScreen() {
  const { listPad, pageContent } = useAdminLayout();
  const { t } = useTranslation();
  const router = useRouter();
  const [teachers, setTeachers] = useState<TeacherWithClasses[]>([]);
  const [classes, setClasses]   = useState<ClassRow[]>([]);
  const [loading, setLoading]   = useState(true);

  const [inviteVisible, setInviteVisible] = useState(false);
  const [inviteEmail, setInviteEmail]     = useState('');
  const [inviteName, setInviteName]       = useState('');
  const [inviting, setInviting] = useState(false);

  // CSV import
  const [csvVisible,    setCsvVisible]    = useState(false);
  const [csvPreview,    setCsvPreview]    = useState<ParsedTeacher[] | null>(null);
  const [csvPickError,  setCsvPickError]  = useState<string | null>(null);
  const [csvImporting,  setCsvImporting]  = useState(false);

  const [assignTeacher, setAssignTeacher] = useState<UserRow | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [assigning, setAssigning] = useState(false);

  const loadData = useCallback(async () => {
    const [usersRes, classesRes, accessRes] = await Promise.all([
      supabase.from('users').select('*').eq('role', 'teacher').is('deleted_at', null).order('display_name'),
      supabase.from('classes').select('*').is('deleted_at', null).order('name'),
      supabase.from('user_class_access').select('*'),
    ]);

    if (!usersRes.error && !classesRes.error && !accessRes.error) {
      const accessMap = new Map<string, string[]>();
      for (const a of (accessRes.data ?? [])) {
        if (!accessMap.has(a.user_id)) accessMap.set(a.user_id, []);
        accessMap.get(a.user_id)!.push(a.class_id);
      }
      setTeachers((usersRes.data ?? []).map((u) => ({ user: u, classIds: accessMap.get(u.id) ?? [] })));
      setClasses(classesRes.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleInvite() {
    if (!inviteEmail.trim() || !inviteName.trim()) {
      Alert.alert('שגיאה', 'יש למלא שם ואימייל');
      return;
    }
    setInviting(true);

    // Create user with a random password (teacher will set their own via email link)
    const randomPwd = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: inviteEmail.trim().toLowerCase(),
      password: randomPwd,
      options: { data: { display_name: inviteName.trim() } },
    });

    if (authError) { setInviting(false); Alert.alert('שגיאה', authError.message); return; }

    const newUserId = authData.user?.id;
    if (newUserId) {
      const { error: insertError } = await supabase.from('users').insert({
        id: newUserId,
        email: inviteEmail.trim().toLowerCase(),
        display_name: inviteName.trim(),
        role: 'teacher',
      });
      if (insertError) { setInviting(false); Alert.alert('שגיאה', insertError.message); return; }
    }

    // Send password-reset email so the teacher can set their own password
    await supabase.auth.resetPasswordForEmail(inviteEmail.trim().toLowerCase());

    setInviting(false);
    setInviteVisible(false);
    setInviteEmail(''); setInviteName('');
    Alert.alert('✅', `הזמנה נשלחה ל-${inviteName.trim()} — ישלח מייל לקביעת סיסמה`);
    loadData();
  }

  async function handlePickTeacherCsv() {
    setCsvPickError(null);
    setCsvPreview(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const text = await fetch(result.assets[0].uri).then(r => r.text());

    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        const normalized = rows.map(r => ({
          display_name: (r.display_name ?? r['שם מלא'] ?? r.name ?? r['שם'] ?? '').trim(),
          email:        (r.email        ?? r['אימייל'] ?? '').trim().toLowerCase(),
        })).filter(r => r.display_name && r.email);

        if (normalized.length === 0) {
          setCsvPickError('לא נמצאו שורות תקינות. עמודות נדרשות: שם מלא, אימייל');
          return;
        }

        const { data: existingUsers } = await supabase.from('users').select('email');
        const existingEmails = new Set((existingUsers ?? []).map(u => u.email.toLowerCase()));

        setCsvPreview(normalized.map(r => ({
          display_name: r.display_name,
          email: r.email,
          status: existingEmails.has(r.email) ? ('skip' as const) : ('new' as const),
        })));
      },
      error: (err: Error) => setCsvPickError(`שגיאה בפענוח הקובץ: ${err.message}`),
    });
  }

  async function handleImportTeachers() {
    if (!csvPreview) return;
    const toCreate = csvPreview.filter(r => r.status === 'new');
    if (toCreate.length === 0) { Alert.alert('', 'כל המורים בקובץ כבר קיימים במערכת'); return; }

    setCsvImporting(true);
    let created = 0;
    const errors: string[] = [];

    for (const teacher of toCreate) {
      const randomPwd = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: teacher.email,
        password: randomPwd,
        options: { data: { display_name: teacher.display_name } },
      });
      if (authError || !authData.user) { errors.push(`${teacher.email}: ${authError?.message ?? 'שגיאה'}`); continue; }

      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: teacher.email,
        display_name: teacher.display_name,
        role: 'teacher',
      });
      if (insertError) { errors.push(`${teacher.email}: ${insertError.message}`); continue; }

      await supabase.auth.resetPasswordForEmail(teacher.email);
      created++;
    }

    setCsvImporting(false);

    if (errors.length > 0) Alert.alert('חלק מהייבוא נכשל', errors.slice(0, 5).join('\n'));
    if (created > 0) {
      setCsvVisible(false);
      setCsvPreview(null);
      Alert.alert('✅', `${created} מורים נוצרו — נשלח להם מייל לקביעת סיסמה`);
      loadData();
    }
  }

  function openAssign(teacher: UserRow, currentClassIds: string[]) {
    setAssignTeacher(teacher);
    setSelectedClasses(new Set(currentClassIds));
  }

  async function handleSaveAssignment() {
    if (!assignTeacher) return;
    setAssigning(true);
    const { error: delError } = await supabase.from('user_class_access').delete().eq('user_id', assignTeacher.id);
    if (delError) { setAssigning(false); Alert.alert('שגיאה', delError.message); return; }

    if (selectedClasses.size > 0) {
      const inserts = Array.from(selectedClasses).map((cid) => ({ user_id: assignTeacher.id, class_id: cid }));
      const { error: insError } = await supabase.from('user_class_access').insert(inserts);
      if (insError) { setAssigning(false); Alert.alert('שגיאה', insError.message); return; }
    }

    setAssigning(false);
    setAssignTeacher(null);
    loadData();
  }

  function toggleClass(classId: string) {
    setSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  }

  function toggleAllClasses() {
    if (selectedClasses.size === classes.length) {
      setSelectedClasses(new Set());
    } else {
      setSelectedClasses(new Set(classes.map((c) => c.id)));
    }
  }

  async function handleDeleteTeacher(teacher: UserRow) {
    confirmAction(
      t('areYouSure'),
      `למחוק את המורה ${teacher.display_name}?`,
      async () => {
        const { error } = await supabase
          .from('users')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', teacher.id);
        if (error) Alert.alert('שגיאה', error.message);
        else loadData();
      },
    );
  }

  return (
    <SafeAreaView style={AS.screen}>
      <View style={AS.header}>
        <View style={[AS.headerInner, pageContent]}>
          <View style={AS.headerLeft}>
            <TouchableOpacity onPress={() => safeBack(router, '/admin')} style={[AS.backBtn, webPointer]} accessibilityRole="button" accessibilityLabel="חזרה">
              <ChevronRight size={20} color={Colors.primaryDark} />
            </TouchableOpacity>
            <Text style={AS.headerTitle} accessibilityRole="header">{t('teachers')}</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
            <TouchableOpacity
              onPress={() => { setCsvVisible(true); setCsvPreview(null); setCsvPickError(null); }}
              style={[AS.addBtn, { backgroundColor: Colors.primaryLight, paddingHorizontal: 12 }, webPointer]}
              accessibilityRole="button" accessibilityLabel="ייבוא מורים מ-CSV"
            >
              <FileUp size={15} color={Colors.primaryDark} />
              <Text style={AS.addBtnText}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setInviteVisible(true)} style={[AS.addBtn, webPointer]} accessibilityRole="button" accessibilityLabel="הוסף מורה חדש">
              <Plus size={15} color={Colors.primaryDark} />
              <Text style={AS.addBtnText}>הוספה</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} accessibilityLabel="טוען מורים" />
      ) : (
        <ScrollView style={AS.list} contentContainerStyle={listPad}>
          <View style={pageContent}>
            {teachers.length === 0 ? (
              <View style={AS.emptyWrap}>
                <View style={[AS.emptyIcon, { backgroundColor: '#EDE9FE' }]}><UserCheck size={28} color="#7C3AED" /></View>
                <Text style={AS.emptyTitle}>אין מורים עדיין</Text>
                <Text style={AS.emptyHint}>לחץ על "+ הוספה" כדי להוסיף.</Text>
              </View>
            ) : (
              teachers.map(({ user }) => {
                return (
                  <View key={user.id} style={S.teacherCard} accessibilityLabel={`מורה: ${user.display_name}`}>
                    <View style={S.teacherTop}>
                      {/* Initials avatar */}
                      <View style={S.teacherAvatar}>
                        <Text style={S.teacherAvatarText}>
                          {user.display_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                        </Text>
                      </View>
                      <View style={S.teacherInfo}>
                        <Text style={S.teacherName}>{user.display_name}</Text>
                        <Text style={S.teacherEmail}>{user.email}</Text>
                      </View>
                      <View style={S.teacherActions}>
                        <TactileIconBtn
                          onPress={() => handleDeleteTeacher(user)}
                          style={AS.iconBtnDanger}
                          shadowColor="rgba(186,26,26,0.2)"
                          accessibilityLabel={`מחק מורה ${user.display_name}`}
                        >
                          <Trash2 size={16} color={Colors.danger} />
                        </TactileIconBtn>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Invite Sheet */}
      <AdminSheet visible={inviteVisible} onClose={() => setInviteVisible(false)}>
        <Text style={AS.sheetTitle} accessibilityRole="header">{t('inviteTeacher')}</Text>

        <View style={{ backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE' }}>
          <Text style={{ color: '#3b82f6', fontSize: 12, textAlign: 'right', writingDirection: 'rtl' } as any}>
            המורה יקבל מייל עם קישור לקביעת סיסמה
          </Text>
        </View>

        <Text style={AS.fieldLabel}>שם המורה</Text>
        <Text style={AS.fieldHint}>שם התצוגה במערכת</Text>
        <TextInput value={inviteName} onChangeText={setInviteName} placeholder="דנה כהן" placeholderTextColor="#94a3b8" textAlign="right" style={AS.input} accessibilityLabel="שם המורה" />

        <Text style={AS.fieldLabel}>{t('email')}</Text>
        <Text style={AS.fieldHint}>יישלח קישור לכתובת זו</Text>
        <TextInput value={inviteEmail} onChangeText={setInviteEmail} placeholder="dana@school.com" placeholderTextColor="#94a3b8" keyboardType="email-address" autoCapitalize="none" textAlign="right" style={[AS.input, { marginBottom: 20 }]} accessibilityLabel="אימייל" />

        <View style={AS.sheetBtns}>
          <TouchableOpacity
            onPress={handleInvite}
            disabled={inviting || !inviteEmail.trim() || !inviteName.trim()}
            style={[(inviting || !inviteEmail.trim() || !inviteName.trim()) ? AS.saveBtnDisabled : AS.saveBtn, webPointer]}
            accessibilityRole="button" accessibilityLabel="שלח הזמנה"
          >
            {inviting ? <ActivityIndicator color="#fff" /> : <Text style={AS.saveBtnText}>שלח הזמנה</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setInviteVisible(false)} style={[AS.cancelBtn, webPointer]} accessibilityRole="button" accessibilityLabel="ביטול">
            <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </AdminSheet>

      {/* CSV Import Sheet */}
      <AdminSheet visible={csvVisible} onClose={() => setCsvVisible(false)}>
        <Text style={AS.sheetTitle} accessibilityRole="header">ייבוא מורים מ-CSV</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
          {/* Format hint */}
          <View style={S.csvInfoBanner}>
            <Text style={S.csvInfoText}>
              עמודות נדרשות: שם מלא, אימייל{'\n'}
              ייוצרו רק מורים שלא קיימים עדיין במערכת
            </Text>
          </View>

          {/* Pick file or reset */}
          {!csvPreview ? (
            <TouchableOpacity
              onPress={handlePickTeacherCsv}
              style={[S.csvPickBtn, webPointer]}
              accessibilityRole="button" accessibilityLabel="בחר קובץ CSV"
            >
              <View style={S.csvPickIcon}>
                <FileUp size={26} color={Colors.primary} />
              </View>
              <Text style={S.csvPickTitle}>לחץ לבחירת קובץ CSV</Text>
              <Text style={S.csvPickSub}>שם מלא, אימייל</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handlePickTeacherCsv}
              style={[{ alignSelf: 'flex-end', marginBottom: 12 }, webPointer]}
              accessibilityRole="button" accessibilityLabel="בחר קובץ אחר"
            >
              <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' } as any}>← קובץ אחר</Text>
            </TouchableOpacity>
          )}

          {/* Error */}
          {csvPickError && (
            <View style={S.csvErrorBanner}>
              <Text style={S.csvErrorText}>{csvPickError}</Text>
            </View>
          )}

          {/* Preview */}
          {csvPreview && (() => {
            const newCount  = csvPreview.filter(r => r.status === 'new').length;
            const skipCount = csvPreview.filter(r => r.status === 'skip').length;
            return (
              <>
                <View style={S.csvSummaryRow}>
                  <View style={[S.csvSummaryCard, S.csvSummaryNew]}>
                    <Text style={[S.csvSummaryNum, S.csvSummaryNumNew]}>{newCount}</Text>
                    <Text style={[S.csvSummaryLabel, S.csvSummaryLabelNew]}>מורים חדשים</Text>
                  </View>
                  <View style={[S.csvSummaryCard, S.csvSummarySkip]}>
                    <Text style={[S.csvSummaryNum, S.csvSummaryNumSkip]}>{skipCount}</Text>
                    <Text style={[S.csvSummaryLabel, S.csvSummaryLabelSkip]}>כבר קיימים</Text>
                  </View>
                </View>

                <View style={S.csvTable}>
                  <View style={S.csvTableHead}>
                    <Text style={S.csvTableHeadText}>שם</Text>
                    <Text style={S.csvTableHeadText}>סטטוס</Text>
                  </View>
                  {csvPreview.map((row, i) => (
                    <View key={i} style={[S.csvTableRow, row.status === 'skip' && { opacity: 0.45 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={S.csvRowName}>{row.display_name}</Text>
                        <Text style={S.csvRowEmail}>{row.email}</Text>
                      </View>
                      <View style={row.status === 'new' ? S.csvBadgeNew : S.csvBadgeSkip}>
                        <Text style={row.status === 'new' ? S.csvBadgeTextNew : S.csvBadgeTextSkip}>
                          {row.status === 'new' ? '✓ חדש' : 'קיים'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={AS.sheetBtns}>
                  <TouchableOpacity
                    onPress={handleImportTeachers}
                    disabled={csvImporting || newCount === 0}
                    style={[(csvImporting || newCount === 0) ? AS.saveBtnDisabled : AS.saveBtn, webPointer]}
                    accessibilityRole="button"
                    accessibilityLabel={`ייבא ${newCount} מורים`}
                    accessibilityState={{ disabled: csvImporting || newCount === 0 }}
                  >
                    {csvImporting
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={AS.saveBtnText}>
                          {newCount > 0 ? `ייבא ${newCount} מורים ושלח מייל` : 'אין מורים חדשים'}
                        </Text>}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setCsvVisible(false)} style={[AS.cancelBtn, webPointer]} accessibilityRole="button" accessibilityLabel="ביטול">
                    <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}

          <View style={{ height: 16 }} />
        </ScrollView>
      </AdminSheet>

      {/* Class Assignment Sheet */}
      <AdminSheet visible={!!assignTeacher} onClose={() => setAssignTeacher(null)} maxHeightFraction={0.8}>
        <Text style={AS.sheetTitle} accessibilityRole="header">שיוך כיתות</Text>
        <Text style={S.assignSub}>{assignTeacher?.display_name} — בחר כיתות</Text>
        <Text style={S.assignHint}>המורה יוכל לתת נקודות לתלמידי הכיתות שנבחרו</Text>

        {/* Select all toggle */}
        {classes.length > 0 && (() => {
          const allSelected = selectedClasses.size === classes.length;
          return (
            <TouchableOpacity
              onPress={toggleAllClasses}
              style={[S.selectAllRow, webPointer]}
              accessibilityRole="button"
              accessibilityLabel={allSelected ? 'בטל בחירת הכל' : 'בחר הכל'}
            >
              <Text style={[S.selectAllText, allSelected && S.selectAllTextActive]}>
                {allSelected ? 'בטל בחירת הכל' : 'בחר הכל'}
              </Text>
              <View style={[S.checkbox, allSelected ? S.checkboxActive : S.checkboxInactive]}>
                {allSelected && <Text style={S.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })()}

        <ScrollView showsVerticalScrollIndicator={false}>
          {classes.map((cls) => {
            const checked = selectedClasses.has(cls.id);
            return (
              <TouchableOpacity
                key={cls.id}
                onPress={() => toggleClass(cls.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                accessibilityLabel={`${cls.name}${checked ? ' — מסומן' : ''}`}
                style={[S.classRow, checked ? S.classRowActive : S.classRowInactive, webPointer]}
              >
                <Text style={[S.classRowText, checked ? S.classRowTextActive : S.classRowTextInactive]}>
                  {cls.name}
                </Text>
                <View style={[S.checkbox, checked ? S.checkboxActive : S.checkboxInactive]}>
                  {checked && <Text style={S.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[AS.sheetBtns, { marginTop: 16 }]}>
          <TouchableOpacity onPress={handleSaveAssignment} disabled={assigning} style={[assigning ? AS.saveBtnDisabled : AS.saveBtn, webPointer]} accessibilityRole="button" accessibilityLabel="שמור שיוך">
            {assigning ? <ActivityIndicator color="#fff" /> : <Text style={AS.saveBtnText}>{t('save')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAssignTeacher(null)} style={[AS.cancelBtn, webPointer]} accessibilityRole="button" accessibilityLabel="ביטול">
            <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      </AdminSheet>
    </SafeAreaView>
  );
}
