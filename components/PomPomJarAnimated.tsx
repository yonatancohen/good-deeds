import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';
import { Colors } from '@/components/ui';

const MAX_POMS  = 28;
const JAR_W     = 190;
const JAR_H     = 250;
const POM_D     = 40;
const COLS      = 4;
const SPACING_X = Math.floor((JAR_W - 12) / COLS);
const SPACING_Y = Math.round(POM_D * 0.60);

const LAYOUT = Array.from({ length: MAX_POMS }, (_, i) => {
  const row    = Math.floor(i / COLS);
  const col    = i % COLS;
  const zigzag = (row % 2) * (SPACING_X * 0.5);
  return {
    left:     6 + zigzag + col * SPACING_X + Math.sin(i * 2.1) * 3,
    top:      JAR_H - POM_D - 4 - row * SPACING_Y + Math.cos(i * 1.9) * 2,
    size:     POM_D - 4 + (i % 3) * 4,
    rotation: (i * 47) % 360,
  };
});

const POM_SOURCE = require('@/assets/jar/screen.png');

function PomPom({ size, rotation }: { size: number; rotation: number }) {
  return (
    <Image
      source={POM_SOURCE}
      style={{ width: size, height: size, transform: [{ rotate: `${rotation}deg` }] }}
      resizeMode="contain"
    />
  );
}

export interface PomPomJarProps {
  current: number;
  goal: number;
}

/** Large animated jar with image pompoms — demo / legacy. */
export function PomPomJar({ current, goal }: PomPomJarProps) {
  const pct          = Math.min(Math.max(current / goal, 0), 1);
  const visibleCount = Math.round(pct * MAX_POMS);

  const drops     = useRef<Animated.Value[]>(
    Array.from({ length: MAX_POMS }, () => new Animated.Value(0)),
  ).current;
  const prevCount = useRef(0);

  useEffect(() => {
    const from = prevCount.current;
    const to   = visibleCount;

    if (to > from) {
      for (let i = from; i < to; i++) {
        drops[i].setValue(-(JAR_H + 60));
        Animated.spring(drops[i], {
          toValue: 0,
          tension: 50,
          friction: 6,
          delay: (i - from) * 80,
          useNativeDriver: true,
        }).start();
      }
    } else if (to < from) {
      for (let i = to; i < from; i++) {
        drops[i].setValue(-(JAR_H + 60));
      }
    }

    prevCount.current = to;
  }, [visibleCount]);

  return (
    <View style={S.wrap}>
      <View style={S.rim} />
      <View style={S.jar}>
        <View style={S.shine} />
        {LAYOUT.slice(0, visibleCount).map((pos, i) => (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: pos.left,
              top:  pos.top,
              transform: [{ translateY: drops[i] }],
            }}
          >
            <PomPom size={pos.size} rotation={pos.rotation} />
          </Animated.View>
        ))}
      </View>
      <View style={S.stats}>
        <Text style={S.pctText}>{Math.round(pct * 100)}%</Text>
        <Text style={S.countText}>{current} / {goal} נקודות</Text>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  wrap: { alignItems: 'center' },
  rim: {
    width: JAR_W + 24, height: 20,
    borderRadius: 10,
    borderWidth: 3, borderColor: '#94a3b8',
    backgroundColor: 'transparent',
    marginBottom: -3,
    zIndex: 2,
  },
  jar: {
    width: JAR_W, height: JAR_H,
    borderLeftWidth: 3, borderRightWidth: 3,
    borderBottomWidth: 3, borderTopWidth: 0,
    borderColor: '#94a3b8',
    borderBottomLeftRadius: 22, borderBottomRightRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(248,250,252,0.7)',
  },
  shine: {
    position: 'absolute',
    top: 0, left: 8,
    width: 6, height: JAR_H,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: 3,
  },
  stats:     { marginTop: 18, alignItems: 'center' },
  pctText:   {
    fontSize: 34, fontWeight: '700', color: Colors.primary,
    fontFamily: 'Baloo2_700Bold',
  } as any,
  countText: {
    fontSize: 14, color: '#94a3b8', marginTop: 2,
    fontFamily: 'Nunito_400Regular', writingDirection: 'rtl',
  } as any,
});
