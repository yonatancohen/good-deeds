import type { Tables } from '@/types/supabase';

/** Primary school grades (matches admin class creation). */
export const CLASS_GRADES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'] as const;

type ClassRow = Pick<Tables<'classes'>, 'grade' | 'name'>;

export function resolveClassGrade(cls: ClassRow): string {
  const fromDb = cls.grade?.trim();
  if (fromDb) return fromDb;
  const fromName = cls.name.match(/^([א-ת])['׳]/);
  if (fromName) return fromName[1];
  return cls.name.charAt(0) || '—';
}

export function compareClassGrades(a: string, b: string): number {
  const ia = CLASS_GRADES.indexOf(a as (typeof CLASS_GRADES)[number]);
  const ib = CLASS_GRADES.indexOf(b as (typeof CLASS_GRADES)[number]);
  if (ia >= 0 && ib >= 0) return ia - ib;
  if (ia >= 0) return -1;
  if (ib >= 0) return 1;
  return a.localeCompare(b, 'he');
}

export function groupClassesByGrade<T extends { class: ClassRow }>(
  items: T[],
): { grade: string; items: T[] }[] {
  const byGrade = new Map<string, T[]>();
  for (const item of items) {
    const key = resolveClassGrade(item.class);
    const list = byGrade.get(key) ?? [];
    list.push(item);
    byGrade.set(key, list);
  }
  for (const list of byGrade.values()) {
    list.sort((x, y) => x.class.name.localeCompare(y.class.name, 'he'));
  }
  return [...byGrade.keys()]
    .sort(compareClassGrades)
    .map((grade) => ({ grade, items: byGrade.get(grade)! }));
}
