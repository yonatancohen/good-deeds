import { useWindowDimensions, Platform, ViewStyle } from 'react-native';

export const BP = { md: 768, lg: 1024 } as const;

/** Desktop content column — matches admin home (`index`). */
export const CONTENT_MAX_W = 960;
export const CONTENT_MAX_W_LARGE = 1200;

/** @deprecated Use {@link CONTENT_MAX_W} / {@link getContentMaxWidth}. */
export const MAX_CONTENT_W = CONTENT_MAX_W;

export function getContentMaxWidth(isLarge: boolean): number {
  return isLarge ? CONTENT_MAX_W_LARGE : CONTENT_MAX_W;
}

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
export function desktopContentStyle(isDesktop: boolean, isLarge = false): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return { maxWidth: getContentMaxWidth(isLarge), width: '100%', alignSelf: 'center' };
}

/** Centered page column with horizontal padding (admin / teacher screens). */
export function desktopPageContent(isDesktop: boolean, isLarge: boolean) {
  if (!isDesktop) {
    return { width: '100%' as const, paddingHorizontal: 16 };
  }
  return {
    maxWidth: getContentMaxWidth(isLarge),
    alignSelf: 'center' as const,
    width: '100%' as const,
    paddingHorizontal: 24,
  };
}

/** Centers a max-width child inside a full-bleed row (header, hero, etc.). */
export function desktopRowCenter(isDesktop: boolean): ViewStyle | undefined {
  if (!isDesktop) return undefined;
  return { alignItems: 'center', width: '100%' };
}
