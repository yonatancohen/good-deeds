/**
 * AdminSheet — bottom sheet on mobile, centered dialog on desktop (≥768px web).
 * - Mobile: slides up from bottom with drag-to-dismiss
 * - Desktop: fade+scale centered modal, click backdrop or ✕ to close
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useBreakpoint } from '@/lib/responsive';
import { shadow } from '@/lib/shadow';

// useNativeDriver is unsupported on web — JS-based animation is fine there
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface AdminSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max height as a fraction of screen (default 0.92). Ignored on desktop. */
  maxHeightFraction?: number;
}

const SLIDE_HEIGHT = 500;
const DISMISS_THRESHOLD = 80;
const DISMISS_VELOCITY = 0.5;

export default function AdminSheet({
  visible,
  onClose,
  children,
  maxHeightFraction = 0.92,
}: AdminSheetProps) {
  const { isDesktop } = useBreakpoint();

  // ── Shared ────────────────────────────────────────────────────────────────
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [modalMounted, setModalMounted] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // ── Mobile-only ───────────────────────────────────────────────────────────
  const sheetTranslateY = useRef(new Animated.Value(SLIDE_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const translateY = Animated.add(sheetTranslateY, dragY);
  const isOpen = useRef(false);

  // ── Desktop-only ──────────────────────────────────────────────────────────
  const dialogOpacity = useRef(new Animated.Value(0)).current;
  const dialogScale  = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    if (visible) {
      setModalMounted(true);
      dragY.setValue(0);

      requestAnimationFrame(() => {
        if (isDesktop) {
          Animated.parallel([
            Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.timing(dialogOpacity,   { toValue: 1, duration: 200, useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.spring(dialogScale,     { toValue: 1, tension: 260, friction: 24, useNativeDriver: USE_NATIVE_DRIVER }),
          ]).start();
        } else {
          Animated.parallel([
            Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: USE_NATIVE_DRIVER }),
            Animated.spring(sheetTranslateY, {
              toValue: 0, useNativeDriver: USE_NATIVE_DRIVER,
              damping: 22, stiffness: 200, mass: 0.8,
            }),
          ]).start(() => { isOpen.current = true; });
        }
      });
    } else {
      isOpen.current = false;

      if (isDesktop) {
        Animated.parallel([
          Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(dialogOpacity,   { toValue: 0, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(dialogScale,     { toValue: 0.94, duration: 180, useNativeDriver: USE_NATIVE_DRIVER }),
        ]).start(({ finished }) => {
          if (finished) { setModalMounted(false); dialogOpacity.setValue(0); dialogScale.setValue(0.94); }
        });
      } else {
        Animated.parallel([
          Animated.timing(backdropOpacity,  { toValue: 0, duration: 220, useNativeDriver: USE_NATIVE_DRIVER }),
          Animated.timing(sheetTranslateY,  { toValue: SLIDE_HEIGHT, duration: 240, useNativeDriver: USE_NATIVE_DRIVER }),
        ]).start(({ finished }) => {
          if (finished) { setModalMounted(false); dragY.setValue(0); }
        });
      }
    }
  }, [visible, isDesktop]);

  // Lift bottom sheet when the keyboard opens (mobile only).
  useEffect(() => {
    if (isDesktop || !visible) {
      setKeyboardHeight(0);
      return;
    }
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const onShow = Keyboard.addListener(showEvt, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const onHide = Keyboard.addListener(hideEvt, () => {
      setKeyboardHeight(0);
    });
    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [visible, isDesktop]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isOpen.current,
      onMoveShouldSetPanResponder: (_, gs) =>
        isOpen.current && gs.dy > 2 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) dragY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > DISMISS_VELOCITY) {
          Animated.timing(dragY, { toValue: SLIDE_HEIGHT, duration: 200, useNativeDriver: USE_NATIVE_DRIVER })
            .start(() => onClose());
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: USE_NATIVE_DRIVER, damping: 20, stiffness: 300 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, { toValue: 0, useNativeDriver: USE_NATIVE_DRIVER, damping: 20, stiffness: 300 }).start();
      },
    }),
  ).current;

  // ── Desktop render ────────────────────────────────────────────────────────
  if (isDesktop) {
    // Hoist first child marked as header into the dialog title slot
    const childArray = React.Children.toArray(children);
    const firstChild = childArray[0] as React.ReactElement<{ accessibilityRole?: string; style?: any }>;
    const hasTitle = React.isValidElement(firstChild) && (firstChild.props as any)?.accessibilityRole === 'header';
    const titleNode = hasTitle ? firstChild : null;
    const bodyChildren = hasTitle ? childArray.slice(1) : childArray;

    return (
      <Modal
        visible={modalMounted}
        transparent
        animationType="none"
        onRequestClose={onClose}
        accessibilityViewIsModal
      >
        {/* Backdrop */}
        <Animated.View style={[S.overlay, { opacity: backdropOpacity }]}>
          {/* Tap backdrop to close */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            importantForAccessibility="no-hide-descendants"
            aria-hidden
          />

          {/* Centered dialog */}
          <Animated.View
            style={[S.dialog, { opacity: dialogOpacity, transform: [{ scale: dialogScale }] }]}
            {...(Platform.OS === 'web' ? { role: 'dialog', 'aria-modal': true } as any : {})}
          >
            {/* Header: title (RTL right) + close button (left) */}
            <View style={S.dialogHeader}>
              {titleNode && React.cloneElement(titleNode as React.ReactElement<any>, { style: S.dialogTitle })}
              <TouchableOpacity
                onPress={onClose}
                style={S.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="סגור"
                {...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {})}
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Scrollable content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={S.dialogContent}
              keyboardShouldPersistTaps="handled"
            >
              {bodyChildren}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // ── Mobile render (unchanged) ─────────────────────────────────────────────
  return (
    <Modal
      visible={modalMounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      {/* 1. Visual backdrop */}
      <Animated.View
        style={[S.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="none"
        importantForAccessibility="no-hide-descendants"
        aria-hidden
      />

      {/* 2. Tap-to-close area */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        importantForAccessibility="no-hide-descendants"
        aria-hidden
      />

      {/* 3. Sheet */}
      <View style={S.sheetContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            S.sheet,
            { maxHeight: `${maxHeightFraction * 100}%` as any },
            { transform: [{ translateY }] },
            keyboardHeight > 0 && { marginBottom: keyboardHeight },
          ]}
          accessibilityRole="none"
          {...(Platform.OS === 'web' ? { role: 'dialog', 'aria-modal': true } as any : {})}
        >
          <View
            style={S.handleArea}
            {...panResponder.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="גרור לסגירה"
          >
            <View style={S.handle} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            contentContainerStyle={S.sheetScrollContent}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
  // ── Mobile ──────────────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any)
      : {}),
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  sheetScrollContent: {
    paddingBottom: 40,
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    marginHorizontal: -20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },

  // ── Desktop ──────────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as any)
      : {}),
  },
  dialog: {
    width: 520,
    maxHeight: '85%' as any,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    ...shadow('#0f172a', 24, 48, 0.18, 30),
  },
  dialogHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dialogTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'right',
    fontFamily: 'Baloo2_700Bold',
    writingDirection: 'rtl',
    marginBottom: 0,
  } as any,
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
});
