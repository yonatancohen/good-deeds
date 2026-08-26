import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { filterClassesByCurrentYear } from '@/lib/schoolYear';
import type { Tables } from '@/types/supabase';
import { useAuth } from './useAuth';

type ClassRow = Tables<'classes'>;

export interface TeacherClass {
  class: ClassRow;
  /** Number of students in this class */
  studentCount: number;
}

interface UseTeacherClasses {
  classes: TeacherClass[];
  loading: boolean;
  error: string | null;
}

/**
 * Returns current-year classes for teachers and admins (no user_class_access filter).
 * Matches admin lists: if settings.current_year is set, only that year is shown.
 */
export function useTeacherClasses(): UseTeacherClasses {
  const { user } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;

    try {
      const [settingsRes, classesRes, studentsRes] = await Promise.all([
        supabase.from('settings').select('current_year').limit(1).maybeSingle(),
        supabase.from('classes').select('*').is('deleted_at', null).order('name'),
        supabase.from('students').select('class_id'),
      ]);

      if (settingsRes.error) throw settingsRes.error;
      if (classesRes.error) throw classesRes.error;
      if (studentsRes.error) throw studentsRes.error;

      const counts: Record<string, number> = {};
      for (const s of studentsRes.data ?? []) {
        counts[s.class_id] = (counts[s.class_id] || 0) + 1;
      }

      const visibleClasses = filterClassesByCurrentYear(
        classesRes.data ?? [],
        settingsRes.data?.current_year,
      );

      const result: TeacherClass[] = visibleClasses.map((c) => ({
        class: c,
        studentCount: counts[c.id] ?? 0,
      }));

      result.sort((a, b) => a.class.name.localeCompare(b.class.name));

      setClasses(result);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת כיתות');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel(`teacher-classes-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { classes, loading, error };
}
