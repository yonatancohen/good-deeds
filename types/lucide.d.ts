// lucide-react-native v1.8.0 accepts `color` at runtime (maps to SVG `stroke`)
// but the type declaration omits it. This module augmentation restores the prop.
import 'lucide-react-native';
import type { ViewStyle } from 'react-native';

declare module 'lucide-react-native' {
  interface LucideProps {
    /** Shorthand for the SVG `stroke` color of the icon */
    color?: string;
    /** Allows RN-style layout adjustments (margin, position, etc.) */
    style?: ViewStyle;
  }
}
