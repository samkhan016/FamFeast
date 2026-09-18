import {Image, StyleSheet, View, type ImageStyle, type StyleProp} from 'react-native';
import {colors, radii} from '../../theme/tokens';

type Props = {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  label?: string;
};

export function CachedImage({uri, style, label}: Props) {
  if (!uri) {
    return <View style={[styles.fallback, style]} />;
  }
  return (
    <Image
      source={{uri}}
      accessibilityLabel={label}
      resizeMode="cover"
      style={[styles.image, style]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
  },
  fallback: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
});
