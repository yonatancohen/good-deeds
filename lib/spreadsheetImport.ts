import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { decodeCsvBytes } from '@/lib/csvEncoding';

/** MIME types accepted by expo-document-picker for roster / teacher imports. */
export const IMPORT_DOCUMENT_TYPES = [
  'text/csv',
  'text/comma-separated-values',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  '*/*',
] as const;

export function isExcelFile(name: string, mimeType?: string | null): boolean {
  const lower = name.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return true;
  if (!mimeType) return false;
  return (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

export async function readFileBytesFromUri(uri: string): Promise<ArrayBuffer> {
  const res = await fetch(uri);
  return res.arrayBuffer();
}

function normalizeRowKeys(row: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const k = String(key).trim();
    if (!k || k.startsWith('__EMPTY')) continue;
    out[k] = value == null ? '' : String(value).trim();
  }
  return out;
}

function xlsxBytesToRows(bytes: ArrayBuffer): Record<string, string>[] {
  const wb = XLSX.read(new Uint8Array(bytes), { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];

  const sheet = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  return raw
    .map(normalizeRowKeys)
    .filter((row) => Object.values(row).some((v) => v.length > 0));
}

function csvBytesToRows(bytes: ArrayBuffer): Promise<Record<string, string>[]> {
  const text = decodeCsvBytes(bytes);
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err: Error) => reject(err),
    });
  });
}

export type ImportFileMeta = { name?: string; mimeType?: string | null };

/** Parse the first worksheet (Excel) or CSV bytes into header-keyed rows. */
export async function parseImportFileToRows(
  uri: string,
  meta?: ImportFileMeta,
): Promise<Record<string, string>[]> {
  const bytes = await readFileBytesFromUri(uri);
  if (isExcelFile(meta?.name ?? '', meta?.mimeType)) {
    return xlsxBytesToRows(bytes);
  }
  return csvBytesToRows(bytes);
}
