import { useWindowDimensions, Platform, ViewStyle } from 'react-native';

export const BP = { md: 768, lg: 1024 } as const;
export const MAX_CONTENT_W = 900;

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  return {
    isWeb,
    isMobile:  !isWeb || width < BP.md,
    isDesktop: isWeb && width >= BP.md,
    isLarge:   isWeb && width >= BP.lg,
    width,
  };
}

/** Max-width column for desktop web content. Pair with desktopRowCenter on the parent. */
export function desktopContentStyle(isDesktop: boolean): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return { maxWidth: MAX_CONTENT_W, width: '100%' };
}

/** Centers a max-width child inside a full-bleed row (header, hero, etc.). */
export function desktopRowCenter(isDesktop: boolean): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return { alignItems: 'center', width: '100%' };
}
