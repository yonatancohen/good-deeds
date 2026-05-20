/**
 * Compact pompom jar — fluffy balls in a glass jar (public cards + teacher class view).
 * Large size uses spring drop-in animation (like legacy PomPomJarAnimated).
 */
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Colors } from '@/components/ui';
import { shadow } from '@/lib/shadow';

const POMPOM_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4',
];

export type PompomJarSize = 'sm' | 'lg';

export interface PompomJarProps {
  value: number;
  max: number;
  size?: PompomJarSize;
  /** Large hero: show point total below jar (not under the lid) */
  showHeroStats?: boolean;
}

const SIZES = {
  sm: {
    cols: 4,
    lidW: 26, lidH: 5, jarW: 34, jarH: 44,
    ball: 7, gap: 2, maxBalls: 18, countFs: 10,
    lidRadius: 3, jarRadius: 6, border: 2, pad: 2,
  },
  lg: {
    cols: 6,
    lidW: 128, lidH: 22, jarW: 200, jarH: 278,
    ball: 27, gap: 3, maxBalls: 42, countFs: 14,
    lidRadius: 8, jarRadius: 22, border: 3, pad: 12,
  },
} as const;

type Dim = (typeof SIZES)[PompomJarSize];

function ballDiameter(seed: number, base: number, large: boolean): number {
  const r = seeded(seed, 0);
  // lg: 88%–128% of base; sm: subtler on tiny cards
  const min = large ? 0.88 : 0.9;
  const spread = large ? 0.4 : 0.18;
  return Math.round(base * (min + r * spread));
}

function ballLayout(dim: Dim) {
  const large = dim === SIZES.lg;
  const { cols } = dim;
  const gridW = cols * dim.ball + (cols - 1) * dim.gap;
  const startX = (dim.jarW - gridW) / 2;

  return Array.from({ length: dim.maxBalls }, (_, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const d = ballDiameter(i, dim.ball, large);
    const cellLeft = startX + (cols - 1 - col) * (dim.ball + dim.gap) + Math.sin(i * 2.1) * 2.5;
    const cellBottom =
      dim.jarH -
      dim.pad -
      row * (dim.ball + dim.gap) -
      dim.ball +
      Math.cos(i * 1.9) * 2;

    return {
      left: cellLeft + (dim.ball - d) / 2,
      top: cellBottom + (dim.ball - d),
      diameter: d,
    };
  });
}

