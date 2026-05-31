import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
   ScrollView, Alert, StyleSheet, TextInput,
} from 'react-native';
import { confirmAction } from '@/lib/confirm';
import AdminSheet from '@/components/AdminSheet';
import StudentCsvUploadSheet from '@/components/StudentCsvUploadSheet';
import { Building2, Pencil, Trash2, Plus, ChevronRight, Layers, Upload } from 'lucide-react-native';
import { Colors, TactileIconBtn, AddBtn } from '@/components/ui';
import { AS, webPointer, useAdminLayout } from '@/lib/adminStyles';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/hooks/useSettings';
import { safeBack } from '@/lib/navigation';
import type { Tables } from '@/types/supabase';
import { getClassColorScheme } from '@/lib/classColors';
import { useBreakpoint } from '@/lib/responsive';

type ClassRow = Tables<'classes'>;

// ── Hebrew year helpers ───────────────────────────────────────────────────────
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
  return [0, 1, 2].map(i => toHebrewYear(base + i));
}

// ── Constants ─────────────────────────────────────────────────────────────────
const GRADES  = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
const NUMBERS = ['1', '2', '3', '4'];

function buildName(grade: string, num: string) {
  return grade && num ? `${grade}׳${num}` : '';
}

function parseClassName(name: string): { grade: string; num: string } {
  // handles  א'1  א׳1  א'1  (various apostrophe chars)
  const m = name.match(/^([אבגדהו])[׳''](\d)$/);
  return m ? { grade: m[1], num: m[2] } : { grade: '', num: '' };
}

