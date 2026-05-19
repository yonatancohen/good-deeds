import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import * as DocumentPicker from 'expo-document-picker';
import { FolderOpen, CheckCircle2 } from 'lucide-react-native';
import AdminSheet from '@/components/AdminSheet';
import { Colors } from '@/components/ui';
import { AS, webPointer } from '@/lib/adminStyles';
import { useBreakpoint } from '@/lib/responsive';
import {
  parseCsvText,
  previewStudents,
  insertStudents,
  type PreviewStudent,
} from '@/lib/studentImport';

const S = StyleSheet.create({
  infoBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  infoBannerTitle: {
    color: '#1e40af',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 4,
    writingDirection: 'rtl',
  } as any,
  infoBannerText: {
    color: '#3b82f6',
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  pickBtn: {
    backgroundColor: Colors.bg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickIconBox: {
    width: 64,
    height: 64,
    backgroundColor: Colors.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pickTitle: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 16,
    writingDirection: 'rtl',
  } as any,
  pickSub: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 4,
    writingDirection: 'rtl',
  } as any,
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  summaryRow: { flexDirection: 'row-reverse', gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  summaryCardNew: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  summaryCardSkip: { backgroundColor: Colors.surface, borderColor: Colors.border },
  summaryNum: { fontSize: 28, fontWeight: '700', marginBottom: 4 } as any,
  summaryNumNew: { color: '#065f46' },
  summaryNumSkip: { color: '#64748b' },
  summaryLabel: { fontSize: 12, fontWeight: '600', writingDirection: 'rtl' } as any,
  summaryLabelNew: { color: '#10B981' },
  summaryLabelSkip: { color: '#94a3b8' },
  previewTable: {
    backgroundColor: Colors.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableHeaderText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '700',
    writingDirection: 'rtl',
  } as any,
  tableRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  tableRowText: { color: '#334155', fontSize: 14, writingDirection: 'rtl' } as any,
  statusBadgeNew: {
    backgroundColor: '#D1FAE5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  statusBadgeSkip: {
    backgroundColor: '#f1f5f9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  statusTextNew: { color: '#065f46', fontSize: 12, fontWeight: '600' } as any,
  statusTextSkip: { color: '#94a3b8', fontSize: 12, fontWeight: '600' } as any,
  actionRow: { flexDirection: 'row-reverse', gap: 12, marginBottom: 8 },
  importBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  importBtnActive: { backgroundColor: Colors.primary },
  importBtnDisabled: { backgroundColor: Colors.surfaceDim },
  importBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 } as any,
  resetBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  resetBtnText: { color: '#475569', fontWeight: '700', fontSize: 16 } as any,
  doneWrap: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 8 },
  doneIconBox: {
    width: 72,
    height: 72,
    backgroundColor: '#D1FAE5',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
  } as any,
  doneSub: {
    color: Colors.muted,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    writingDirection: 'rtl',
  } as any,
});

export interface StudentCsvUploadSheetProps {
  visible: boolean;
  classId: string;
  className?: string;
  onClose: () => void;
  /** Called after a successful import with the number of students added */
  onImported?: (count: number) => void;
}

export default function StudentCsvUploadSheet({
  visible,
  classId,
  className,
  onClose,
  onImported,
}: StudentCsvUploadSheetProps) {
  const { t } = useTranslation();
  const { isDesktop } = useBreakpoint();

  const [preview, setPreview] = useState<PreviewStudent[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [pickError, setPickError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setPreview(null);
      setImporting(false);
      setDone(false);
      setImportedCount(0);
      setPickError(null);
    }
  }, [visible]);

  function handleDismiss() {
    onClose();
  }

  async function handlePickFile() {
    setPickError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const file = result.assets[0];
    try {
      const text = await fetch(file.uri).then((r) => r.text());
      const normalized = await parseCsvText(text);

      if (normalized.length === 0) {
        setPickError('לא נמצאו שורות תקינות בקובץ');
        return;
      }

      const parsed = await previewStudents(classId, normalized);
      setPreview(parsed);
    } catch (err: unknown) {
      setPickError(`שגיאה בפענוח הקובץ: ${err instanceof Error ? err.message : 'שגיאה'}`);
    }
  }

  async function handleImport() {
    if (!preview) return;

    const toInsert = preview.filter((r) => r.status === 'new');

    if (toInsert.length === 0) {
      Alert.alert('אין תלמידים חדשים', 'כל התלמידים בקובץ כבר קיימים בכיתה');
      return;
    }

    setImporting(true);
    const { count, error } = await insertStudents(classId, toInsert);
    setImporting(false);

    if (error) {
      Alert.alert('שגיאת ייבוא', error);
    } else {
      setImportedCount(count);
      setDone(true);
      onImported?.(count);
    }
  }

  const newCount = preview?.filter((r) => r.status === 'new').length ?? 0;
  const skipCount = preview?.filter((r) => r.status === 'skip').length ?? 0;
  const title = className ? `${t('uploadCsv')} — ${className}` : t('uploadCsv');

  const body = done ? (
    <View style={S.doneWrap}>
      <View style={S.doneIconBox}>
        <CheckCircle2 size={36} color={Colors.success} />
      </View>
      <Text style={S.doneTitle}>{t('imported')}</Text>
      <Text style={S.doneSub}>{importedCount} תלמידים יובאו לכיתה</Text>
      <View style={AS.sheetBtns}>
        <TouchableOpacity
          onPress={handleDismiss}
          style={[AS.saveBtn, webPointer]}
          accessibilityRole="button"
          accessibilityLabel="סגור"
        >
          <Text style={AS.saveBtnText}>סגור</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : (
    <>
      <View style={S.infoBanner}>
        <Text style={S.infoBannerTitle}>{t('uploadCsvHint')}</Text>
        <Text style={S.infoBannerText}>
          עמודות נדרשות: שם פרטי, שם משפחה{'\n'}
          תלמידים שכבר קיימים יישארו ללא שינוי
        </Text>
      </View>

      {!preview && (
        <TouchableOpacity
          onPress={handlePickFile}
          style={[S.pickBtn, webPointer]}
          accessibilityRole="button"
          accessibilityLabel="בחר קובץ CSV"
        >
          <View style={S.pickIconBox}>
            <FolderOpen size={28} color={Colors.primary} />
          </View>
          <Text style={S.pickTitle}>לחץ לבחירת קובץ CSV</Text>
          <Text style={S.pickSub}>קובץ .csv עם שמות התלמידים</Text>
        </TouchableOpacity>
      )}

      {pickError && (
        <View style={S.errorBanner}>
          <Text style={S.errorText}>{pickError}</Text>
        </View>
      )}

      {preview && (
        <>
          <View style={S.summaryRow}>
            <View style={[S.summaryCard, S.summaryCardNew]}>
              <Text style={[S.summaryNum, S.summaryNumNew]}>{newCount}</Text>
              <Text style={[S.summaryLabel, S.summaryLabelNew]}>{t('csvNew')}</Text>
            </View>
            <View style={[S.summaryCard, S.summaryCardSkip]}>
              <Text style={[S.summaryNum, S.summaryNumSkip]}>{skipCount}</Text>
              <Text style={[S.summaryLabel, S.summaryLabelSkip]}>{t('csvSkipped')}</Text>
            </View>
          </View>

          <View style={S.previewTable}>
            <View style={S.tableHeader}>
              <Text style={S.tableHeaderText}>שם התלמיד</Text>
              <Text style={S.tableHeaderText}>סטטוס</Text>
            </View>
            {preview.map((row, i) => (
              <View
                key={i}
                style={[S.tableRow, row.status === 'skip' && { opacity: 0.5 }]}
                accessibilityLabel={`${row.first_name} ${row.last_name} — ${row.status === 'new' ? 'תלמיד חדש' : 'כבר קיים'}`}
              >
                <Text style={S.tableRowText}>
                  {row.first_name} {row.last_name}
                </Text>
                <View style={row.status === 'new' ? S.statusBadgeNew : S.statusBadgeSkip}>
                  <Text style={row.status === 'new' ? S.statusTextNew : S.statusTextSkip}>
                    {row.status === 'new' ? '✓ חדש' : 'קיים'}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={S.actionRow}>
            <TouchableOpacity
              onPress={handleImport}
              disabled={importing || newCount === 0}
              style={[
                S.importBtn,
                importing || newCount === 0 ? S.importBtnDisabled : S.importBtnActive,
                webPointer,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`ייבא ${newCount} תלמידים חדשים`}
            >
              {importing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={S.importBtnText}>{t('csvImport')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setPreview(null);
                setPickError(null);
              }}
              style={[S.resetBtn, webPointer]}
              accessibilityRole="button"
              accessibilityLabel="בחר קובץ אחר"
            >
              <Text style={S.resetBtnText}>קובץ אחר</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={AS.sheetBtns}>
        <TouchableOpacity
          onPress={handleDismiss}
          style={[AS.cancelBtn, webPointer]}
          accessibilityRole="button"
          accessibilityLabel="ביטול"
        >
          <Text style={AS.cancelBtnText}>ביטול</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <AdminSheet visible={visible} onClose={handleDismiss} maxHeightFraction={0.92}>
      <Text style={AS.sheetTitle} accessibilityRole="header">
        {title}
      </Text>
      {isDesktop ? (
        body
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      )}
    </AdminSheet>
  );
}