function seeded(seed: number, slot: number): number {
  const x = Math.sin(seed * 12.9898 + slot * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function ballVisual(seed: number, diameter: number) {
  const r = (slot: number) => seeded(seed, slot);
  const tilt = -28 + r(1) * 56;

  const hiSize = diameter * (0.22 + r(2) * 0.2);
  const hiTop = diameter * (0.04 + r(3) * 0.2);
  const hiLeft = diameter * (0.06 + r(4) * 0.32);
  const hiOpacity = 0.32 + r(5) * 0.42;

  const shadeSize = diameter * (0.28 + r(6) * 0.22);
  const shadeBottom = diameter * (0.08 + r(7) * 0.18);
  const shadeRight = diameter * (0.04 + r(8) * 0.24);
  const shadeOpacity = 0.06 + r(9) * 0.14;

  const spec =
    r(10) > 0.45
      ? {
          top: diameter * (0.12 + r(11) * 0.35),
          left: diameter * (0.38 + r(12) * 0.38),
          size: diameter * (0.08 + r(13) * 0.1),
          opacity: 0.2 + r(14) * 0.35,
        }
      : null;

  return {
    diameter,
    tilt,
    hi: { top: hiTop, left: hiLeft, size: hiSize, opacity: hiOpacity },
    shade: {
      bottom: shadeBottom,
      right: shadeRight,
      size: shadeSize,
      opacity: shadeOpacity,
    },
    spec,
    fluff: shadow(
      '#785900',
      1 + Math.round(r(15) * 3),
      2 + Math.round(r(16) * 3),
      0.16 + r(17) * 0.22,
      2,
    ),
  };
}

function PompomBall({
  diameter,
  color,
  seed,
}: {
  diameter: number;
  color: string;
  seed: number;
}) {
  const v = useMemo(() => ballVisual(seed, diameter), [seed, diameter]);

  return (
    <View
      style={[
        {
          width: v.diameter,
          height: v.diameter,
          borderRadius: v.diameter / 2,
          backgroundColor: color,
          transform: [{ rotate: `${v.tilt}deg` }],
          overflow: 'hidden',
        },
        v.fluff,
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top: v.hi.top,
          left: v.hi.left,
          width: v.hi.size,
          height: v.hi.size,
          borderRadius: v.hi.size / 2,
          backgroundColor: `rgba(255,255,255,${v.hi.opacity})`,
        }}
      />
      {v.spec && (
        <View
          style={{
            position: 'absolute',
            top: v.spec.top,
            left: v.spec.left,
            width: v.spec.size,
            height: v.spec.size,
            borderRadius: v.spec.size / 2,
            backgroundColor: `rgba(255,255,255,${v.spec.opacity})`,
          }}
        />
      )}
      <View
        style={{
          position: 'absolute',
          bottom: v.shade.bottom,
          right: v.shade.right,
          width: v.shade.size,
          height: v.shade.size,
          borderRadius: v.shade.size / 2,
          backgroundColor: `rgba(0,0,0,${v.shade.opacity})`,
        }}
      />
    </View>
  );
}

function JarChrome({
  dim,
  children,
  centerOverlay,
}: {
  dim: Dim;
  children: React.ReactNode;
  centerOverlay?: React.ReactNode;
}) {
  return (
    <>
      <View
        style={[
          S.lid,
          { width: dim.lidW, height: dim.lidH, borderRadius: dim.lidRadius },
        ]}
      />
      <View
        style={[
          S.jarBody,
          {
            width: dim.jarW,
            height: dim.jarH,
            borderRadius: dim.jarRadius,
            borderWidth: dim.border,
          },
          dim === SIZES.lg && S.jarBodyLg,
        ]}
      >
        <View style={[S.jarShine, dim === SIZES.lg && S.jarShineLg]} />
        {children}
        {centerOverlay}
      </View>
    </>
  );
}

const COUNT_ANIM_MS = 2800;

function HeroBadge({ value }: { value: number }) {
  const countAnim = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.82)).current;
  const [display, setDisplay] = useState(0);
  const prevValue = useRef<number | null>(null);
  const countRunning = useRef<Animated.CompositeAnimation | null>(null);

  useLayoutEffect(() => {
    countRunning.current?.stop();
    countRunning.current = null;

    const from = prevValue.current ?? 0;
    prevValue.current = value;
    const span = Math.abs(value - from);

    countAnim.setValue(from);
    setDisplay(from);

    const listenerId = countAnim.addListener(({ value: v }) => {
      setDisplay(Math.round(v));
    });

    if (span === 0) {
      badgeScale.setValue(1);
      setDisplay(value);
      return () => countAnim.removeListener(listenerId);
    }

    badgeScale.setValue(0.82);
    const countDuration = Math.max(
      450,
      Math.round(COUNT_ANIM_MS * (span / Math.max(value, span, 1))),
    );

    const batch = Animated.parallel([
      Animated.timing(countAnim, {
        toValue: value,
        duration: countDuration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.spring(badgeScale, {
        toValue: 1,
        tension: 24,
        friction: 11,
        useNativeDriver: true,
      }),
    ]);
    countRunning.current = batch;
    batch.start(({ finished }) => {
      if (finished) {
        setDisplay(value);
        countRunning.current = null;
      }
    });

    return () => {
      countAnim.removeListener(listenerId);
      countRunning.current?.stop();
      countRunning.current = null;
    };
  }, [value, countAnim, badgeScale]);

  const targetLen = String(value).length;
  const size = targetLen >= 3 ? 84 : 72;
  const fontSize = targetLen >= 3 ? 26 : targetLen >= 2 ? 30 : 34;

  return (
    <View style={S.heroBadgeAnchor} pointerEvents="none">
      <Animated.View
        style={[
          S.heroBadgeCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale: badgeScale }],
          },
        ]}
      >
        <Text style={[S.heroBadgeText, { fontSize }]}>{display}</Text>
      </Animated.View>
    </View>
  );
}

