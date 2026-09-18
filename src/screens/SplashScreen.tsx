import { useEffect, useState } from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { fonts, radii, splash } from '../theme/tokens';
import { useCompactLayout } from '../theme/layout';
import { AppText } from '../components/ui/AppText';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useAppStore } from '../store/useAppStore';

const logo = require('../assets/images/famfeast-logo-splash.png');

const STATUS_MESSAGES = [
  'Stoking the hearth fire...',
  "Gathering tonight's recipe notes...",
  'Syncing the family pantry & meal plan...',
  'Setting the table...',
];

function kitchenLabel(name: string) {
  const base = name.replace(/\s+(Feast|Kitchen)$/i, '').trim();
  return base ? `${base} Kitchen` : '';
}

function HearthSpark({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d="M12 1.2L13.85 9.15 21.8 12 13.85 14.85 12 22.8 10.15 14.85 2.2 12 10.15 9.15Z"
        fill={color}
      />
    </Svg>
  );
}

function LoaderMark({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Path
        d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364-2.121-2.121M7.757 7.757 5.636 5.636m12.728 0-2.121 2.121M7.757 16.243l-2.121 2.121"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function SplashBackdrop({ width, height }: { width: number; height: number }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient
            id="hearthGlow"
            cx={width / 2}
            cy={height * 0.36}
            rx={width * 0.62}
            ry={height * 0.38}
          >
            <Stop offset="0%" stopColor="#FED7AA" stopOpacity={0.45} />
            <Stop offset="45%" stopColor="#FFEDD5" stopOpacity={0.25} />
            <Stop offset="75%" stopColor="#FFFDF9" stopOpacity={0} />
          </RadialGradient>
          <Pattern
            id="hearthDots"
            patternUnits="userSpaceOnUse"
            width={24}
            height={24}
          >
            <Circle cx={0.75} cy={0.75} r={0.75} fill={splash.pattern} />
          </Pattern>
        </Defs>
        <Rect width={width} height={height} fill="url(#hearthGlow)" />
        <Rect
          width={width}
          height={height}
          fill="url(#hearthDots)"
          opacity={0.045}
        />
      </Svg>
    </View>
  );
}

