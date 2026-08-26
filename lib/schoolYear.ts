/**
 * Restrict class lists to the active academic year.
 * If no current year is configured, keep every class (same as admin lists).
 */
export function filterClassesByCurrentYear<T extends { year: string | null }>(
  classes: T[],
  currentYear: string | null | undefined,
): T[] {
  if (!currentYear) return classes;
  return classes.filter((c) => c.year === currentYear);
}