function PompomJarSm({
  value,
  max,
  showHeroStats,
}: Pick<PompomJarProps, 'value' | 'max' | 'showHeroStats'>) {
  const dim = SIZES.sm;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const ballCount = Math.max(0, Math.round(pct * dim.maxBalls));

  const rows = useMemo(() => {
    const { cols } = dim;
    const out: number[][] = [];
    for (let i = 0; i < ballCount; i += cols) {
      out.push(Array.from({ length: Math.min(cols, ballCount - i) }, (_, j) => i + j));
    }
    return out.reverse();
  }, [ballCount, dim]);

  return (
    <View style={S.wrap}>
      <View style={S.jarStack}>
        <JarChrome dim={dim}>
          <View style={[S.ballStack, { padding: dim.pad }]}>
            {rows.map((row, ri) => (
              <View
                key={ri}
                style={[
                  S.ballRow,
                  { gap: dim.gap, marginBottom: ri < rows.length - 1 ? dim.gap : 0 },
                ]}
              >
                {row.map((idx) => (
                  <PompomBall
                    key={idx}
                    diameter={ballDiameter(idx, dim.ball, false)}
                    color={POMPOM_COLORS[idx % POMPOM_COLORS.length]}
                    seed={idx}
                  />
                ))}
              </View>
            ))}
          </View>
        </JarChrome>
        {!showHeroStats && (
          <Text style={[S.count, { fontSize: dim.countFs }]}>{value}</Text>
        )}
      </View>
    </View>
  );
}

const LG_DROP_ABOVE = 72;

function dropDelay(index: number, from: number, cols: number): number {
  const r = (slot: number) => seeded(index, slot + 50);
  const jitter = Math.round(r(0) * 90);

  if (from === 0) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return row * 186 + col * 84 + jitter;
  }
  return (index - from) * 390 + jitter;
}

/** Soft pop-in: short float down + scale up, no bounce or spin. */
function buildPopInAnimation(
  index: number,
  dropY: Animated.Value,
  scale: Animated.Value,
  opacity: Animated.Value,
): Animated.CompositeAnimation {
  const r = (slot: number) => seeded(index, slot + 40);
  const startY = -(LG_DROP_ABOVE + r(0) * 28);
  const slow = 0.9 + r(1) * 0.25;

  dropY.setValue(startY);
  scale.setValue(0.62);
  opacity.setValue(0);

  const fadeMs = Math.round((960 + r(2) * 420) * (0.85 + slow * 0.08));

  return Animated.parallel([
    Animated.spring(dropY, {
      toValue: 0,
      tension: Math.round(16 * slow),
      friction: 14,
      useNativeDriver: true,
    }),
    Animated.spring(scale, {
      toValue: 1,
      tension: Math.round(20 * slow),
      friction: 13,
      useNativeDriver: true,
    }),
    Animated.timing(opacity, {
      toValue: 1,
      duration: fadeMs,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }),
  ]);
}

