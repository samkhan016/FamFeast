import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {colors, spacing} from '../../theme/tokens';

type Props = {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  padded?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  children,
  header,
  footer,
  scroll = true,
  keyboard = false,
  padded = true,
  contentContainerStyle,
  style,
}: Props) {
  const body = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[padded ? styles.padded : null, contentContainerStyle]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padded ? styles.padded : null, contentContainerStyle]}>{children}</View>
  );

  return (
    <View style={[styles.screen, style]}>
      {header}
      <KeyboardAvoidingView
        enabled={keyboard}
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {body}
        {footer}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  fill: {
    flex: 1,
  },
  padded: {
    flexGrow: 1,
    padding: spacing.margin,
    gap: spacing.md,
    paddingBottom: 40,
  },
});
