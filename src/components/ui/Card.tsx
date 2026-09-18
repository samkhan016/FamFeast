import {StyleSheet, View, type ViewProps} from 'react-native';
import {colors, radii, shadows, spacing} from '../../theme/tokens';

type Props = ViewProps & {
  padded?: boolean;
  lifted?: boolean;
  radius?: 'xl' | '3xl';
};

export function Card({padded = true, lifted, radius = '3xl', style, children, ...rest}: Props) {
  return (
    <View
      style={[
        styles.card,
        radius === 'xl' ? styles.xl : styles.xxl,
        padded && styles.padded,
        lifted ? shadows.lifted : shadows.card,
        style,
      ]}
      {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceLowest,
  },
  xl: {
    borderRadius: radii.md,
  },
  xxl: {
    borderRadius: radii.card,
  },
  padded: {
    padding: spacing.md,
  },
});
