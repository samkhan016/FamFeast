import {Pressable, StyleSheet, View} from 'react-native';
import {colors, radii} from '../../theme/tokens';
import {AppText} from './AppText';

type Tone = 'neutral' | 'primary' | 'secondary' | 'tertiary' | 'danger' | 'high';

type Props = {
  label: string;
  selected?: boolean;
  tone?: Tone;
  onPress?: () => void;
  leading?: React.ReactNode;
};

export function Chip({label, selected, tone = 'neutral', onPress, leading}: Props) {
  const palette = tones[selected ? 'primary' : tone];
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      hitSlop={4}
      style={({pressed}) => [
        styles.chip,
        {backgroundColor: palette.bg},
        pressed && onPress ? styles.pressed : null,
      ]}>
      <View style={styles.row}>
        {leading}
        <AppText variant="labelSm" color={palette.fg} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  pressed: {
    opacity: 0.88,
  },
});

const tones: Record<Tone, {bg: string; fg: string}> = {
  neutral: {bg: colors.surfaceContainer, fg: colors.onSurface},
  primary: {bg: colors.primary, fg: colors.onPrimary},
  secondary: {bg: colors.secondaryContainer, fg: colors.onSecondaryContainer},
  tertiary: {bg: colors.tertiaryFixed, fg: colors.onTertiaryFixed},
  danger: {bg: colors.errorContainer, fg: colors.onErrorContainer},
  high: {bg: colors.surfaceHigh, fg: colors.onSurfaceVariant},
};
