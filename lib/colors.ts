/**
 * Design-system color tokens — single source of truth.
 *
 * Palette: "Cheerful Encouragement" (Stitch board · The Good Deeds Jar)
 * Custom accents: coral #FF6B35 · salmon #F08080 · peach #FFCB91
 *
 * Import everywhere as:
 *   import { Colors } from '@/lib/colors';
 * (also re-exported from '@/components/ui' for backward compatibility)
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Primary   warm amber/yellow  #ffc107  CTA, jar, active nav    │
 * │  Secondary soft blue          #0060ac  admin, nav, info        │
 * │  Success   fresh green        #006e1c  points earned, positive │
 * │  Danger    warm red           #ba1a1a  delete, error states    │
 * │  Coral     custom             #FF6B35  category chip A         │
 * │  Salmon    custom             #F08080  category chip B         │
 * │  Peach     custom             #FFCB91  category chip C         │
 * └─────────────────────────────────────────────────────────────────┘
 */

export const Colors = {
  // ── Primary: warm amber / yellow ──────────────────────────────────────────
  /** Main CTA buttons, active nav, jar fill */
  primary:       '#ffc107',
  /** Deep amber — text/icons sitting on a yellow surface */
  primaryDark:   '#785900',
  /** Light amber — chips, tag backgrounds, hover surfaces */
  primaryLight:  '#ffdf9e',
  /** Softest amber — page background  */
  primarySurface: '#fff8f2',

  // ── Secondary: soft blue ──────────────────────────────────────────────────
  /** Admin actions, instructional text, info states */
  secondary:       '#0060ac',
  secondaryLight:  '#68abff',
  secondarySurface: '#d4e3ff',

  // ── Custom accent trio ────────────────────────────────────────────────────
  /** Warm coral-orange — category / deed chip A */
  accent:      '#FF6B35',
  /** Soft coral-pink  — category / deed chip B */
  salmon:      '#F08080',
  /** Warm peach/apricot — category / deed chip C (also accentLight alias) */
  peach:       '#FFCB91',
  /** Alias kept for backward compatibility */
  accentLight: '#FFCB91',

  // ── Success / positive ────────────────────────────────────────────────────
  success:       '#006e1c',
  successLight:  '#7ce17b',
  successSurface: '#ecfdf5',

  // ── Danger / error ────────────────────────────────────────────────────────
  danger:      '#ba1a1a',
  dangerLight: '#ffdad6',

  // ── Surfaces & layout ─────────────────────────────────────────────────────
  /** Warm off-white page background */
  bg:          '#fff8f2',
  /** White card face */
  card:        '#ffffff',
  /** Slightly tinted container surface (inside cards, modals) */
  surface:     '#f5ede2',
  /** Dimmed surface — dividers, inactive zones */
  surfaceDim:  '#e1d9ce',

  // ── Text ──────────────────────────────────────────────────────────────────
  /** Primary text — warm near-black */
  text:        '#1e1b15',
  /** Secondary / caption text — warm brown-gray */
  muted:       '#4f4632',

  // ── Borders & outlines ────────────────────────────────────────────────────
  /** Default border color — warm tan */
  border:      '#d4c5ab',
  /** Stronger outline for focused / active states */
  outline:     '#827660',
};

export type ColorKey = keyof typeof Colors;
