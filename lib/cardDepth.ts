import { Platform } from 'react-native';

export const CARD_DEPTH = '#5b4300';

/** Web-only hard shadow — native uses {@link DepthShell} lip layer instead. */
export function hardDepthStyle(
  pressed: boolean,
  depth = 5,
  color: string = CARD_DEPTH,
): object {
  if (Platform.OS !== 'web') return {};
  const transition = { transition: 'box-shadow 0.15s ease' } as any;
  return pressed
    ? { ...transition, boxShadow: `0 1px 0 ${color}` }
    : { ...transition, boxShadow: `0 ${depth}px 0 ${color}` };
}

/** @deprecated Prefer wrapping in DepthShell — kept for web-only StyleSheet spreads. */
export function buttonDepthStatic(depth = 5, color: string = CARD_DEPTH): object {
  return hardDepthStyle(false, depth, color);
}

/** Web shadow + hover; native depth is handled by DepthShell. */
export function cardDepthStyle(pressed: boolean, hovered: boolean): object {
  if (Platform.OS !== 'web') return {};
  const transition = { transition: 'box-shadow 0.22s ease, transform 0.22s ease' } as any;
  if (pressed) return { ...hardDepthStyle(true, 5), ...transition };
  if (hovered) {
    return {
      ...transition,
      boxShadow: '0 14px 32px rgba(91,67,0,0.14), 0 6px 0 #5b4300',
    };
  }
  return { ...hardDepthStyle(false, 5), ...transition };
}
