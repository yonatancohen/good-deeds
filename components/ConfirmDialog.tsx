/**
 * Cross-platform confirmation dialog.
 * On web: renders a beautiful centered modal with overlay.
 * On native: falls back to Alert.alert.
 *
 * Usage:
 *   1. Wrap your app with <ConfirmProvider />
 *   2. Call confirmAction(title, message, onConfirm) anywhere
 */
import React, {
  createContext, useContext, useEffect, useRef, useState,
} from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, Platform,
} from 'react-native';
import { Colors } from '@/components/ui';
import { TriangleAlert } from 'lucide-react-native';

// ── Module-level bridge (imperative API) ─────────────────────────────────────
type ShowFn = (title: string, message: string, confirmLabel: string) => Promise<boolean>;
let _show: ShowFn | null = null;
export function _registerConfirmDialog(fn: ShowFn) { _show = fn; }

export async function webConfirm(
  title: string,
  message: string,
  confirmLabel = 'מחיקה',
): Promise<boolean> {
  if (!_show) return false;
  return _show(title, message, confirmLabel);
}

// ── Context ───────────────────────────────────────────────────────────────────
interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
}

const HIDDEN: DialogState = { visible: false, title: '', message: '', confirmLabel: 'מחיקה' };

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(HIDDEN);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  // Only register on web — native uses Alert.alert directly
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    _registerConfirmDialog((title, message, confirmLabel) => {
      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setState({ visible: true, title, message, confirmLabel });
      });
    });
  }, []);

  useEffect(() => {
    if (state.visible) {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 260, friction: 24, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [state.visible]);

  function respond(result: boolean) {
    resolveRef.current?.(result);
    setState(HIDDEN);
  }

  return (
    <>
      {children}
      {Platform.OS === 'web' && (
        <Modal
          visible={state.visible}
          transparent
          animationType="none"
          onRequestClose={() => respond(false)}
        >
          {/* Overlay */}
          <Animated.View style={[S.overlay, { opacity: fadeAnim }]}>
            <TouchableOpacity style={S.overlayTouch} activeOpacity={1} onPress={() => respond(false)} />

            {/* Card */}
            <Animated.View style={[S.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
              {/* Icon */}
              <View style={S.iconWrap}>
                <TriangleAlert size={26} color={Colors.danger} />
              </View>

              {/* Text */}
              <Text style={S.title}>{state.title}</Text>
              {!!state.message && <Text style={S.message}>{state.message}</Text>}

              {/* Buttons */}
              <View style={S.btns}>
                <TouchableOpacity
                  onPress={() => respond(false)}
                  style={S.btnCancel}
                  accessibilityRole="button"
                  accessibilityLabel="ביטול"
                >
                  <Text style={S.btnCancelText}>ביטול</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => respond(true)}
                  style={S.btnConfirm}
                  accessibilityRole="button"
                  accessibilityLabel={state.confirmLabel}
                >
                  <Text style={S.btnConfirmText}>{state.confirmLabel}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: 320,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 24,
  },
  iconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#FEF2F2',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17, fontWeight: '700', color: '#0f172a',
    textAlign: 'center', marginBottom: 8,
    fontFamily: 'Baloo2_700Bold',
  } as any,
  message: {
    fontSize: 14, color: '#64748b',
    textAlign: 'center', lineHeight: 20,
    marginBottom: 4,
  } as any,
  btns: {
    flexDirection: 'row', gap: 10, marginTop: 22, width: '100%',
  },
  btnCancel: {
    flex: 1, height: 46, borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 15, fontWeight: '600', color: '#475569',
  } as any,
  btnConfirm: {
    flex: 1, height: 46, borderRadius: 12,
    backgroundColor: Colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  btnConfirmText: {
    fontSize: 15, fontWeight: '700', color: '#fff',
  } as any,
});
