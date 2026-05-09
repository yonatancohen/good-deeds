import { Alert, Platform } from 'react-native';
import { webConfirm } from '@/components/ConfirmDialog';

/**
 * Cross-platform confirmation dialog.
 * - Web:    custom beautiful modal (ConfirmDialog)
 * - Native: Alert.alert with cancel/destructive buttons
 */
export async function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'מחיקה',
) {
  if (Platform.OS === 'web') {
    const confirmed = await webConfirm(title, message, confirmLabel);
    if (confirmed) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'ביטול', style: 'cancel' },
      { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
