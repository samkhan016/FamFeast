import {ActivityIndicator, Pressable, type PressableProps, StyleSheet, View} from 'react-native';
import {colors, radii} from '../../theme/tokens';
import {AppText} from './AppText';

type Variant = 'primary' | 'secondary' | 'ghost' | 'tint';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  icon?: React.ReactNode;
};

export function AppButton({
  label,
  variant = 'primary',
  loading,
  icon,
  disabled,
  style,
  ...rest
}: Props) {
  const palette = stylesByVariant[variant];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({pressed}) => [
        styles.base,
        palette.box,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={palette.color} />
      ) : (
        <View style={styles.row}>
          {icon}
          <AppText variant="labelLg" color={palette.color} numberOfLines={2} align="center">
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: '100%',
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.5,
  },
});

const stylesByVariant: Record<Variant, {box: object; color: string}> = {
  primary: {
    box: {backgroundColor: colors.primary},
    color: colors.onPrimary,
  },
  secondary: {
    box: {backgroundColor: colors.secondary},
    color: colors.onSecondary,
  },
  ghost: {
    box: {backgroundColor: 'transparent'},
    color: colors.slate,
  },
  tint: {
    box: {
      backgroundColor: colors.cream,
      borderWidth: 1.5,
      borderColor: '#FED7AA',
    },
    color: colors.primary,
  },
};
