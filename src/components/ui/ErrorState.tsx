import {StyleSheet, View} from 'react-native';
import {Warning} from 'phosphor-react-native';
import {colors, spacing} from '../../theme/tokens';
import {AppText} from './AppText';
import {AppButton} from './AppButton';

type Props = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({message = 'Something went sideways in the kitchen.', onRetry}: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Warning size={28} color={colors.error} />
      </View>
      <AppText variant="headlineMd" align="center">
        Couldn’t load this just now
      </AppText>
      <AppText variant="bodySm" color={colors.onSurfaceVariant} align="center" style={styles.body}>
        {message}
      </AppText>
      {onRetry ? (
        <View style={styles.action}>
          <AppButton label="Try again" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.errorContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  body: {
    maxWidth: 280,
  },
  action: {
    marginTop: 8,
    alignSelf: 'stretch',
    maxWidth: 280,
  },
});