export function SplashScreen({ durationMs = 2200 }: { durationMs?: number }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { compact } = useCompactLayout();
  const reduced = useReducedMotion();
  const household = useAppStore(state => state.snapshot.household);
  const members = useAppStore(state => state.snapshot.members);
  const [statusIndex, setStatusIndex] = useState(0);
  const [percent, setPercent] = useState(12);
  const [trackWidth, setTrackWidth] = useState(280);

  const emblemScale = useSharedValue(1);
  const sparkLift = useSharedValue(0);
  const ping = useSharedValue(0);
  const spin = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const statusOpacity = useSharedValue(1);
  const progress = useSharedValue(0.12);

  const emblemSize = compact ? 188 : 224;
  const sparkPad = 16;
  const emblemFrame = emblemSize + sparkPad * 2;
  const kitchen = kitchenLabel(household.name);
  const memberCount = members.length;

  useEffect(() => {
    if (reduced) {
      emblemScale.value = 1;
      sparkLift.value = 0;
      ping.value = 0;
      spin.value = 0;
      shimmer.value = 0;
      progress.value = 1;
      setPercent(100);
      return;
    }

    emblemScale.value = withRepeat(
      withTiming(1.02, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    sparkLift.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    ping.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    spin.value = withRepeat(
      withTiming(360, { duration: 1100, easing: Easing.linear }),
      -1,
      false,
    );
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.linear }),
      -1,
      false,
    );
    progress.value = 0.08;
    progress.value = withTiming(1, {
      duration: Math.max(durationMs - 80, 1200),
      easing: Easing.linear,
    });
  }, [
    durationMs,
    emblemScale,
    ping,
    progress,
    reduced,
    shimmer,
    sparkLift,
    spin,
  ]);

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    const tick = setInterval(() => {
      if (!reduced) {
        statusOpacity.value = withTiming(0, { duration: 180 });
      }
      fadeTimer = setTimeout(
        () => {
          setStatusIndex(index => (index + 1) % STATUS_MESSAGES.length);
          if (!reduced) {
            statusOpacity.value = withTiming(1, { duration: 180 });
          }
        },
        reduced ? 0 : 180,
      );
    }, 900);

    return () => {
      clearInterval(tick);
      if (fadeTimer) {
        clearTimeout(fadeTimer);
      }
    };
  }, [reduced, statusOpacity]);

  useAnimatedReaction(
    () => Math.round(progress.value * 100),
    (now, previous) => {
      if (now !== previous) {
        runOnJS(setPercent)(now);
      }
    },
  );

  const emblemMotion = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : emblemScale.value }],
    opacity: reduced ? 1 : interpolate(emblemScale.value, [1, 1.02], [0.95, 1]),
  }));

  const sparkMotion = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: reduced ? 0 : interpolate(sparkLift.value, [0, 1], [-6, 0]),
      },
    ],
  }));

  const pingMotion = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(ping.value, [0, 1], [1, 2.35]) }],
    opacity: interpolate(ping.value, [0, 1], [0.75, 0]),
  }));

  const spinMotion = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  const shimmerMotion = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-72, trackWidth]) },
    ],
  }));

  const fillMotion = useAnimatedStyle(() => ({
    width: interpolate(
      progress.value,
      [0, 1],
      [Math.max(trackWidth * 0.08, 18), trackWidth],
    ),
  }));

  const statusMotion = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
  }));

  return (
    <View
      style={styles.screen}
      accessibilityRole="progressbar"
      accessibilityLabel="FamFeast is loading"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: percent,
        text: STATUS_MESSAGES[statusIndex],
      }}
    >
      <StatusBar barStyle="dark-content" />
      <SplashBackdrop width={width} height={height} />

      <View style={[styles.hero, { paddingTop: insets.top }]}>
        <View
          style={[
            styles.emblemWrap,
            { width: emblemFrame, height: emblemFrame },
          ]}
        >
          <LinearGradient
            colors={['rgba(251, 191, 36, 0.2)', 'rgba(249, 115, 22, 0.25)']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            pointerEvents="none"
            style={[
              styles.halo,
              {
                width: emblemSize * 1.18,
                height: emblemSize * 1.18,
                borderRadius: emblemSize,
                top: (emblemFrame - emblemSize * 1.18) / 2,
                left: (emblemFrame - emblemSize * 1.18) / 2,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.emblemGlow,
              {
                width: emblemSize,
                height: emblemSize,
                borderRadius: emblemSize / 2,
              },
              emblemMotion,
            ]}
          >
            <LinearGradient
              colors={[splash.ringFrom, splash.ringTo]}
              style={[styles.emblemRing, { borderRadius: emblemSize / 2 }]}
            >
              <View
                style={[
                  styles.emblemClip,
                  { borderRadius: (emblemSize - 12) / 2 },
                ]}
              >
                <Image
                  source={logo}
                  resizeMode="cover"
                  accessible={false}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  style={{
                    width: emblemSize - 12,
                    height: emblemSize - 12,
                    borderRadius: (emblemSize - 12) / 2,
                  }}
                />
              </View>
            </LinearGradient>
          </Animated.View>
          <Animated.View
            style={[
              styles.sparkTop,
              { top: sparkPad - 4, right: sparkPad + 20 },
              sparkMotion,
            ]}
          >
            <HearthSpark size={18} color={splash.spark} />
          </Animated.View>
          <View
            style={[
              styles.sparkBottom,
              { bottom: sparkPad + 24, left: sparkPad - 8 },
            ]}
          >
            <HearthSpark size={12} color={splash.sparkSoft} />
          </View>
        </View>

        <View style={styles.copy}>
          <AppText
            variant="headlineXl"
            align="center"
            color={splash.title}
            style={styles.title}
            accessibilityRole="header"
          >
            FamFeast
          </AppText>
          <AppText
            variant="bodySm"
            align="center"
            color={splash.motto}
            style={styles.motto}
          >
            Wholesome Meals, Together as Family
          </AppText>
        </View>

        {kitchen ? (
          <View style={styles.pill}>
            <View style={styles.liveDot}>
              {reduced ? null : (
                <Animated.View style={[styles.livePing, pingMotion]} />
              )}
              <View style={styles.liveCore} />
            </View>
            <AppText
              variant="labelSm"
              color={splash.pillText}
              style={styles.pillText}
              numberOfLines={1}
            >
              {kitchen}
              <AppText variant="labelSm" style={styles.pillDot}>
                {' '}
                •{' '}
              </AppText>
              {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
            </AppText>
          </View>
        ) : null}
      </View>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 28) }]}
      >
        <View style={styles.loader}>
          <View
            style={styles.track}
            accessibilityElementsHidden
            onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}
          >
            <Animated.View
              style={[styles.fill, fillMotion]}
              collapsable={false}
            >
              <LinearGradient
                colors={[splash.amber, splash.ember, splash.amberDeep]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              {reduced ? null : (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.shimmer, shimmerMotion]}
                >
                  <LinearGradient
                    colors={[
                      'rgba(255,255,255,0)',
                      'rgba(255,255,255,0.55)',
                      'rgba(255,255,255,0)',
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              )}
            </Animated.View>
          </View>
          <View style={styles.statusRow}>
            <Animated.View
              style={[styles.spinner, spinMotion]}
              collapsable={false}
            >
              <LoaderMark size={14} color={splash.ember} />
            </Animated.View>
            <Animated.View
              style={[styles.statusWrap, statusMotion]}
              collapsable={false}
            >
              <AppText
                variant="labelMd"
                color={splash.status}
                accessibilityLiveRegion="polite"
                style={styles.status}
              >
                {STATUS_MESSAGES[statusIndex]}
              </AppText>
            </Animated.View>
          </View>
        </View>

        <View style={styles.craft}>
          <AppText
            variant="labelSm"
            align="center"
            color={splash.mutedSoft}
            style={styles.craftMeta}
          >
            v1.0 • Crafted for Family Kitchens
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: splash.canvas,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: -16,
  },
  emblemWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  spinner: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    opacity: 0.9,
  },
  emblemGlow: {
    shadowColor: splash.glow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 12,
  },
  emblemRing: {
    width: '100%',
    height: '100%',
    padding: 6,
    borderWidth: 1,
    borderColor: splash.ringBorder,
  },
  emblemClip: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkTop: {
    position: 'absolute',
    opacity: 0.8,
  },
  sparkBottom: {
    position: 'absolute',
    opacity: 0.7,
  },
  copy: {
    maxWidth: 310,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.9,
  },
  motto: {
    fontFamily: fonts.medium,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  pill: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: splash.pillFill,
    borderWidth: 1,
    borderColor: splash.pillBorder,
    maxWidth: '100%',
  },
  liveDot: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: splash.sparkSoft,
  },
  liveCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: splash.ember,
  },
  pillText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  pillDot: {
    color: splash.sparkSoft,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  loader: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    gap: 10,
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: splash.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 72,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 16,
  },
  statusWrap: {
    flexShrink: 1,
  },
  status: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  craft: {
    width: '100%',
    maxWidth: 240,
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: splash.divider,
  },
  craftKicker: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.28,
    textTransform: 'uppercase',
  },
  craftMeta: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0,
    fontWeight: '400',
    marginTop: 2,
  },
});
