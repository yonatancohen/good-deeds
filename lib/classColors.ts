/**
 * Per-grade class colours — shared by teacher class cards and admin class list.
 * Keyed by the first Hebrew letter in the class name / grade.
 */
import { Colors } from '@/lib/colors';

export const CLASS_COLORS = [
  { bg: Colors.accent,     text: '#ffffff',          sub: 'rgba(255,255,255,0.72)', track: 'rgba(255,255,255,0.28)', fill: 'rgba(255,255,255,0.88)' }, // א
  { bg: Colors.secondary,  text: '#ffffff',          sub: 'rgba(255,255,255,0.72)', track: 'rgba(255,255,255,0.28)', fill: 'rgba(255,255,255,0.88)' }, // ב
  { bg: Colors.success,    text: '#ffffff',          sub: 'rgba(255,255,255,0.72)', track: 'rgba(255,255,255,0.28)', fill: 'rgba(255,255,255,0.88)' }, // ג
  { bg: Colors.primary,    text: Colors.primaryDark, sub: 'rgba(120,89,0,0.65)',    track: 'rgba(120,89,0,0.20)',    fill: 'rgba(120,89,0,0.70)'     }, // ד
  { bg: Colors.salmon,     text: Colors.primaryDark, sub: 'rgba(120,89,0,0.65)',    track: 'rgba(120,89,0,0.20)',    fill: 'rgba(120,89,0,0.70)'     }, // ה
  { bg: Colors.peach,      text: Colors.primaryDark, sub: 'rgba(120,89,0,0.65)',    track: 'rgba(120,89,0,0.20)',    fill: 'rgba(120,89,0,0.70)'     }, // ו
] as const;

export type ClassColorScheme = (typeof CLASS_COLORS)[number];

const HEB_ALPHA = 'אבגדהוזחטיכלמנסעפצקרשת';

/** First Hebrew letter found → stable index into CLASS_COLORS */
export function hebrewColorIndex(name: string): number {
  for (const ch of name) {
    const i = HEB_ALPHA.indexOf(ch);
    if (i >= 0) return i % CLASS_COLORS.length;
  }
  return 0;
}

export function getClassColorScheme(nameOrGrade: string): ClassColorScheme {
  return CLASS_COLORS[hebrewColorIndex(nameOrGrade)];
}
