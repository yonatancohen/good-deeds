/**
 * Shared StyleSheet for all admin screens — "Cheerful Encouragement" design system.
 * Bypasses NativeWind className to ensure reliable web rendering.
 */
import { StyleSheet, Platform } from 'react-native';
import { Colors } from '@/lib/colors';
import { shadow } from '@/lib/shadow';
import {
  useBreakpoint,
  desktopPageContent,
  getContentMaxWidth,
  getPagePadX,
} from '@/lib/responsive';
import { HEBREW_ROW, HEADER_ROW } from '@/lib/rtlLayout';

/** Shared page column layout — use on admin, teacher, and public screens. */
export function useAdminLayout() {
  const { isDesktop, isLarge } = useBreakpoint();
  return {
    isDesktop,
    isLarge,
    /** Content column max width (for grids / tile math). */
    contentMaxW: getContentMaxWidth(isLarge),
    /** Vertical only — horizontal inset comes from `pageContent`. */
    listPad: isDesktop
      ? { paddingTop: 24, paddingBottom: 40 }
      : { paddingTop: 16, paddingBottom: 16 },
    /** Centered column + horizontal padding (16 mobile / 24 desktop). */
    pageContent: desktopPageContent(isDesktop, isLarge),
    pagePadX: getPagePadX(isDesktop),
  };
}

/** @alias useAdminLayout */
export const useAppLayout = useAdminLayout;

/** Header row height — matches back/add/logout controls (44px). */
export const HEADER_CONTROL_SIZE = 44;
export const HEADER_INNER_PAD_TOP = 16;
export const HEADER_INNER_PAD_BOTTOM = 14;
export const HEADER_INNER_MIN_HEIGHT =
  HEADER_INNER_PAD_TOP + HEADER_CONTROL_SIZE + HEADER_INNER_PAD_BOTTOM;

export const AS = StyleSheet.create({
  // ── Screen ───────────────────────────────────────────────────────────────
  screen:   { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },

  // ── Header bar ───────────────────────────────────────────────────────────
  // Usage: <View style={AS.header}><View style={[AS.headerInner, pageContent]}>…</View></View>
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerShadow: {
    ...shadow('#000', 1, 4, 0.06, 2),
  },
  headerDesktop: {
    alignItems: 'center',
  },
  headerInner: {
    paddingTop: HEADER_INNER_PAD_TOP,
    paddingBottom: HEADER_INNER_PAD_BOTTOM,
    minHeight: HEADER_INNER_MIN_HEIGHT,
    flexDirection: HEADER_ROW,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerLeft: { flexDirection: HEADER_ROW, alignItems: 'center', gap: 12, flexShrink: 1 },
  backBtn: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  headerTitle: {
    fontSize: 17, fontWeight: '700', color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,

  // ── Primary action button (header "+") ───────────────────────────────────
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    height: 44,
    paddingHorizontal: 18,
    flexDirection: HEADER_ROW, alignItems: 'center', gap: 6,
  },
  /** Square header CTA on narrow screens — icon only, no label. */
  addBtnIconOnly: {
    width: 44,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  addBtnText: { color: Colors.primaryDark, fontWeight: '700', fontSize: 14, fontFamily: 'Baloo2_700Bold' } as any,

  // ── List ──────────────────────────────────────────────────────────────────
  list: { flex: 1 },

  // ── List row card ─────────────────────────────────────────────────────────
  row: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,197,171,0.4)',    // very subtle warm border
    paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 8,
    ...shadow('#785900', 0, 8, 0.05, 12),   // soft warm shadow
    flexDirection: HEBREW_ROW, alignItems: 'center', justifyContent: 'space-between',
  },
  rowLeft:  { flex: 1, marginLeft: 12 },
  rowTitle: {
    fontSize: 15, fontWeight: '700', color: Colors.text,
    textAlign: 'right', fontFamily: 'Baloo2_700Bold', writingDirection: 'rtl',
  } as any,
  rowSub: {
    fontSize: 12, color: Colors.muted, textAlign: 'right', marginTop: 2, writingDirection: 'rtl',
  } as any,
  rowMeta:    { flexDirection: HEBREW_ROW, gap: 8, marginTop: 2 },
  rowActions: { flexDirection: HEBREW_ROW, gap: 6 },

  // ── Row leading avatar circle (Stitch style) ──────────────────────────────
  rowAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    marginLeft: 12,
  },
  rowAvatarSecondary: {
    backgroundColor: Colors.secondarySurface,
  },
  rowAvatarSuccess: {
    backgroundColor: Colors.successSurface,
  },
  rowAvatarDanger: {
    backgroundColor: Colors.dangerLight,
  },
  rowAvatarText: {
    fontSize: 17, fontWeight: '700', color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold', textAlign: 'center',
  } as any,

  // ── Tactile icon buttons ─────────────────────────────────────────────────
  // Use with <TactileIconBtn style={AS.iconBtn}> for the 3D press effect
  iconBtn: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f5ede2',
  },
  iconBtnSecondary: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.secondarySurface,
  },
  /** Amber — primary actions (e.g. give credit) */
  iconBtnPrimary: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  /** Green — positive add / import */
  iconBtnSuccess: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.successSurface,
  },
  iconBtnDanger: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
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
  sheetBtns: { flexDirection: HEBREW_ROW, gap: 12, marginTop: 4 },
  saveBtn: {
    flex: 1, paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  saveBtnDisabled: {
    flex: 1, paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#ffe082',
  },
  saveBtnText: {
    color: Colors.primaryDark, fontWeight: '700', fontSize: 16,
    fontFamily: 'Baloo2_700Bold', textAlign: 'center',
  } as any,
  cancelBtn: {
    flex: 1, paddingVertical: 16,
    borderRadius: 16,
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
