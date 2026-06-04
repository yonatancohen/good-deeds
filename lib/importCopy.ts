/** Shared Hebrew UI copy for CSV / Excel roster imports. */
export const IMPORT_FILE_TYPES = 'CSV או Excel (.xlsx)';

export const ROSTER_IMPORT_EMPTY_HINT =
  'הוסף תלמידים ידנית או ייבא מקובץ CSV או Excel (.xlsx).';

export function rosterImportA11y(suffix?: string): string {
  const base = `ייבוא ${IMPORT_FILE_TYPES}`;
  return suffix ? `${base} ${suffix}` : base;
}

export const TEACHERS_IMPORT_SHEET_TITLE = 'ייבוא מורים';
export const TEACHERS_IMPORT_BTN = 'ייבוא';
export const teachersImportA11y = `ייבוא מורים מקובץ ${IMPORT_FILE_TYPES}`;
