import { Platform } from 'react-native';
import { shadow } from '@/lib/shadow';

export const CARD_DEPTH = '#5b4300';

/** 3D lift shadow — matches public class cards on `/`. */
export function cardDepthStyle(pressed: boolean, hovered: boolean): object {
  if (Platform.OS === 'web') {
    const transition = { transition: 'box-shadow 0.22s ease, transform 0.22s ease' } as any;
    if (pressed) return { ...transition, boxShadow: '0 1px 0 #5b4300' };
    if (hovered) {
      return {
        ...transition,
        boxShadow: '0 14px 32px rgba(91,67,0,0.14), 0 6px 0 #5b4300',
      };
    }
    return { ...transition, boxShadow: '0 5px 0 #5b4300' };
  }
  if (pressed) return shadow(CARD_DEPTH, 1, 6, 0.14, 3);
  return shadow(CARD_DEPTH, 5, 14, 0.2, 8);
}
