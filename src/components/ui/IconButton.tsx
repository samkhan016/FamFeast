import {Platform, Pressable, StyleSheet} from 'react-native';
import {colors, radii} from '../../theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  children: React.ReactNode;
  background?: string;
};

export function IconButton({label, onPress, children, background = colors.surfaceContainer}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({pressed}) => [
        styles.btn,
        {backgroundColor: background, minWidth: Platform.OS === 'ios' ? 44 : 48, minHeight: Platform.OS === 'ios' ? 44 : 48},
        pressed && styles.pressed,
      ]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    transform: [{scale: 0.94}],
  },
});
