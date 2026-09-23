import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Colors } from '@/lib/colors';
import { dismissPromo, isPromoDismissed, type PromoId } from '@/lib/promoDismiss';
import { HEBREW_ROW } from '@/lib/rtlLayout';

export type PromoBannerVariant = 'success' | 'accent';

type VariantStyle = {
  banner: ViewStyle;
  iconWrap: ViewStyle;
  text: TextStyle;
};

const VARIANTS: Record<PromoBannerVariant, VariantStyle> = {
  success: {
    banner: {
      backgroundColor: Colors.successSurface,
      borderColor: Colors.successLight,
    },
    iconWrap: { backgroundColor: '#DCFCE7' },
    text: { color: Colors.success },
  },
  accent: {
    banner: {
      backgroundColor: '#FFF0EB',
      borderColor: '#FFD4C4',
    },
    iconWrap: { backgroundColor: '#FFE4D9' },
    text: { color: Colors.accent },
  },
};

const ptr = Platform.OS === 'web' ? ({ cursor: 'pointer' } as const) : {};

type DismissiblePromoBannerProps = {
  promoId: PromoId;
  variant: PromoBannerVariant;
  icon: React.ReactNode;
  children: string;
};

export function DismissiblePromoBanner({
  promoId,
  variant,
  icon,
  children,
}: DismissiblePromoBannerProps) {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const v = VARIANTS[variant];

  useEffect(() => {
    let cancelled = false;
    isPromoDismissed(promoId).then((dismissed) => {
      if (cancelled) return;
      setVisible(!dismissed);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [promoId]);

  const handleDismiss = useCallback(async () => {
    await dismissPromo(promoId);
    setVisible(false);
  }, [promoId]);

  if (!ready || !visible) return null;

  return (
    <View style={[S.banner, v.banner]} accessibilityRole="summary">
      <View style={[S.iconWrap, v.iconWrap]}>{icon}</View>
      <Text style={[S.text, v.text]}>{children}</Text>
      <TouchableOpacity
        onPress={handleDismiss}
        style={[S.closeBtn, ptr]}
        accessibilityRole="button"
        accessibilityLabel="סגור הסבר"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <X size={18} color={Colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

const S = StyleSheet.create({
  banner: {
    flexDirection: HEBREW_ROW,
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
    writingDirection: 'rtl',
  } as object,
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: -2,
  },
});
