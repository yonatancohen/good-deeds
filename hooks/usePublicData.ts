import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/supabase';

type ClassRow = Tables<'classes'>;
type StudentRow = Tables<'students'>;
type CreditEvent = Tables<'credit_events'>;
type RedemptionRound = Tables<'redemption_rounds'>;
type Settings = Tables<'settings'>;

export interface StudentWithCredits {
  id: string;
  first_name: string;
  last_name: string;
  credits: number;
}

export interface ClassWithProgress {
  class: ClassRow;
  students: StudentWithCredits[];
  /** Sum of all student credits since last redemption */
  total: number;
  /** Goal from global settings */
  goal: number;
  /** Whether class has met (or exceeded) the goal */
  goalReached: boolean;
  /** Timestamp of the last redemption for this class, if any */
  lastRedemption: string | null;
  /** Total redemption rounds recorded for this class (prizes won) */
  prizesWonCount: number;
}

interface UsePublicData {
  data: ClassWithProgress[];
  settings: Settings | null;
  loading: boolean;
  error: string | null;
}

export function usePublicData(): UsePublicData {
  const [data, setData] = useState<ClassWithProgress[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      // Fetch all in parallel
      const [
        settingsRes,
        classesRes,
        studentsRes,
        creditsRes,
        classCreditsRes,
        redemptionsRes,
      ] = await Promise.all([
        supabase.from('settings').select('*').limit(1).maybeSingle(),
        supabase.from('classes').select('*').is('deleted_at', null).order('name'),
        supabase.from('students').select('*'),
        supabase.from('credit_events').select('student_id, amount, created_at'),
        supabase.from('class_credit_events').select('class_id, amount, created_at'),
        supabase.from('redemption_rounds').select('class_id, redeemed_at').order('redeemed_at', { ascending: false }),
      ]);

      if (settingsRes.error) throw settingsRes.error;
      if (classesRes.error) throw classesRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (creditsRes.error) throw creditsRes.error;
      if (classCreditsRes.error) throw classCreditsRes.error;
      if (redemptionsRes.error) throw redemptionsRes.error;

      const fetchedSettings = settingsRes.data;
      const classes: ClassRow[] = classesRes.data ?? [];
      const students: StudentRow[] = studentsRes.data ?? [];
      const credits: Pick<CreditEvent, 'student_id' | 'amount' | 'created_at'>[] = creditsRes.data ?? [];
      const classCredits: { class_id: string; amount: number; created_at: string }[] =
        classCreditsRes.data ?? [];
      const redemptions: Pick<RedemptionRound, 'class_id' | 'redeemed_at'>[] = redemptionsRes.data ?? [];

      const goal = fetchedSettings?.global_goal ?? 100;

      const prizesWonByClass = new Map<string, number>();
      for (const r of redemptions) {
        prizesWonByClass.set(
          r.class_id,
          (prizesWonByClass.get(r.class_id) ?? 0) + 1,
        );
      }

      // Build a map: class_id → last redemption timestamp (or null)
      const lastRedemptionByClass = new Map<string, string>();
      for (const r of redemptions) {
        if (!lastRedemptionByClass.has(r.class_id)) {
          // Already ordered desc, so first seen = latest
          lastRedemptionByClass.set(r.class_id, r.redeemed_at);
        }
      }

      // Build a map: student_id → class_id
      const studentClassMap = new Map<string, string>();
      for (const s of students) {
        studentClassMap.set(s.id, s.class_id);
      }

      // Build per-student credit totals (only credits after last redemption of their class)
      const studentCredits = new Map<string, number>();
      for (const c of credits) {
        const classId = studentClassMap.get(c.student_id);
        if (!classId) continue;
        const lastRedemption = lastRedemptionByClass.get(classId) ?? null;
        if (lastRedemption && c.created_at <= lastRedemption) continue; // Before or at last reset
        studentCredits.set(
          c.student_id,
          (studentCredits.get(c.student_id) ?? 0) + c.amount,
        );
      }

      // Class-level credits since last redemption
      const classLevelCredits = new Map<string, number>();
      for (const cc of classCredits) {
        const lastRedemption = lastRedemptionByClass.get(cc.class_id) ?? null;
        if (lastRedemption && cc.created_at <= lastRedemption) continue;
        classLevelCredits.set(
          cc.class_id,
          (classLevelCredits.get(cc.class_id) ?? 0) + cc.amount,
        );
      }

      // Build students grouped by class
      const studentsByClass = new Map<string, StudentWithCredits[]>();
      for (const s of students) {
        const swc: StudentWithCredits = {
          id: s.id,
          first_name: s.first_name,
          last_name: s.last_name,
          credits: studentCredits.get(s.id) ?? 0,
        };
        if (!studentsByClass.has(s.class_id)) {
          studentsByClass.set(s.class_id, []);
        }
        studentsByClass.get(s.class_id)!.push(swc);
      }

      // Sort students within each class by credits desc
      for (const [, arr] of studentsByClass) {
        arr.sort((a, b) => b.credits - a.credits);
      }

      // Assemble final data
      const result: ClassWithProgress[] = classes.map((cls) => {
        const classStudents = studentsByClass.get(cls.id) ?? [];
        const studentTotal = classStudents.reduce((sum, s) => sum + s.credits, 0);
        const classExtra = classLevelCredits.get(cls.id) ?? 0;
        const total = studentTotal + classExtra;
        const cappedTotal = Math.min(total, goal);
        const lastRedemption = lastRedemptionByClass.get(cls.id) ?? null;

        return {
          class: cls,
          students: classStudents,
          total: cappedTotal,
          goal,
          goalReached: total >= goal,
          lastRedemption,
          prizesWonCount: prizesWonByClass.get(cls.id) ?? 0,
        };
      });

      setSettings(fetchedSettings);
      setData(result);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // Subscribe to all relevant tables for realtime updates
    const channel = supabase
      .channel(`public-page-realtime-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_events' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_credit_events' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'redemption_rounds' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, load)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return { data, settings, loading, error };
}