// ── Pill selector ─────────────────────────────────────────────────────────────
function PillGroup({
  options, value, onSelect, label,
}: { options: string[]; value: string; onSelect: (v: string) => void; label?: string }) {
  return (
    <View style={S.pillGroup}>
      {options.map(opt => {
        const on = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${label ?? ''} ${opt}`}
            style={[S.pill, on ? S.pillOn : S.pillOff, webPointer]}
          >
            <Text style={[S.pillText, on ? S.pillTextOn : S.pillTextOff]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────
function Stepper({ value, onChange, max = 4 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <TouchableOpacity
        onPress={() => value > 0 && onChange(value - 1)}
        disabled={value <= 0}
        accessibilityRole="button" accessibilityLabel="הפחת"
        style={[S.stepBtn, value <= 0 && { opacity: 0.3 }, webPointer]}
      >
        <Text style={S.stepBtnText}>−</Text>
      </TouchableOpacity>
      <Text style={S.stepCount}>{value}</Text>
      <TouchableOpacity
        onPress={() => value < max && onChange(value + 1)}
        disabled={value >= max}
        accessibilityRole="button" accessibilityLabel="הוסף"
        style={[S.stepBtn, value >= max && { opacity: 0.3 }, webPointer]}
      >
        <Text style={S.stepBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AdminClassesScreen() {
  const { listPad, pageContent } = useAdminLayout();
  const { isDesktop } = useBreakpoint();
  const { t } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const currentYear = settings?.current_year ?? '';
  const [classes, setClasses]       = useState<ClassRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);

  const schoolYears = useMemo(() => getSchoolYears(), []);

  const [selGrade, setSelGrade] = useState('');
  const [selNum,   setSelNum]   = useState('');
  const [saving,   setSaving]   = useState(false);

  const previewName = buildName(selGrade, selNum);
  const canSave     = !!selGrade && !!selNum;

  // ── Bulk state ──
  const EMPTY_COUNTS = useMemo(() => Object.fromEntries(GRADES.map(g => [g, 0])), []);
  const [bulkVisible,  setBulkVisible]  = useState(false);
  const [bulkCounts,   setBulkCounts]   = useState<Record<string, number>>(EMPTY_COUNTS);
  const [bulkCreating, setBulkCreating] = useState(false);
  const [uploadClass, setUploadClass] = useState<ClassRow | null>(null);

  const bulkEffectiveYear = currentYear || schoolYears[0];

  const bulkPreview = useMemo(() => {
    const existingNames = new Set(
      classes.filter(c => (c.year ?? '') === (bulkEffectiveYear ?? '')).map(c => c.name)
    );
    const items: { name: string; grade: string; status: 'new' | 'skip' }[] = [];
    for (const grade of GRADES) {
      const count = bulkCounts[grade] ?? 0;
      for (let i = 1; i <= count; i++) {
        const name = buildName(grade, String(i));
        items.push({ name, grade, status: existingNames.has(name) ? 'skip' : 'new' });
      }
    }
    return items;
  }, [bulkCounts, bulkEffectiveYear, classes]);

  const bulkNewCount  = bulkPreview.filter(p => p.status === 'new').length;
  const bulkSkipCount = bulkPreview.filter(p => p.status === 'skip').length;

  const sortedClasses = useMemo(() => {
    return [...classes].sort((a, b) => {
      const gi = (c: ClassRow) => GRADES.indexOf(c.grade ?? c.name.charAt(0));
      const gd = gi(a) - gi(b);
      if (gd !== 0) return gd;
      return parseInt(parseClassName(a.name).num || '0') - parseInt(parseClassName(b.name).num || '0');
    });
  }, [classes]);

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

    const { data, error } = await classesQuery;
    if (!error) setClasses(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  function openAdd() {
    setEditingClass(null);
    setSelGrade(''); setSelNum('');
    setModalVisible(true);
  }

  function openEdit(cls: ClassRow) {
    setEditingClass(cls);
    const parsed = parseClassName(cls.name);
    setSelGrade(parsed.grade);
    setSelNum(parsed.num);
    setModalVisible(true);
  }

  function closeClassModal() {
    setModalVisible(false);
    setEditingClass(null);
    setSelGrade('');
    setSelNum('');
  }

  async function handleSave() {
    if (!canSave) { Alert.alert('שגיאה', 'יש לבחור שכבה ומספר כיתה'); return; }
    setSaving(true);
    const payload = {
      name:  previewName,
      grade: selGrade,
      year:  currentYear || bulkEffectiveYear || null,
    };

    let error: { message: string } | null = null;
    if (editingClass) {
      ({ error } = await supabase.from('classes').update(payload).eq('id', editingClass.id));
    } else {
      ({ error } = await supabase.from('classes').insert(payload));
    }

    setSaving(false);
    if (error) Alert.alert('שגיאה', error.message);
    else {
      closeClassModal();
      loadClasses();
    }
  }

  async function handleDelete(cls: ClassRow) {
    confirmAction(
      t('areYouSure'),
      `למחוק את כיתה ${cls.name}?`,
      async () => {
        const { error } = await supabase
          .from('classes')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', cls.id);
        if (error) Alert.alert('שגיאה', error.message);
        else loadClasses();
      },
    );
  }

  async function handleBulkCreate() {
    const toCreate = bulkPreview.filter(p => p.status === 'new');
    if (toCreate.length === 0) { Alert.alert('', 'אין כיתות חדשות ליצור — כל הכיתות שנבחרו כבר קיימות'); return; }
    setBulkCreating(true);
    const rows = toCreate.map(p => ({
      name:  p.name,
      grade: p.grade,
      year:  bulkEffectiveYear || null,
    }));
    const { error } = await supabase.from('classes').insert(rows);
    setBulkCreating(false);
    if (error) { Alert.alert('שגיאה', error.message); return; }
    setBulkVisible(false);
    setBulkCounts(EMPTY_COUNTS);
    loadClasses();
  }

  return (
    <SafeAreaView style={AS.screen}>
      <View style={AS.header}>
        <View style={[AS.headerInner, pageContent]}>
          <View style={AS.headerLeft}>
            <TactileIconBtn onPress={() => safeBack(router, '/admin')} style={AS.backBtn} accessibilityLabel="חזרה">
              <ChevronRight size={20} color={Colors.primaryDark} />
            </TactileIconBtn>
            <Text style={AS.headerTitle} accessibilityRole="header">{t('classes')}</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', gap: 8 }}>
            {isDesktop && (
              <AddBtn
                onPress={() => { setBulkVisible(true); setBulkCounts(EMPTY_COUNTS); }}
                light
                accessibilityLabel="יצירת כיתות בבulk"
              >
                <Layers size={18} color={Colors.primaryDark} />
                <Text style={AS.addBtnText}>הוספה חכמה</Text>
              </AddBtn>
            )}
            <AddBtn onPress={openAdd} accessibilityLabel="הוסף כיתה חדשה" />
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 48 }} accessibilityLabel="טוען כיתות" />
      ) : (
        <ScrollView style={AS.list} contentContainerStyle={listPad}>
          <View style={pageContent}>
            {sortedClasses.length === 0 ? (
              <View style={AS.emptyWrap}>
                <View style={AS.emptyIcon}><Building2 size={28} color={Colors.primary} /></View>
                <Text style={AS.emptyTitle}>אין כיתות עדיין</Text>
                <Text style={AS.emptyHint}>
                  {currentYear
                    ? `אין כיתות לשנת לימודים ${currentYear}. לחץ על "+ הוספה" כדי להוסיף.`
                    : 'לחץ על "+ הוספה" כדי להוסיף.'}
                </Text>
              </View>
            ) : (
              sortedClasses.map((cls) => {
                const scheme = getClassColorScheme(cls.grade ?? cls.name);
                return (
                <View key={cls.id} style={AS.row} accessibilityLabel={`כיתה ${cls.name}`}>
                  <View style={[S.classCircle, { backgroundColor: scheme.bg }]}>
                    <Text style={[S.classCircleText, { color: scheme.text }]}>
                      {cls.grade ?? cls.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={AS.rowLeft}>
                    <Text style={AS.rowTitle}>כיתה {cls.name}</Text>
                  </View>
                  <View style={AS.rowActions}>
                    <TactileIconBtn onPress={() => setUploadClass(cls)} style={AS.iconBtnSecondary} shadowColor="rgba(0,96,172,0.2)" accessibilityLabel={`העלאת תלמידים לכיתה ${cls.name}`}>
                      <Upload size={16} color={Colors.secondary} />
                    </TactileIconBtn>
                    <TactileIconBtn onPress={() => openEdit(cls)} style={AS.iconBtn} accessibilityLabel={`ערוך ${cls.name}`}>
                      <Pencil size={16} color={Colors.muted} />
                    </TactileIconBtn>
                    <TactileIconBtn onPress={() => handleDelete(cls)} style={AS.iconBtnDanger} shadowColor="rgba(186,26,26,0.2)" accessibilityLabel={`מחק ${cls.name}`}>
                      <Trash2 size={16} color={Colors.danger} />
                    </TactileIconBtn>
                  </View>
                </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* ── Bulk creation sheet ── */}
      <AdminSheet visible={bulkVisible} onClose={() => setBulkVisible(false)}>
        <Text style={AS.sheetTitle} accessibilityRole="header">יצירת כיתות מרוכזת</Text>

        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
          {/* Grade rows */}
          <Text style={[AS.fieldLabel, { marginBottom: 12 }]}>
            כמה כיתות בכל שכבה?
            {bulkEffectiveYear ? ` (${bulkEffectiveYear})` : ''}
          </Text>
          {GRADES.map(grade => {
            const count = bulkCounts[grade] ?? 0;
            const scheme = getClassColorScheme(grade);
            const names = count > 0
              ? Array.from({ length: count }, (_, i) => buildName(grade, String(i + 1))).join(', ')
              : '—';
            return (
              <View key={grade} style={S.gradeRow}>
                <View style={[S.gradeCircle, { backgroundColor: scheme.bg }]}>
                  <Text style={[S.gradeCircleText, { color: scheme.text }]}>{grade}׳</Text>
                </View>
                <Text style={S.gradeNamesText} numberOfLines={1}>{names}</Text>
                <Stepper value={count} onChange={v => setBulkCounts(prev => ({ ...prev, [grade]: v }))} />
              </View>
            );
          })}

          {/* Preview summary */}
          {bulkPreview.length > 0 && (
            <View style={S.bulkSummary}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={S.bulkSummaryNew}>✓ {bulkNewCount} כיתות חדשות</Text>
                {bulkSkipCount > 0 && (
                  <Text style={S.bulkSummarySkip}>{bulkSkipCount} כבר קיימות</Text>
                )}
              </View>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 }}>
                {bulkPreview.map(p => (
                  <View key={p.name} style={[S.bulkChip, p.status === 'skip' && S.bulkChipSkip]}>
                    <Text style={[S.bulkChipText, p.status === 'skip' && S.bulkChipTextSkip]}>
                      {p.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={[AS.sheetBtns, { marginTop: 20 }]}>
            <TouchableOpacity
              onPress={handleBulkCreate}
              disabled={bulkCreating || bulkNewCount === 0}
              style={[(bulkCreating || bulkNewCount === 0) ? AS.saveBtnDisabled : AS.saveBtn, webPointer]}
              accessibilityRole="button"
              accessibilityLabel={`צור ${bulkNewCount} כיתות`}
              accessibilityState={{ disabled: bulkCreating || bulkNewCount === 0 }}
            >
              {bulkCreating
                ? <ActivityIndicator color="#fff" />
                : <Text style={AS.saveBtnText}>
                    {bulkNewCount > 0 ? `צור ${bulkNewCount} כיתות` : 'בחר כיתות ליצירה'}
                  </Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBulkVisible(false)} style={[AS.cancelBtn, webPointer]} accessibilityRole="button" accessibilityLabel="ביטול">
              <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>
      </AdminSheet>

      <AdminSheet visible={modalVisible} onClose={closeClassModal}>
            <Text style={AS.sheetTitle} accessibilityRole="header">
              {editingClass ? `ערוך — כיתה ${editingClass.name}` : 'הוסף כיתה'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Grade letter */}
              <Text style={AS.fieldLabel}>שכבה</Text>
              <Text style={AS.fieldHint}>בחר שכבת הגיל</Text>
              <PillGroup options={GRADES} value={selGrade} onSelect={setSelGrade} label="שכבה" />

              {/* Class number */}
              <Text style={[AS.fieldLabel, { marginTop: 16 }]}>מספר כיתה</Text>
              <Text style={AS.fieldHint}>בחר מספר מקבילה</Text>
              <PillGroup options={NUMBERS} value={selNum} onSelect={setSelNum} label="מספר כיתה" />

              {/* Preview */}
              {previewName ? (
                <View style={S.preview}>
                  <Text style={S.previewLabel}>שם הכיתה שייווצר</Text>
                  <Text style={S.previewName}>כיתה {previewName}</Text>
                </View>
              ) : (
                <View style={S.previewEmpty}>
                  <Text style={S.previewEmptyText}>בחר שכבה ומספר כדי לראות תצוגה מקדימה</Text>
                </View>
              )}
            </ScrollView>

            <View style={[AS.sheetBtns, { marginTop: 16 }]}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave || saving}
                style={[(!canSave || saving) ? AS.saveBtnDisabled : AS.saveBtn, webPointer]}
                accessibilityRole="button"
                accessibilityLabel="שמור כיתה"
                accessibilityState={{ disabled: !canSave || saving }}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={AS.saveBtnText}>{t('save')}</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={closeClassModal} style={[AS.cancelBtn, webPointer]} accessibilityRole="button" accessibilityLabel="ביטול">
                <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
      </AdminSheet>

      {uploadClass ? (
        <StudentCsvUploadSheet
          visible={!!uploadClass}
          classId={uploadClass.id}
          className={uploadClass.name}
          onClose={() => setUploadClass(null)}
          onImported={() => setUploadClass(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  // Pill selector
  pillGroup: {
    flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginTop: 6,
  },
  pill: {
    height: 44, minWidth: 52, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14,
  },
  pillOn:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillOff: { backgroundColor: Colors.surface, borderColor: Colors.border },
  pillText: { fontSize: 16, fontWeight: '700', fontFamily: 'Baloo2_700Bold' } as any,
  pillTextOn:  { color: '#fff' },
  pillTextOff: { color: Colors.muted },

  // Preview
  preview: {
    marginTop: 20, backgroundColor: Colors.primaryLight,
    borderRadius: 12, padding: 16, alignItems: 'center', gap: 4,
  },
  previewLabel: {
    color: Colors.primary, fontSize: 12, fontWeight: '600',
  } as any,
  previewName: {
    color: Colors.primary, fontSize: 22, fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
  } as any,
  previewEmpty: {
    marginTop: 20, backgroundColor: Colors.surface, borderRadius: 12,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  previewEmptyText: {
    color: '#94A3B8', fontSize: 13, textAlign: 'center', writingDirection: 'rtl',
  } as any,

  // Class list row
  classCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 12,
  },
  classCircleText: {
    fontSize: 18, fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
  } as any,

  // Stepper
  stepBtn: {
    width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary,
  },
  stepBtnText: { color: Colors.primary, fontSize: 18, fontWeight: '700', lineHeight: 22 } as any,
  stepCount: {
    minWidth: 28, textAlign: 'center', fontSize: 16, fontWeight: '700',
    color: '#1e293b', fontFamily: 'Baloo2_700Bold',
  } as any,

  // Grade row (bulk sheet)
  gradeRow: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10,
  },
  gradeCircle: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  gradeCircleText: {
    fontSize: 16, fontWeight: '700', fontFamily: 'Baloo2_700Bold',
  } as any,
  gradeNamesText: {
    flex: 1, color: '#64748b', fontSize: 13, textAlign: 'right', writingDirection: 'rtl',
  } as any,

  // Bulk preview
  bulkSummary: {
    marginTop: 16, backgroundColor: Colors.surface,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border,
  },
  bulkSummaryNew: { color: Colors.success, fontSize: 13, fontWeight: '700' } as any,
  bulkSummarySkip: { color: '#94a3b8', fontSize: 13, fontWeight: '600' } as any,
  bulkChip: {
    backgroundColor: '#ECFDF5', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#6EE7B7',
  },
  bulkChipSkip: { backgroundColor: Colors.surface, borderColor: Colors.border },
  bulkChipText: { color: '#065f46', fontSize: 13, fontWeight: '600' } as any,
  bulkChipTextSkip: { color: '#94a3b8' } as any,
});
