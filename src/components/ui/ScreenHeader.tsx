import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BookmarkSimple,
  ShareNetwork,
  User,
} from 'phosphor-react-native';
import { colors, hitSlop, spacing } from '../../theme/tokens';
import { AppText } from './AppText';
import { FamFeastLogo } from './FamFeastLogo';
import { useAppStore } from '../../store/useAppStore';
import { getShareLink } from '../../services';
import Clipboard from '@react-native-clipboard/clipboard';

type Props = {
  subtitle: string;
  onProfile?: () => void;
  onBack?: () => void;
  onBookmark?: () => void;
  bookmarked?: boolean;
  hideShare?: boolean;
};

export function ScreenHeader({
  subtitle,
  onProfile,
  onBack,
  onBookmark,
  bookmarked,
  hideShare,
}: Props) {
  const insets = useSafeAreaInsets();
  const household = useAppStore(state => state.snapshot.household);
  const showToast = useAppStore(state => state.showToast);
  const householdLabel = household.name ?? '';

  const share = () => {
    Clipboard.setString(getShareLink());
    showToast(
      `Link copied: ${getShareLink().replace('https://', '')}`,
      'success',
    );
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={hitSlop}
            style={styles.back}
          >
            <ArrowLeft size={24} color={colors.onSurfaceVariant} />
          </Pressable>
        ) : null}
        <FamFeastLogo size={onBack ? 36 : 40} />
        <View style={styles.titles}>
          <View style={styles.brandRow}>
            {householdLabel ? (
              <AppText
                variant="headlineMd"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={styles.brand}
              >
                {householdLabel}
              </AppText>
            ) : null}
          </View>
          <AppText
            variant="labelSm"
            color={colors.onSurfaceVariant}
            numberOfLines={1}
          >
            {subtitle}
          </AppText>
        </View>
        <View style={styles.actions}>
          {onBookmark ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Bookmark recipe"
              onPress={onBookmark}
              hitSlop={hitSlop}
              style={styles.share}
            >
              <BookmarkSimple
                size={20}
                color={bookmarked ? colors.primary : colors.onSurfaceVariant}
                weight={bookmarked ? 'fill' : 'regular'}
              />
            </Pressable>
          ) : hideShare ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share weekly plan"
              onPress={share}
              hitSlop={hitSlop}
              style={styles.share}
            >
              <ShareNetwork size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          )}
          {onProfile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Household profile"
              onPress={onProfile}
              hitSlop={hitSlop}
              style={styles.person}
            >
              <User size={18} color={colors.onPrimary} weight="fill" />
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(248,249,255,0.94)',
    paddingHorizontal: spacing.margin,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    zIndex: 2,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  back: {
    width: 44,
    height: 44,
    marginLeft: -6,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  brand: {
    lineHeight: 24,
    flexShrink: 1,
    minWidth: 0,
  },
  pill: {
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '58%',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  share: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  person: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
