/**
 * Shared StyleSheet for all admin screens — "Cheerful Encouragement" design system.
 * Bypasses NativeWind className to ensure reliable web rendering.
 */
import { StyleSheet, Platform } from 'react-native';
import { Colors } from '@/lib/colors';
import { shadow } from '@/lib/shadow';
import { useBreakpoint } from '@/lib/responsive';

export function useAdminLayout() {
  const { isDesktop } = useBreakpoint();
  return {
    isDesktop,
    listPad: isDesktop
      ? { padding: 24, paddingBottom: 40 }
      : { padding: 16 },
    pageContent: isDesktop
      ? { maxWidth: 960, alignSelf: 'center' as const, width: '100%' as const }
      : undefined,
  };
}

// 3D shadow for CTA buttons (web only)
const btn3dShadow = Platform.OS === 'web'
  ? ({ boxShadow: '0 5px 0 #5b4300' } as any)
  : {};

export const AS = StyleSheet.create({
  // ── Screen ───────────────────────────────────────────────────────────────
  screen:   { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },

  // ── Header bar ───────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row-reverse', alignItems: 'center' },
  backBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f5ede2', marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,

  // ── Primary action button (header "+") ───────────────────────────────────
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 999,                  // pill
    height: 44,
    paddingHorizontal: 18,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    ...btn3dShadow,
  },
  addBtnText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 14, fontFamily: 'Baloo2_700Bold' } as any,

  // ── List ──────────────────────────────────────────────────────────────────
  list: { flex: 1 },

  // ── List row card ─────────────────────────────────────────────────────────
  row: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 16,
    marginBottom: 12,
    ...shadow('#785900', 2, 10, 0.06, 3),
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
  },
  rowLeft:  { flex: 1, marginLeft: 12 },
  rowTitle: {
    fontSize: 15, fontWeight: '700', color: Colors.text,
    textAlign: 'right', fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  rowSub: {
    fontSize: 12, color: Colors.muted, textAlign: 'right', marginTop: 2, writingDirection: 'rtl',
  } as any,
  rowMeta:    { flexDirection: 'row-reverse', gap: 8, marginTop: 2 },
  rowActions: { flexDirection: 'row-reverse', gap: 8 },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f5ede2',
  },
  iconBtnDanger: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.dangerLight,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyWrap:  { alignItems: 'center', paddingVertical: 64 },
  emptyIcon: {
    width: 64, height: 64, backgroundColor: Colors.primaryLight,
    borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: {
    color: Colors.muted, fontWeight: '700', fontSize: 16, textAlign: 'center',
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  emptyHint: {
    color: Colors.outline, fontSize: 13, textAlign: 'center', marginTop: 4, writingDirection: 'rtl',
  } as any,

  // ── Modal / Bottom sheet ──────────────────────────────────────────────────
  overlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  kvoidEnd: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2,
    alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.primaryDark,
    textAlign: 'right', marginBottom: 20,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,

  // ── Form fields ───────────────────────────────────────────────────────────
  fieldLabel: {
    fontSize: 14, fontWeight: '600', color: Colors.primaryDark,
    textAlign: 'right', marginBottom: 4, writingDirection: 'rtl',
  } as any,
  fieldHint: {
    fontSize: 12, color: Colors.muted,
    textAlign: 'right', marginBottom: 8, writingDirection: 'rtl',
  } as any,

  // Pill-shaped inputs to match Stitch design
  input: {
    backgroundColor: '#f4ece7',         // surface-container warm
    borderWidth: 2,
    borderColor: '#e9e1db',             // surface-variant warm
    borderRadius: 999,                  // pill
    paddingHorizontal: 18, paddingVertical: 14,
    color: Colors.text, fontSize: 16, textAlign: 'right',
    marginBottom: 16, writingDirection: 'rtl',
  } as any,
  inputSmall: {
    backgroundColor: '#f4ece7',
    borderWidth: 2,
    borderColor: '#e9e1db',
    borderRadius: 999,
    paddingHorizontal: 18, paddingVertical: 14,
    color: Colors.text, fontSize: 16, textAlign: 'right',
    writingDirection: 'rtl',
  } as any,
  inputFocused: {
    borderColor: Colors.primary,
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 0 0 4px rgba(255,193,7,0.2)' } as any)
      : {}),
  },

  // ── Sheet buttons ─────────────────────────────────────────────────────────
  sheetBtns: { flexDirection: 'row-reverse', gap: 12, marginTop: 4 },
  saveBtn: {
    flex: 1, paddingVertical: 16,
    borderRadius: 999,              // pill
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary,
    ...btn3dShadow,
  },
  saveBtnDisabled: {
    flex: 1, paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffe082',
  },
  saveBtnText: {
    color: Colors.primaryDark, fontWeight: '700', fontSize: 16,
    fontFamily: 'Baloo2_700Bold', textAlign: 'center',
  } as any,
  cancelBtn: {
    flex: 1, paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f5ede2',
  },
  cancelBtnText: {
    color: Colors.muted, fontWeight: '700', fontSize: 16,
    fontFamily: 'Baloo2_700Bold', textAlign: 'center',
  } as any,
});

/** Cursor pointer for web interactive elements */
export const webPointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as any) : {};
