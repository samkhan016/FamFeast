import {Platform, StyleSheet, Text, type TextProps, type TextStyle} from 'react-native';
import {colors, typography} from '../../theme/tokens';

type Variant = keyof typeof typography;

type Props = TextProps & {
  variant?: Variant;
  color?: string;
  align?: TextStyle['textAlign'];
  shrink?: boolean;
};

export function AppText({
  variant = 'bodyMd',
  color = colors.onSurface,
  align,
  shrink,
  style,
  children,
  ...rest
}: Props) {
  const shouldShrink = shrink ?? rest.numberOfLines != null;
  return (
    <Text
      style={[
        typography[variant],
        Platform.OS === 'android' ? styles.android : null,
        {color, textAlign: align},
        shouldShrink ? styles.shrink : null,
        style,
      ]}
      {...rest}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  android: {
    includeFontPadding: false,
  },
  shrink: {
    flexShrink: 1,
    minWidth: 0,
  },
});
