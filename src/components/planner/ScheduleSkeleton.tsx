import {StyleSheet, View} from 'react-native';
import {Shimmer} from '../ui/Shimmer';
import {spacing} from '../../theme/tokens';

export function ScheduleSkeleton() {
  return (
    <View style={styles.wrap} accessibilityState={{busy: true}} accessibilityLabel="Loading weekly plan">
      <Shimmer height={132} radius={24} />
      <Shimmer height={64} radius={16} />
      <Shimmer height={88} radius={24} />
      <View style={styles.days}>
        {Array.from({length: 7}).map((_, index) => (
          <Shimmer key={index} height={64} radius={16} style={styles.day} />
        ))}
      </View>
      <Shimmer height={220} radius={24} />
      <Shimmer height={88} radius={24} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    paddingHorizontal: spacing.margin,
    paddingTop: spacing.md,
  },
  days: {
    flexDirection: 'row',
    gap: 6,
  },
  day: {
    flex: 1,
  },
});
