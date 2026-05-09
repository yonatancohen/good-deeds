/**
 * Shared StyleSheet for all admin screens.
 * Bypasses NativeWind className to ensure reliable web rendering.
 */
import { StyleSheet, Platform } from 'react-native';
import { Colors } from '@/components/ui';
import { useBreakpoint } from '@/lib/responsive';

/**
 * Call at the top of any admin screen to get desktop-responsive layout helpers.
 *
 * Usage:
 *   const { isDesktop, listPad, pageContent } = useAdminLayout();
 *
 *   <ScrollView contentContainerStyle={listPad}>
 *     <View style={pageContent}>
 *       {rows}
 *     </View>
 *   </ScrollView>
 */
export function useAdminLayout() {
  const { isDesktop } = useBreakpoint();
  return {
    isDesktop,
    /** contentContainerStyle for the main ScrollView */
    listPad: isDesktop
      ? { padding: 24, paddingBottom: 40 }
      : { padding: 16 },
    /** wrap list rows in this to cap width + centre on desktop */
    pageContent: isDesktop
      ? { maxWidth: 960, alignSelf: 'center' as const, width: '100%' as const }
      : undefined,
  };
}

export const AS = StyleSheet.create({
  // ── Screen ──
  screen:   { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },

  // ── Header bar ──
  header: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row-reverse', alignItems: 'center' },
  backBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f1f5f9', marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.text,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,

  // ── Primary action button (in header) ──
  addBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, height: 44,
    paddingHorizontal: 16, flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 } as any,

  // ── List ──
  list: { flex: 1 },

  // ── List row card ──
  row: {
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 16,
    marginBottom: 12,
    shadowColor: '#64748b', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  rowLeft: { flex: 1, marginLeft: 12 },
  rowTitle: {
    fontSize: 15, fontWeight: '700', color: Colors.text,
    textAlign: 'right', fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  rowSub: {
    fontSize: 12, color: Colors.muted, textAlign: 'right', marginTop: 2, writingDirection: 'rtl',
  } as any,
  rowMeta: { flexDirection: 'row-reverse', gap: 8, marginTop: 2 },
  rowActions: { flexDirection: 'row-reverse', gap: 8 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  iconBtnDanger: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },

  // ── Empty state ──
  emptyWrap: { alignItems: 'center', paddingVertical: 64 },
  emptyIcon: {
    width: 64, height: 64, backgroundColor: Colors.primaryLight,
    borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: {
    color: Colors.muted, fontWeight: '700', fontSize: 16, textAlign: 'center',
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  emptyHint: {
    color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 4, writingDirection: 'rtl',
  } as any,

  // ── Modal / Bottom sheet ──
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kvoidEnd: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.text,
    textAlign: 'right', marginBottom: 20,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  fieldLabel: {
    fontSize: 14, fontWeight: '600', color: '#334155',
    textAlign: 'right', marginBottom: 4, writingDirection: 'rtl',
  } as any,
  fieldHint: {
    fontSize: 12, color: '#94a3b8',
    textAlign: 'right', marginBottom: 8, writingDirection: 'rtl',
  } as any,
  input: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: Colors.text, fontSize: 16, textAlign: 'right', marginBottom: 16,
    fontFamily: 'Nunito_400Regular', writingDirection: 'rtl',
  } as any,
  inputSmall: {
    backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: Colors.text, fontSize: 16, textAlign: 'right',
    fontFamily: 'Nunito_400Regular', writingDirection: 'rtl',
  } as any,

  // ── Sheet buttons ──
  sheetBtns: { flexDirection: 'row-reverse', gap: 12, marginTop: 4 },
  saveBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary,
  },
  saveBtnDisabled: {
    flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#a5b4fc',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, fontFamily: 'Baloo2_700Bold', textAlign: 'center' } as any,
  cancelBtn: {
    flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9',
  },
  cancelBtnText: { color: '#475569', fontWeight: '700', fontSize: 16, fontFamily: 'Baloo2_700Bold', textAlign: 'center' } as any,
});

/** Cursor pointer for web interactive elements */
export const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};
