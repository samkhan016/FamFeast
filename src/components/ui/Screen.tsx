import {KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
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

const scrollProps = {
  keyboardShouldPersistTaps: 'handled' as const,
  keyboardDismissMode: 'on-drag' as const,
  showsVerticalScrollIndicator: false,
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
  const contentStyle = [padded ? styles.padded : null, contentContainerStyle];
  const body =
    scroll && keyboard ? (
      <KeyboardAwareScrollView
        style={styles.fill}
        enableOnAndroid
        extraScrollHeight={24}
        contentContainerStyle={contentStyle}
        {...scrollProps}>
        {children}
      </KeyboardAwareScrollView>
    ) : scroll ? (
      <ScrollView contentContainerStyle={contentStyle} {...scrollProps}>
        {children}
      </ScrollView>
    ) : (
      <View style={[styles.fill, padded ? styles.padded : null, contentContainerStyle]}>{children}</View>
    );

  return (
    <View style={[styles.screen, style]}>
      {header}
      {keyboard && scroll ? (
        <View style={styles.fill}>
          {body}
          {footer}
        </View>
      ) : (
        <KeyboardAvoidingView
          enabled={keyboard}
          style={styles.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {body}
          {footer}
        </KeyboardAvoidingView>
      )}
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
