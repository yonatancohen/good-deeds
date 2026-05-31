import { Platform, ViewStyle } from 'react-native';

/**
 * Hebrew horizontal flex rows.
 *
 * - **HEADER_ROW** — top bars outside ScrollView (`forceRTL` + `#root` rtl mirror plain `row`).
 * - **RTL_CHILD_ROW** — rows inside a parent that already has RTL (CSS grid with `direction: rtl`).
 * - **HEBREW_ROW** — lists/cards in scroll without an RTL parent (`row` native, `row-reverse` web).
 */
export const HEADER_ROW = 'row' as ViewStyle['flexDirection'];

/** Parent already establishes RTL (e.g. CSS grid with `direction: rtl`, or native `forceRTL`). */
export const RTL_CHILD_ROW = 'row' as ViewStyle['flexDirection'];

export const HEBREW_ROW = (
  Platform.OS === 'web' ? 'row' : 'row'
) as ViewStyle['flexDirection'];

export function headerRow(extra?: ViewStyle): ViewStyle {
  return { flexDirection: HEADER_ROW, ...extra };
}

export function hebrewRow(extra?: ViewStyle): ViewStyle {
  return { flexDirection: HEBREW_ROW, ...extra };
}
