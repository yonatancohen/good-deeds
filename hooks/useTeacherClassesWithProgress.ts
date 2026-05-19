/**
 * useTeacherClassesWithProgress
 *
 * Extends useTeacherClasses to add a per-class credit total
 * (sum of credit_events since last redemption_round).
 *
 * Because credit_events has no class_id column we:
 *   1. Fetch all students for the teacher's classes → Map<studentId, classId>
 *   2. Fetch last redemption_round per class
 *   3. Fetch all credit_events for those student IDs
 *   4. Filter / sum in JS using the per-class cutoff date
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';

type ClassRow = Tables<'classes'>;

export interface TeacherClassWithProgress {
  class: ClassRow;
  studentCount: number;
  totalCredits: number;   // credits accumulated since last redemption round
  colorIndex: number;     // stable index into CLASS_COLORS palette
}

interface UseTeacherClassesWithProgress {
  classes: TeacherClassWithProgress[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTeacherClassesWithProgress(): UseTeacherClassesWithProgress {
  const { user } = useAuth();
  const [classes, setClasses] = useState<TeacherClassWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;

    try {
      // ── Step 1: all teachers see all classes (no per-teacher access filter) ──
      const classesRes = await supabase
        .from('classes')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (classesRes.error) throw classesRes.error;

      const visibleClasses = classesRes.data ?? [];

      if (visibleClasses.length === 0) {
        setClasses([]);
        setError(null);
        setLoading(false);
        return;
      }

      const classIds = visibleClasses.map((c) => c.id);

      // ── Step 2: get students + redemptions in parallel ───────────────────────
      const [studentsRes, redemptionsRes, classCreditsRes] = await Promise.all([
        supabase.from('students').select('id, class_id').in('class_id', classIds),
        supabase
          .from('redemption_rounds')
          .select('class_id, redeemed_at')
          .in('class_id', classIds)
          .order('redeemed_at', { ascending: false }),
        supabase
          .from('class_credit_events')
          .select('class_id, amount, created_at')
          .in('class_id', classIds),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (redemptionsRes.error) throw redemptionsRes.error;
      if (classCreditsRes.error) throw classCreditsRes.error;

      // student → class lookup
      const studentToClass = new Map<string, string>();
      const countByClass = new Map<string, number>();
      for (const s of studentsRes.data ?? []) {
        studentToClass.set(s.id, s.class_id);
        countByClass.set(s.class_id, (countByClass.get(s.class_id) ?? 0) + 1);
      }

      // last redemption per class (already ordered desc — first occurrence wins)
      const lastRedemption = new Map<string, string>();
      for (const r of redemptionsRes.data ?? []) {
        if (!lastRedemption.has(r.class_id)) {
          lastRedemption.set(r.class_id, r.redeemed_at);
        }
      }

      const allStudentIds = (studentsRes.data ?? []).map((s) => s.id);

      // ── Step 3: get credit events (only if there are students) ───────────────
      const creditsByClass = new Map<string, number>();
      if (allStudentIds.length > 0) {
        const { data: events, error: evErr } = await supabase
          .from('credit_events')
          .select('student_id, amount, created_at')
          .in('student_id', allStudentIds);

        if (evErr) throw evErr;

        for (const ev of events ?? []) {
          const classId = studentToClass.get(ev.student_id);
          if (!classId) continue;
          const cutoff = lastRedemption.get(classId);
          if (cutoff && ev.created_at <= cutoff) continue;
          creditsByClass.set(classId, (creditsByClass.get(classId) ?? 0) + ev.amount);
        }
      }

      for (const cc of classCreditsRes.data ?? []) {
        const cutoff = lastRedemption.get(cc.class_id);
        if (cutoff && cc.created_at <= cutoff) continue;
        creditsByClass.set(
          cc.class_id,
          (creditsByClass.get(cc.class_id) ?? 0) + cc.amount,
        );
      }

      // ── Step 4: assemble result ──────────────────────────────────────────────
      const result: TeacherClassWithProgress[] = visibleClasses.map((c, i) => ({
        class: c,
        studentCount: countByClass.get(c.id) ?? 0,
        totalCredits: creditsByClass.get(c.id) ?? 0,
        colorIndex: i,
      }));

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
      .channel(`teacher-classes-progress-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_events' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_credit_events' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemption_rounds' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { classes, loading, error, refetch: load };
}
