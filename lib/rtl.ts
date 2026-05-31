import { I18nManager } from 'react-native';

/**
 * Hebrew app — RTL via explicit styles (row-reverse, textAlign) and CSS on #root.
 * We do not use forceRTL: it double-mirrors row-reverse and breaks web layout.
 */
I18nManager.allowRTL(true);

/** App is always Hebrew RTL (used for swipe-back edge, etc.). */
export const APP_IS_RTL = true;
