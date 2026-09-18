import {useEffect} from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import {colors, radii} from '../../theme/tokens';
import {useReducedMotion} from '../../hooks/useReducedMotion';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export function Shimmer({width = '100%', height = 16, radius = radii.md, style}: Props) {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    if (reduced) {
      opacity.value = 0.6;
      return;
    }
    opacity.value = withRepeat(withTiming(1, {duration: 900}), -1, true);
  }, [opacity, reduced]);

  const animated = useAnimatedStyle(() => ({opacity: opacity.value}));

  return (
    <Animated.View
      style={[
        styles.block,
        {width, height, borderRadius: radius},
        animated,
        style,
      ]}
    />
  );
}

export function ShimmerBlock({children}: {children: React.ReactNode}) {
  return <View style={styles.stack}>{children}</View>;
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surfaceHigh,
  },
  stack: {
    gap: 12,
  },
});
