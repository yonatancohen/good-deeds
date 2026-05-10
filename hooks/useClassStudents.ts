import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type StudentRow = Tables<'students'>;
type CreditEvent = Tables<'credit_events'>;
type RedemptionRound = Tables<'redemption_rounds'>;
type Deed = Tables<'deeds'>;
type UserRow = Tables<'users'>;

export interface CreditEventWithDetails {
  id: string;
  student_id: string;
  deed_id: string;
  amount: number;
  note: string | null;
  given_by: string;
  created_at: string;
  deed: Deed | null;
  given_by_user: Pick<UserRow, 'id' | 'display_name'> | null;
}

export interface StudentWithCredits {
  student: StudentRow;
  credits: number;
}

interface UseClassStudents {
  students: StudentWithCredits[];
  creditEvents: CreditEventWithDetails[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Returns all students in a class with their current credit total (since last redemption),
 * plus all credit events with deed + giver details.
 */
export function useClassStudents(classId: string | null): UseClassStudents {
  const [students, setStudents] = useState<StudentWithCredits[]>([]);
  const [creditEvents, setCreditEvents] = useState<CreditEventWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only show the loading spinner on the very first fetch for a given classId.
  // Background refetches (realtime, onSuccess) update data silently.
  const hasData = useRef(false);

  const load = useCallback(async () => {
    if (!classId) {
      setStudents([]);
      setCreditEvents([]);
      hasData.current = false;
      return;
    }

    if (!hasData.current) setLoading(true);
    try {
      const [studentsRes, redemptionsRes] = await Promise.all([
        supabase.from('students').select('*').eq('class_id', classId).order('last_name'),
        supabase
          .from('redemption_rounds')
          .select('redeemed_at')
          .eq('class_id', classId)
          .order('redeemed_at', { ascending: false })
          .limit(1),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (redemptionsRes.error) throw redemptionsRes.error;

      const classStudents: StudentRow[] = studentsRes.data ?? [];
      const lastRedemptionAt: string | null =
        redemptionsRes.data?.[0]?.redeemed_at ?? null;

      if (classStudents.length === 0) {
        setStudents([]);
        setCreditEvents([]);
        setLoading(false);
        return;
      }

      const studentIds = classStudents.map((s) => s.id);

      // Fetch credit events for these students (since last redemption)
      let creditsQuery = supabase
        .from('credit_events')
        .select(`
          id,
          student_id,
          deed_id,
          amount,
          note,
          given_by,
          created_at,
          deeds ( id, name, amount, is_active, created_at ),
          users!credit_events_given_by_fkey ( id, display_name )
        `)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      if (lastRedemptionAt) {
        creditsQuery = creditsQuery.gt('created_at', lastRedemptionAt);
      }

      const creditsRes = await creditsQuery;
      if (creditsRes.error) throw creditsRes.error;

      type CreditRow = {
        id: string;
        student_id: string;
        deed_id: string;
        amount: number;
        note: string | null;
        given_by: string;
        created_at: string;
        deeds: Deed | null;
        users: Pick<UserRow, 'id' | 'display_name'> | null;
      };

      const rawCredits = (creditsRes.data ?? []) as unknown as CreditRow[];

      // Map to our typed events
      const events: CreditEventWithDetails[] = rawCredits.map((c) => ({
        id: c.id,
        student_id: c.student_id,
        deed_id: c.deed_id,
        amount: c.amount,
        note: c.note,
        given_by: c.given_by,
        created_at: c.created_at,
        deed: c.deeds ?? null,
        given_by_user: c.users ?? null,
      }));

      // Compute per-student credit totals
      const creditsByStudent = new Map<string, number>();
      for (const e of events) {
        creditsByStudent.set(
          e.student_id,
          (creditsByStudent.get(e.student_id) ?? 0) + e.amount,
        );
      }

      const studentsWithCredits: StudentWithCredits[] = classStudents.map((s) => ({
        student: s,
        credits: creditsByStudent.get(s.id) ?? 0,
      }));

      // Sort by credits desc
      studentsWithCredits.sort((a, b) => b.credits - a.credits);

      setStudents(studentsWithCredits);
      setCreditEvents(events);
      hasData.current = true;
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת תלמידים');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    hasData.current = false; // reset for new class → show spinner on first load
    load();

    if (!classId) return;

    const channel = supabase
      .channel(`class-students-${classId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_events' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemption_rounds' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, classId]);

  return { students, creditEvents, loading, error, refetch: load };
}