function PompomJarLg({
  value,
  max,
  showHeroStats,
}: Pick<PompomJarProps, 'value' | 'max' | 'showHeroStats'>) {
  const dim = SIZES.lg;
  const layout = useMemo(() => ballLayout(dim), [dim]);
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const ballCount = Math.max(0, Math.round(pct * dim.maxBalls));

  const drops = useRef(
    Array.from({ length: dim.maxBalls }, () => new Animated.Value(-LG_DROP_ABOVE)),
  ).current;
  const scales = useRef(
    Array.from({ length: dim.maxBalls }, () => new Animated.Value(0.62)),
  ).current;
  const opacities = useRef(
    Array.from({ length: dim.maxBalls }, () => new Animated.Value(0)),
  ).current;
  const prevCount = useRef(0);
  const running = useRef<Animated.CompositeAnimation | null>(null);

  useLayoutEffect(() => {
    running.current?.stop();
    running.current = null;

    const from = prevCount.current;
    const to = ballCount;

    if (to > from) {
      const anims: Animated.CompositeAnimation[] = [];
      for (let i = from; i < to; i++) {
        [drops[i], scales[i], opacities[i]].forEach((v) => v.stopAnimation());
        const delay = dropDelay(i, from, dim.cols);
        const pop = buildPopInAnimation(i, drops[i], scales[i], opacities[i]);
        anims.push(delay > 0 ? Animated.sequence([Animated.delay(delay), pop]) : pop);
      }
      const batch = Animated.parallel(anims);
      running.current = batch;
      batch.start(({ finished }) => {
        if (finished) running.current = null;
      });
    } else if (to < from) {
      for (let i = to; i < from; i++) {
        [drops[i], scales[i], opacities[i]].forEach((v) => v.stopAnimation());
        drops[i].setValue(-LG_DROP_ABOVE);
        scales[i].setValue(0.62);
        opacities[i].setValue(0);
      }
    }

    prevCount.current = to;

    return () => {
      running.current?.stop();
      running.current = null;
    };
  }, [ballCount, drops, scales, opacities]);

  return (
    <View style={S.wrap}>
      <View style={[S.jarStack, S.jarStackLg]}>
        <JarChrome dim={dim} centerOverlay={showHeroStats ? <HeroBadge value={value} /> : undefined}>
          {layout.slice(0, ballCount).map((pos, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: pos.left,
                top: pos.top,
                zIndex: 2,
                opacity: opacities[i],
                transform: [{ translateY: drops[i] }, { scale: scales[i] }],
              }}
            >
              <PompomBall
                diameter={pos.diameter}
                color={POMPOM_COLORS[i % POMPOM_COLORS.length]}
                seed={i}
              />
            </Animated.View>
          ))}
        </JarChrome>
        {!showHeroStats && (
          <Text style={[S.count, { fontSize: dim.countFs }]}>{value}</Text>
        )}
      </View>
    </View>
  );
}

export function PompomJar({
  value,
  max,
  size = 'sm',
  showHeroStats = false,
}: PompomJarProps) {
  if (size === 'lg') {
    return <PompomJarLg value={value} max={max} showHeroStats={showHeroStats} />;
  }
  return <PompomJarSm value={value} max={max} showHeroStats={showHeroStats} />;
}

export const POMPOM_JAR_SM = SIZES.sm;

const S = StyleSheet.create({
  wrap: { alignItems: 'center' },
  jarStack: { alignItems: 'center', gap: 2 },
  jarStackLg: { gap: 8 },
  lid: {
    backgroundColor: Colors.border,
    ...shadow('#785900', 1, 2, 0.12, 1),
  },
  jarBody: {
    borderColor: Colors.border,
    backgroundColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    ...shadow('#785900', 3, 8, 0.1, 3),
  },
  jarBodyLg: {
    ...shadow('#785900', 4, 12, 0.12, 4),
  },
  jarShine: {
    position: 'absolute',
    top: 6,
    left: 8,
    width: 5,
    height: '72%' as any,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    zIndex: 1,
  },
  jarShineLg: {
    top: 12,
    left: 14,
    width: 8,
    height: '78%' as any,
  },
  ballStack: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    minHeight: '100%' as any,
    paddingBottom: 2,
  },
  ballRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
  },
  count: {
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'Baloo2_700Bold',
  } as any,
  heroBadgeAnchor: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroBadgeCircle: {
    backgroundColor: '#fff',
    borderWidth: 2.5,
    borderColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow('#785900', 4, 14, 0.22, 6),
  },
  heroBadgeText: {
    fontWeight: '700',
    color: Colors.primaryDark,
    fontFamily: 'Baloo2_700Bold',
    textAlign: 'center',
  } as any,
});
