import { useWindowDimensions, Platform } from 'react-native';

export const BP = { md: 768, lg: 1024 } as const;

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
