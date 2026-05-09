import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';
import { useAuth } from './useAuth';

type ClassRow = Tables<'classes'>;
type UserClassAccess = Tables<'user_class_access'>;

export interface TeacherClass {
  class: ClassRow;
  /** Is this class explicitly assigned to the teacher? */
  isAssigned: boolean;
  /** Number of students in this class */
  studentCount: number;
}

interface UseTeacherClasses {
  classes: TeacherClass[];
  loading: boolean;
  error: string | null;
}

/**
 * For admin: returns all classes (all marked assigned).
 * For teacher: returns all classes, with isAssigned=true for their own classes (pinned).
 */
export function useTeacherClasses(): UseTeacherClasses {
  const { user, isAdmin } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;

    try {
      const [classesRes, accessRes, studentsRes] = await Promise.all([
        supabase.from('classes').select('*').is('deleted_at', null).order('name'),
        isAdmin
          ? Promise.resolve({ data: null as UserClassAccess[] | null, error: null })
          : supabase
              .from('user_class_access')
              .select('class_id')
              .eq('user_id', user.id),
        supabase.from('students').select('class_id'),
      ]);

      if (classesRes.error) throw classesRes.error;
      if (accessRes.error) throw accessRes.error;

      const assignedIds = new Set(
        isAdmin
          ? (classesRes.data ?? []).map((c) => c.id)
          : (accessRes.data ?? []).map((a) => a.class_id),
      );

      const counts: Record<string, number> = {};
      for (const s of studentsRes.data ?? []) {
        counts[s.class_id] = (counts[s.class_id] || 0) + 1;
      }

      const allClasses = classesRes.data ?? [];

      // For teachers: only show assigned classes. For admin: show all.
      const visibleClasses = isAdmin
        ? allClasses
        : allClasses.filter((c) => assignedIds.has(c.id));

      const result: TeacherClass[] = visibleClasses.map((c) => ({
        class: c,
        isAssigned: true,
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
  }, [user, isAdmin]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel(`teacher-classes-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_class_access' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { classes, loading, error };
}
