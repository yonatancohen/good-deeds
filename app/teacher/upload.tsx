import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  
  ScrollView,
  Alert,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';
import { safeBack } from '@/lib/navigation';
import { FolderOpen, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/components/ui';
import { AS, webPointer } from '@/lib/adminStyles';

interface ParsedStudent {
  first_name: string;
  last_name: string;
  status: 'new' | 'skip';
}

const S = StyleSheet.create({
  // ── Done screen ──
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, paddingHorizontal: 24 },
  doneIconBox: {
    width: 80, height: 80, backgroundColor: '#D1FAE5',
    borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  doneTitle: {
    fontSize: 20, fontWeight: '700', color: Colors.text, textAlign: 'center', marginBottom: 8,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  doneSub: {
    color: Colors.muted, fontSize: 15, textAlign: 'center', marginBottom: 32,
    fontFamily: 'Nunito_400Regular', writingDirection: 'rtl',
  } as any,
  backBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 32, paddingVertical: 14,
  },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 } as any,

  // ── Header ──
  header: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
    flexDirection: 'row-reverse', alignItems: 'center',
  },
  headerTitle: {
    flex: 1, fontSize: 17, fontWeight: '700', color: Colors.text,
    textAlign: 'right', fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,

  // ── Info banner ──
  infoBanner: {
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
  },
  infoBannerTitle: {
    color: '#1e40af', fontWeight: '600', fontSize: 14,
    textAlign: 'right', marginBottom: 4, writingDirection: 'rtl',
  } as any,
  infoBannerText: { color: '#3b82f6', fontSize: 12, textAlign: 'right', writingDirection: 'rtl' } as any,

  // ── Pick file button ──
  pickBtn: {
    backgroundColor: '#fff', borderWidth: 2, borderStyle: 'dashed', borderColor: '#cbd5e1',
    borderRadius: 20, paddingVertical: 48, alignItems: 'center', marginBottom: 16,
  },
  pickIconBox: {
    width: 64, height: 64, backgroundColor: Colors.primaryLight,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  pickTitle: {
    color: '#334155', fontWeight: '600', fontSize: 16, writingDirection: 'rtl',
  } as any,
  pickSub: { color: '#94a3b8', fontSize: 13, marginTop: 4, writingDirection: 'rtl' } as any,

  // ── Error ──
  errorBanner: {
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
  },
  errorText: { color: '#dc2626', fontSize: 13, textAlign: 'right', writingDirection: 'rtl' } as any,

  // ── Preview summary ──
  summaryRow: { flexDirection: 'row-reverse', gap: 12, marginBottom: 16 },
  summaryCard: {
    flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center',
  },
  summaryCardNew:  { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' },
  summaryCardSkip: { backgroundColor: '#F8FAFC', borderColor: Colors.border },
  summaryNum: { fontSize: 28, fontWeight: '700', marginBottom: 4 } as any,
  summaryNumNew:  { color: '#065f46' },
  summaryNumSkip: { color: '#64748b' },
  summaryLabel: { fontSize: 12, fontWeight: '600', writingDirection: 'rtl' } as any,
  summaryLabelNew:  { color: '#10B981' },
  summaryLabelSkip: { color: '#94a3b8' },

  // ── Preview table ──
  previewTable: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9',
    overflow: 'hidden', marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row-reverse', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f8fafc',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  tableHeaderText: { color: Colors.muted, fontSize: 12, fontWeight: '700', writingDirection: 'rtl' } as any,
  tableRow: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  tableRowText: { color: '#334155', fontSize: 14, writingDirection: 'rtl' } as any,
  statusBadgeNew:  { backgroundColor: '#D1FAE5', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  statusBadgeSkip: { backgroundColor: '#f1f5f9', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  statusTextNew:  { color: '#065f46', fontSize: 12, fontWeight: '600' } as any,
  statusTextSkip: { color: '#94a3b8', fontSize: 12, fontWeight: '600' } as any,

  // ── Action buttons ──
  actionRow: { flexDirection: 'row-reverse', gap: 12 },
  importBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  importBtnActive:   { backgroundColor: Colors.primary },
  importBtnDisabled: { backgroundColor: '#a5b4fc' },
  importBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 } as any,
  resetBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9' },
  resetBtnText: { color: '#475569', fontWeight: '700', fontSize: 16 } as any,
});

export default function UploadScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();

  const [preview, setPreview]         = useState<ParsedStudent[] | null>(null);
  const [importing, setImporting]     = useState(false);
  const [done, setDone]               = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [pickError, setPickError]     = useState<string | null>(null);

  async function handlePickFile() {
    setPickError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const file = result.assets[0];
    const text = await fetch(file.uri).then((r) => r.text());

    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;

        if (!rows[0]?.first_name && !rows[0]?.['שם פרטי']) {
          setPickError('הקובץ חייב לכלול עמודות first_name ו-last_name (או שם פרטי ושם משפחה)');
          return;
        }

        const normalized = rows.map((r) => ({
          first_name: (r.first_name ?? r['שם פרטי'] ?? '').trim(),
          last_name:  (r.last_name  ?? r['שם משפחה'] ?? '').trim(),
        })).filter((r) => r.first_name && r.last_name);

        if (normalized.length === 0) { setPickError('לא נמצאו שורות תקינות בקובץ'); return; }

        const { data: existing } = await supabase.from('students')
          .select('first_name, last_name').eq('class_id', classId);

        const existingSet = new Set((existing ?? []).map((s) => `${s.first_name.trim()}|${s.last_name.trim()}`));

        const parsed: ParsedStudent[] = normalized.map((r) => ({
          first_name: r.first_name,
          last_name:  r.last_name,
          status: existingSet.has(`${r.first_name}|${r.last_name}`) ? 'skip' : 'new',
        }));

        setPreview(parsed);
      },
      error: (err: Error) => { setPickError(`שגיאה בפענוח הקובץ: ${err.message}`); },
    });
  }

  async function handleImport() {
    if (!preview || !classId) return;

    const toInsert = preview
      .filter((r) => r.status === 'new')
      .map((r) => ({ class_id: classId, first_name: r.first_name, last_name: r.last_name }));

    if (toInsert.length === 0) {
      Alert.alert('אין תלמידים חדשים', 'כל התלמידים בקובץ כבר קיימים בכיתה');
      return;
    }

    setImporting(true);
    const { error } = await supabase.from('students').insert(toInsert);
    setImporting(false);

    if (error) {
      Alert.alert('שגיאת ייבוא', error.message);
    } else {
      setImportedCount(toInsert.length);
      setDone(true);
    }
  }

  const newCount  = preview?.filter((r) => r.status === 'new').length  ?? 0;
  const skipCount = preview?.filter((r) => r.status === 'skip').length ?? 0;

  if (done) {
    return (
      <SafeAreaView style={S.doneWrap}>
        <View style={S.doneIconBox}>
          <CheckCircle2 size={40} color={Colors.success} />
        </View>
        <Text style={S.doneTitle}>{t('imported')}</Text>
        <Text style={S.doneSub}>{importedCount} תלמידים יובאו לכיתה</Text>
        <TouchableOpacity onPress={() => safeBack(router, '/teacher')} style={[S.backBtn, webPointer]} accessibilityRole="button" accessibilityLabel="חזרה לכיתה">
          <Text style={S.backBtnText}>{t('back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={AS.screen}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => safeBack(router, '/teacher')} style={[AS.backBtn, webPointer]} accessibilityRole="button" accessibilityLabel="חזרה">
          <ChevronRight size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={S.headerTitle} accessibilityRole="header">{t('uploadCsv')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Instructions */}
        <View style={S.infoBanner}>
          <Text style={S.infoBannerTitle}>{t('uploadCsvHint')}</Text>
          <Text style={S.infoBannerText}>
            עמודות נדרשות: שם פרטי, שם משפחה{'\n'}
            תלמידים שכבר קיימים יישארו ללא שינוי
          </Text>
        </View>

        {/* Pick file */}
        {!preview && (
          <TouchableOpacity
            onPress={handlePickFile}
            style={[S.pickBtn, webPointer]}
            accessibilityRole="button"
            accessibilityLabel="בחר קובץ CSV"
            accessibilityHint="פתח את בחירת הקבצים"
          >
            <View style={S.pickIconBox}>
              <FolderOpen size={28} color={Colors.primary} />
            </View>
            <Text style={S.pickTitle}>לחץ לבחירת קובץ CSV</Text>
            <Text style={S.pickSub}>קובץ .csv עם שמות התלמידים</Text>
          </TouchableOpacity>
        )}

        {/* Error */}
        {pickError && (
          <View style={S.errorBanner}>
            <Text style={S.errorText}>{pickError}</Text>
          </View>
        )}

        {/* Preview */}
        {preview && (
          <>
            {/* Summary */}
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

            {/* Table */}
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
                  <Text style={S.tableRowText}>{row.first_name} {row.last_name}</Text>
                  <View style={row.status === 'new' ? S.statusBadgeNew : S.statusBadgeSkip}>
                    <Text style={row.status === 'new' ? S.statusTextNew : S.statusTextSkip}>
                      {row.status === 'new' ? '✓ חדש' : 'קיים'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Action buttons */}
            <View style={S.actionRow}>
              <TouchableOpacity
                onPress={handleImport}
                disabled={importing || newCount === 0}
                style={[
                  S.importBtn,
                  (importing || newCount === 0) ? S.importBtnDisabled : S.importBtnActive,
                  webPointer,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`ייבא ${newCount} תלמידים חדשים`}
                accessibilityState={{ disabled: importing || newCount === 0 }}
              >
                {importing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={S.importBtnText}>{t('csvImport')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setPreview(null); setPickError(null); }}
                style={[S.resetBtn, webPointer]}
                accessibilityRole="button"
                accessibilityLabel="בחר קובץ אחר"
              >
                <Text style={S.resetBtnText}>קובץ אחר</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
