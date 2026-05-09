/**
 * AdminSheet — animated bottom sheet with blurred backdrop.
 * - Backdrop fades in/out, blurs content beneath (web: backdrop-filter blur)
 * - Sheet springs up from bottom, slides down on close
 * - Tapping backdrop closes the sheet
 * - Drag the handle down to dismiss
 * - Modal stays mounted during close animation, then unmounts
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

interface AdminSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max height as a fraction of screen (default 0.92) */
  maxHeightFraction?: number;
}

const SLIDE_HEIGHT = 500;
/** How far down (px) the user must drag before we dismiss */
const DISMISS_THRESHOLD = 80;
/** Minimum drag velocity to dismiss even if threshold not reached */
const DISMISS_VELOCITY = 0.5;

export default function AdminSheet({
  visible,
  onClose,
  children,
  maxHeightFraction = 0.92,
}: AdminSheetProps) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SLIDE_HEIGHT)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const [modalMounted, setModalMounted] = useState(false);
  // Track whether sheet is fully open (so we only allow downward drag)
  const isOpen = useRef(false);

  // Combined translateY: open/close animation + drag gesture
  const translateY = Animated.add(sheetTranslateY, dragY);

  useEffect(() => {
    if (visible) {
      setModalMounted(true);
      dragY.setValue(0);
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(backdropOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.spring(sheetTranslateY, {
            toValue: 0, useNativeDriver: true,
            damping: 22, stiffness: 200, mass: 0.8,
          }),
        ]).start(() => { isOpen.current = true; });
      });
    } else {
      isOpen.current = false;
      Animated.parallel([
        Animated.timing(backdropOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(sheetTranslateY, { toValue: SLIDE_HEIGHT, duration: 240, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) { setModalMounted(false); dragY.setValue(0); }
      });
    }
  }, [visible, backdropOpacity, sheetTranslateY, dragY]);

  const panResponder = useRef(
    PanResponder.create({
      // Claim touch immediately on the handle area
      onStartShouldSetPanResponder: () => isOpen.current,
      onMoveShouldSetPanResponder: (_, gs) =>
        isOpen.current && gs.dy > 2 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        // Only follow downward drag (clamp to 0 at top)
        if (gs.dy > 0) dragY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DISMISS_THRESHOLD || gs.vy > DISMISS_VELOCITY) {
          // Snap down and close
          Animated.timing(dragY, {
            toValue: SLIDE_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          // Spring back to resting position
          Animated.spring(dragY, {
            toValue: 0, useNativeDriver: true,
            damping: 20, stiffness: 300,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, {
          toValue: 0, useNativeDriver: true,
          damping: 20, stiffness: 300,
        }).start();
      },
    }),
  ).current;

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
      />

      {/* 2. Tap-to-close area */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="סגור" />

      {/* 3. Sheet */}
      <View style={S.sheetContainer} pointerEvents="box-none">
        <Animated.View
          style={[
            S.sheet,
            { maxHeight: `${maxHeightFraction * 100}%` as any },
            { transform: [{ translateY }] },
          ]}
        >
          {/* Draggable handle area */}
          <View
            style={S.handleArea}
            {...panResponder.panHandlers}
            accessibilityRole="adjustable"
            accessibilityLabel="גרור לסגירה"
          >
            <View style={S.handle} />
          </View>

          {/* Sheet content (children already include their own handle view — hide it) */}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const S = StyleSheet.create({
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
    paddingBottom: 40,
    overflow: 'hidden',
  },
  // Large hit area — visual pill stays small, touch zone is generous
  handleArea: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
    marginHorizontal: -20, // bleed to sheet edges
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
});
