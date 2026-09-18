import {useEffect} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {colors} from '../../theme/tokens';

type Props = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
};

const TIMING = {duration: 140, easing: Easing.out(Easing.cubic)};

export function AppSwitch({value, onValueChange, label, size = 'md', disabled = false}: Props) {
  const track = size === 'sm' ? {width: 44, height: 24} : {width: 56, height: 32};
  const knob = size === 'sm' ? 20 : 24;
  const travel = size === 'sm' ? 20 : 26;

  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, TIMING);
  }, [value, progress]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{translateX: interpolate(progress.value, [0, 1], [2, travel])}],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.surfaceHighest, colors.primary]),
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{checked: value, disabled}}
      hitSlop={8}
      onPress={() => {
        const next = !value;
        if (!disabled) {
          progress.value = withTiming(next ? 1 : 0, TIMING);
        }
        onValueChange(next);
      }}
      style={styles.hit}>
      <Animated.View style={[styles.track, track, trackStyle]}>
        <Animated.View style={[styles.knob, {width: knob, height: knob, borderRadius: knob / 2}, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  track: {
    borderRadius: 999,
    justifyContent: 'center',
  },
  knob: {
    backgroundColor: colors.surfaceLowest,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});
