import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
 * Returns all classes for teachers and admins (no user_class_access filter).
 */
export function useTeacherClasses(): UseTeacherClasses {
  const { user } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;

    try {
      const [classesRes, studentsRes] = await Promise.all([
        supabase.from('classes').select('*').is('deleted_at', null).order('name'),
        supabase.from('students').select('class_id'),
      ]);

      if (classesRes.error) throw classesRes.error;
      if (studentsRes.error) throw studentsRes.error;

      const counts: Record<string, number> = {};
      for (const s of studentsRes.data ?? []) {
        counts[s.class_id] = (counts[s.class_id] || 0) + 1;
      }

      const result: TeacherClass[] = (classesRes.data ?? []).map((c) => ({
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { classes, loading, error };
}
