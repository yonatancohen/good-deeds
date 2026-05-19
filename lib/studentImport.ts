import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';

export interface ParsedStudentRow {
  first_name: string;
  last_name: string;
}

export interface PreviewStudent extends ParsedStudentRow {
  status: 'new' | 'skip';
}

export function normalizeCsvRows(rows: Record<string, string>[]): ParsedStudentRow[] {
  return rows
    .map((r) => ({
      first_name: (r.first_name ?? r['שם פרטי'] ?? '').trim(),
      last_name: (r.last_name ?? r['שם משפחה'] ?? '').trim(),
    }))
    .filter((r) => r.first_name && r.last_name);
}

export function parseCsvText(text: string): Promise<ParsedStudentRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(normalizeCsvRows(results.data)),
      error: (err: Error) => reject(err),
    });
  });
}

export async function getExistingStudentKeys(classId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('students')
    .select('first_name, last_name')
    .eq('class_id', classId);

  return new Set((data ?? []).map((s) => `${s.first_name.trim()}|${s.last_name.trim()}`));
}

export async function previewStudents(
  classId: string,
  rows: ParsedStudentRow[],
): Promise<PreviewStudent[]> {
  const existingSet = await getExistingStudentKeys(classId);
  return rows.map((r) => ({
    ...r,
    status: existingSet.has(`${r.first_name}|${r.last_name}`) ? 'skip' : 'new',
  }));
}

export async function insertStudents(
  classId: string,
  students: ParsedStudentRow[],
): Promise<{ count: number; error: string | null }> {
  const toInsert = students.map((r) => ({
    class_id: classId,
    first_name: r.first_name,
    last_name: r.last_name,
  }));

  if (toInsert.length === 0) return { count: 0, error: null };

  const { error } = await supabase.from('students').insert(toInsert);
  return { count: toInsert.length, error: error?.message ?? null };
}
