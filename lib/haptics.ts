import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/** Light tap — buttons, toggles, navigation chrome */
export function hapticLight(): void {
  if (Platform.OS === 'web') {
    try {
      navigator?.vibrate?.(10);
    } catch {
      /* iOS Safari: vibrate unsupported */
    }
    return;
  }
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/** Success — credit given, goal reached, form saved */
export function hapticSuccess(): void {
  if (Platform.OS === 'web') {
    try {
      navigator?.vibrate?.([10, 40, 10]);
    } catch {
      /* no-op */
    }
    return;
  }
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/** Medium impact — destructive confirm, important CTA */
export function hapticMedium(): void {
  if (Platform.OS === 'web') {
    try {
      navigator?.vibrate?.(20);
    } catch {
      /* no-op */
    }
    return;
  }
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
