import { Platform } from 'react-native';

function hexToRgb(hex: string): string {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

/** Cross-platform shadow: boxShadow on web, native shadow props on iOS/Android. */
export function shadow(
  color: string,
  offsetY: number,
  blur: number,
  opacity: number,
  elevation?: number,
): object {
  if (Platform.OS === 'web') {
    const rgb = color.startsWith('#') ? hexToRgb(color) : '0,0,0';
    return { boxShadow: `0px ${offsetY}px ${blur}px rgba(${rgb},${opacity})` };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation: elevation ?? Math.round(offsetY * 2 + blur / 4),
  };
}
