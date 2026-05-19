/** Hebrew label for a student count (0, 1, or plural). */
export function studentCountLabel(count: number): string {
  if (count === 0) return 'אין תלמידים';
  if (count === 1) return 'תלמיד אחד';
  return `${count} תלמידים`;
}
