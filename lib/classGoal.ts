import type { Tables } from '@/types/supabase';

type ClassRow = Pick<Tables<'classes'>, 'points_goal'>;

export const FALLBACK_GLOBAL_GOAL = 100;

/** Effective points target for a class (per-class override or global default). */
export function resolveClassGoal(
  cls: ClassRow | null | undefined,
  globalGoal: number | null | undefined,
): number {
  const base = globalGoal ?? FALLBACK_GLOBAL_GOAL;
  const override = cls?.points_goal;
  if (override != null && override > 0) return override;
  return base;
}
