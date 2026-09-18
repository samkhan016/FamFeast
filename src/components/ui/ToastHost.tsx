import {useEffect} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, radii, spacing} from '../../theme/tokens';
import {useAppStore} from '../../store/useAppStore';
import {AppText} from './AppText';

export function ToastHost() {
  const toast = useAppStore(state => state.toast);
  const hideToast = useAppStore(state => state.hideToast);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(hideToast, 3200);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) {
    return null;
  }

  const bg =
    toast.tone === 'error' ? colors.error : toast.tone === 'info' ? colors.tertiary : colors.secondary;

  return (
    <Pressable
      accessibilityRole="alert"
      onPress={hideToast}
      style={[styles.toast, {backgroundColor: bg, top: insets.top + 72}]}>
      <AppText variant="labelMd" color={colors.onPrimary} numberOfLines={4}>
        {toast.message}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.margin,
    right: spacing.margin,
    zIndex: 50,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
});
