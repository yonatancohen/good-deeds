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
import { Badge, Colors } from '@/components/ui';
import { AS, webPointer } from '@/lib/adminStyles';
import { useBreakpoint } from '@/lib/responsive';
import { HEBREW_ROW } from '@/lib/rtlLayout';
import { IMPORT_FILE_TYPES } from '@/lib/importCopy';
import { IMPORT_DOCUMENT_TYPES } from '@/lib/spreadsheetImport';
import {
  parseImportFile,
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
  summaryBox: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryNew: {
    color: Colors.success,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Baloo2_700Bold',
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  summarySkip: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: '600',
    width: '100%',
    textAlign: 'right',
    marginTop: 4,
    writingDirection: 'rtl',
  } as any,
  otherFileLink: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  otherFileLinkText: {
    color: Colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'left',
    writingDirection: 'rtl',
  } as any,
  previewTable: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,197,171,0.4)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: HEBREW_ROW,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  tableHeaderStatus: {
    width: 72,
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  tableHeaderName: {
    flex: 1,
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  tableBody: { maxHeight: 280 },
  tableRow: {
    flexDirection: HEBREW_ROW,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
    gap: 12,
  },
  tableRowStatus: { width: 72, alignItems: 'flex-end' },
  tableRowName: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
  } as any,
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
      type: [...IMPORT_DOCUMENT_TYPES],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const file = result.assets[0];
    try {
      const normalized = await parseImportFile(file.uri, {
        name: file.name,
        mimeType: file.mimeType,
      });

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
          {`קובץ ${IMPORT_FILE_TYPES}`}{'\n'}
          תלמידים שכבר קיימים יישארו ללא שינוי
        </Text>
      </View>

      {!preview && (
        <TouchableOpacity
          onPress={handlePickFile}
          style={[S.pickBtn, webPointer]}
          accessibilityRole="button"
          accessibilityLabel={`בחר קובץ ${IMPORT_FILE_TYPES}`}
        >
          <View style={S.pickIconBox}>
            <FolderOpen size={28} color={Colors.primary} />
          </View>
          <Text style={S.pickTitle}>לחץ לבחירת קובץ</Text>
          <Text style={S.pickSub}>{`${IMPORT_FILE_TYPES} עם שמות התלמידים`}</Text>
        </TouchableOpacity>
      )}

      {pickError && (
        <View style={S.errorBanner}>
          <Text style={S.errorText}>{pickError}</Text>
        </View>
      )}

      {preview && (
        <>
          <TouchableOpacity
            onPress={() => {
              setPreview(null);
              setPickError(null);
            }}
            style={[S.otherFileLink, webPointer]}
            accessibilityRole="button"
            accessibilityLabel="בחר קובץ אחר"
          >
            <Text style={S.otherFileLinkText}>← קובץ אחר</Text>
          </TouchableOpacity>

          <View style={S.summaryBox}>
            <Text style={S.summaryNew}>
              ✓ {newCount} {t('csvNew')}
            </Text>
            {skipCount > 0 && (
              <Text style={S.summarySkip}>
                {skipCount} {t('csvSkipped')}
              </Text>
            )}
          </View>

          <View style={S.previewTable}>
            <View style={S.tableHeader}>
              <Text style={S.tableHeaderStatus}>סטטוס</Text>
              <Text style={S.tableHeaderName}>שם התלמיד</Text>
            </View>
            <ScrollView
              style={S.tableBody}
              nestedScrollEnabled
              showsVerticalScrollIndicator
            >
              {preview.map((row, i) => (
                <View
                  key={i}
                  style={[S.tableRow, row.status === 'skip' && { opacity: 0.5 }]}
                  accessibilityLabel={`${row.first_name} ${row.last_name} — ${row.status === 'new' ? 'תלמיד חדש' : 'כבר קיים'}`}
                >
                  <View style={S.tableRowStatus}>
                    <Badge
                      label={row.status === 'new' ? '✓ חדש' : 'קיים'}
                      variant={row.status === 'new' ? 'success' : 'muted'}
                    />
                  </View>
                  <Text style={S.tableRowName}>
                    {row.first_name} {row.last_name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          <View style={AS.sheetBtns}>
            <TouchableOpacity
              onPress={handleImport}
              disabled={importing || newCount === 0}
              style={[
                importing || newCount === 0 ? AS.saveBtnDisabled : AS.saveBtn,
                webPointer,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`ייבא ${newCount} תלמידים חדשים`}
              accessibilityState={{ disabled: importing || newCount === 0 }}
            >
              {importing ? (
                <ActivityIndicator color={Colors.primaryDark} />
              ) : (
                <Text style={AS.saveBtnText}>
                  {newCount > 0 ? `${t('csvImport')} (${newCount})` : t('csvImport')}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDismiss}
              style={[AS.cancelBtn, webPointer]}
              accessibilityRole="button"
              accessibilityLabel="ביטול"
            >
              <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {!preview && (
        <View style={AS.sheetBtns}>
          <TouchableOpacity
            onPress={handleDismiss}
            style={[AS.cancelBtn, webPointer]}
            accessibilityRole="button"
            accessibilityLabel="ביטול"
          >
            <Text style={AS.cancelBtnText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </View>
      )}
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
