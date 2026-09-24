import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  ChatCircle,
  Heart,
  Scales,
  ThumbsDown,
  ThumbsUp,
  YoutubeLogo,
  Check,
  PaperPlaneTilt,
  PlusCircle,
  Clock,
} from 'phosphor-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { colors, radii, spacing } from '../theme/tokens';
import {
  AppText,
  CachedImage,
  Card,
  ScreenHeader,
  Shimmer,
} from '../components/ui';
import { EmptyState, ErrorState } from '../components/ui';
import {useSuggestionMutations, useSuggestions} from '../hooks/useFamFeast';
import { useAppStore } from '../store/useAppStore';
import type { TabProps } from '../app/navigation/types';

const QUICK = [
  { fill: 'Taco Tuesday Fiesta', label: 'Street Tacos' },
  { fill: 'Creamy Tomato Basil Gnocchi', label: 'Creamy Gnocchi' },
  { fill: 'Korean Bibimbap Bowls', label: 'Bibimbap' },
];

export function VotingScreen({ navigation }: TabProps<'Voting'>) {
  const query = useSuggestions();
  const snapshot = useAppStore(state => state.snapshot);
  const isOwner = useAppStore(state => state.isOwner());
  const mutations = useSuggestionMutations();
  const [draft, setDraft] = useState('');
  const suggestions = query.data ?? snapshot.suggestions;
  const votedCount = snapshot.members.filter(member =>
    suggestions.some(
      item =>
        item.upVoterIds.includes(member.id) ||
        item.downVoterIds.includes(member.id),
    ),
  ).length;

  if (query.isLoading && !suggestions.length) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          subtitle="Voting"
          onProfile={() => navigation.navigate('HouseholdShare')}
        />
        <View style={styles.content} accessibilityState={{ busy: true }}>
          <Shimmer height={120} radius={12} />
          <Shimmer height={88} radius={12} />
          <Shimmer height={160} radius={12} />
        </View>
      </View>
    );
  }

  if (query.isError && !suggestions.length) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          subtitle="Voting"
          onProfile={() => navigation.navigate('HouseholdShare')}
        />
        <ErrorState onRetry={() => query.refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        subtitle="Voting"
        onProfile={() => navigation.navigate('HouseholdShare')}
      />
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        enableOnAndroid
        extraScrollHeight={24}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
          <LinearGradient
            colors={[colors.primaryFixed, colors.surfaceHigh]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ballot}
          >
            <View style={[styles.rowBetween, styles.wrap]}>
              <View style={styles.flex}>
                <View style={[styles.row, styles.wrap]}>
                  <AppText
                    variant="headlineMd"
                    numberOfLines={1}
                    style={styles.flex}
                  >
                    Week {snapshot.plan.weekId.split('-W')[1] ?? '43'} Ballot
                  </AppText>
                </View>
                <View style={[styles.row, { marginTop: 4 }]}>
                  <Clock size={14} color={colors.tertiary} />
                  <AppText
                    variant="labelSm"
                    color={colors.onSurfaceVariant}
                    numberOfLines={1}
                  >
                    Closes Saturday, 6:00 PM
                  </AppText>
                </View>
              </View>
              <View style={styles.votedPill}>
                <View style={styles.liveDot} />
                <AppText
                  variant="labelSm"
                  color={colors.secondary}
                  style={styles.bold}
                  numberOfLines={1}
                >
                  {votedCount}/{snapshot.members.length || 0} Voted
                </AppText>
              </View>
            </View>
            <View style={[styles.voterRow, styles.wrap]}>
              <View style={styles.avatarStack}>
                {snapshot.members.map((member, index) => (
                  <View
                    key={member.id}
                    style={[styles.voter, { marginLeft: index === 0 ? 0 : -6 }]}
                  >
                    <View style={styles.voterFace}>
                      <AppText>{member.avatarInitial}</AppText>
                    </View>
                    <View style={styles.voterCheck}>
                      <AppText style={styles.checkMark}>✓</AppText>
                    </View>
                  </View>
                ))}
              </View>
              <AppText
                variant="labelSm"
                color={colors.onSurfaceVariant}
                style={styles.medium}
              >
                All household opinions locked in!
              </AppText>
            </View>
          </LinearGradient>

          <Card radius="xl">
            <View style={[styles.row, styles.wrap]}>
              <PlusCircle size={20} color={colors.primary} />
              <AppText variant="labelLg" numberOfLines={1} style={styles.flex}>
                Drop a Dish or YouTube Link
              </AppText>
            </View>
            <View style={styles.inputWrap}>
              <YoutubeLogo
                size={20}
                color={colors.outline}
                style={styles.inputIcon}
              />
              <TextInput
                accessibilityLabel="Dish name or YouTube link"
                value={draft}
                onChangeText={setDraft}
                placeholder="Paste a YouTube recipe link or dish name..."
                placeholderTextColor={colors.outline}
                style={styles.input}
              />
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  if (!draft.trim()) {
                    return;
                  }
                  await mutations.submit({ title: draft });
                  setDraft('');
                }}
                style={styles.toss}
              >
                <AppText variant="labelSm" color={colors.onPrimary}>
                  Toss In
                </AppText>
                <PaperPlaneTilt size={16} color={colors.onPrimary} />
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickRow}
            >
              <AppText variant="labelSm" color={colors.outline}>
                Quick picks:
              </AppText>
              {QUICK.map(item => (
                <Pressable
                  key={item.label}
                  onPress={() => setDraft(item.fill)}
                  style={styles.quickChip}
                >
                  <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                    {item.label}
                  </AppText>
                </Pressable>
              ))}
            </ScrollView>
          </Card>

          {suggestions.length === 0 ? (
            <EmptyState
              title="No suggestions yet"
              body="Kids, grandparents, and guests can toss in ideas here."
            />
          ) : (
            suggestions.map((item, index) => {
              const author = snapshot.members.find(
                member => member.id === item.authorId,
              );
              const top = index === 0 && item.status !== 'accepted';
              const unanimous = item.status === 'accepted';
              const split =
                item.upVoterIds.length === item.downVoterIds.length &&
                item.downVoterIds.length > 0;
              return (
                <Card key={item.id} radius="xl" style={styles.voteCard}>
                  <View style={styles.dishRow}>
                    <View>
                      <CachedImage
                        uri={item.thumbnail}
                        style={styles.thumb}
                        label={item.title}
                      />
                      <View style={styles.thumbBadge}>
                        <AppText style={styles.thumbBadgeText}>
                          {item.youtubeUrl
                            ? 'Babish'
                            : item.note?.includes('track')
                            ? "Dad's Fav"
                            : '25m'}
                        </AppText>
                      </View>
                    </View>
                    <View style={styles.flex}>
                      <View style={[styles.rowBetween, styles.wrap]}>
                        <AppText
                          variant="headlineMd"
                          style={styles.flex}
                          numberOfLines={2}
                        >
                          {item.title}
                        </AppText>
                        <View
                          style={[
                            styles.statusPill,
                            unanimous
                              ? styles.statusGreen
                              : split
                              ? styles.statusHigh
                              : top
                              ? styles.statusTop
                              : styles.statusNew,
                          ]}
                        >
                          <AppText
                            style={styles.statusText}
                            color={
                              unanimous
                                ? colors.onTertiaryFixed
                                : split
                                ? colors.onSurfaceVariant
                                : colors.onSecondaryFixedVariant
                            }
                            numberOfLines={1}
                          >
                            {unanimous
                              ? 'Unanimous'
                              : split
                              ? 'Split tie'
                              : top
                              ? 'Top contender'
                              : 'New idea'}
                          </AppText>
                        </View>
                      </View>
                      <View style={styles.row}>
                        <AppText
                          variant="labelSm"
                          color={colors.onSurfaceVariant}
                        >
                          Suggested by{' '}
                          <AppText variant="labelSm" style={styles.bold}>
                            {author?.name ?? 'Family'}
                          </AppText>
                        </AppText>
                      </View>
                      {item.youtubeUrl ? (
                        <View style={styles.ytLink}>
                          <YoutubeLogo size={14} color={colors.primary} />
                          <AppText
                            variant="labelSm"
                            color={colors.primary}
                            numberOfLines={1}
                          >
                            Binging with Babish: Detroit Pizza
                          </AppText>
                        </View>
                      ) : item.note ? (
                        split ? (
                          <View style={styles.comment}>
                            <ChatCircle
                              size={14}
                              color={colors.onErrorContainer}
                            />
                            <AppText
                              variant="labelSm"
                              color={colors.onErrorContainer}
                              numberOfLines={1}
                            >
                              {item.note}
                            </AppText>
                          </View>
                        ) : (
                          <AppText
                            variant="bodySm"
                            color={colors.onSurfaceVariant}
                            style={styles.italic}
                          >
                            “{item.note}”
                          </AppText>
                        )
                      ) : null}
                    </View>
                  </View>
                  <View
                    style={[
                      styles.voteBar,
                      unanimous && styles.voteBarWin,
                      split && styles.voteBarSplit,
                    ]}
                  >
                    <View style={[styles.row, styles.flex]}>
                      {unanimous ? (
                        <Heart size={18} color={colors.secondary} />
                      ) : split ? (
                        <Scales size={18} color={colors.tertiary} />
                      ) : (
                        <Check size={18} color={colors.secondary} />
                      )}
                      <AppText
                        variant="labelSm"
                        color={
                          unanimous
                            ? colors.secondary
                            : top
                            ? colors.secondary
                            : colors.onSurfaceVariant
                        }
                        style={unanimous || top ? styles.semibold : undefined}
                        numberOfLines={2}
                      >
                        {unanimous
                          ? '4 out of 4 Votes! Locked in Wed.'
                          : split
                          ? 'Requires family tiebreaker'
                          : 'Leading for Friday Dinner!'}
                      </AppText>
                    </View>
                    <View style={[styles.row, { flexShrink: 0 }]}>
                      <Pressable
                        onPress={() => mutations.vote(item.id, 'up')}
                        style={styles.vote}
                        accessibilityLabel="Vote up"
                      >
                        <ThumbsUp
                          size={18}
                          color={split ? colors.onSurface : colors.secondary}
                          weight={unanimous ? 'fill' : 'regular'}
                        />
                        <AppText
                          variant="labelMd"
                          color={split ? colors.onSurface : colors.secondary}
                          style={styles.bold}
                        >
                          {item.upVoterIds.length}
                        </AppText>
                      </Pressable>
                      <Pressable
                        onPress={() => mutations.vote(item.id, 'down')}
                        style={[styles.vote, unanimous && { opacity: 0.6 }]}
                        accessibilityLabel="Vote down"
                      >
                        <ThumbsDown
                          size={18}
                          color={
                            split
                              ? colors.error
                              : unanimous
                              ? colors.outline
                              : colors.onSurfaceVariant
                          }
                        />
                        <AppText
                          variant="labelMd"
                          color={
                            split
                              ? colors.error
                              : unanimous
                              ? colors.outline
                              : colors.onSurface
                          }
                          style={styles.bold}
                        >
                          {item.downVoterIds.length}
                        </AppText>
                      </Pressable>
                    </View>
                  </View>
                  {item.status === 'open' && isOwner ? (
                    <View style={[styles.row, {gap: 8, marginTop: 8}]}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => mutations.decide(item.id, 'accepted')}
                        style={[styles.toss, {flex: 1}]}>
                        <AppText variant="labelSm" color={colors.onPrimary}>
                          Accept
                        </AppText>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => mutations.decide(item.id, 'rejected')}
                        style={[styles.vote, {flex: 1}]}>
                        <AppText variant="labelSm" color={colors.onSurface}>
                          Decline
                        </AppText>
                      </Pressable>
                    </View>
                  ) : item.status === 'open' ? (
                    <AppText variant="labelSm" color={colors.onSurfaceVariant} style={{marginTop: 8}}>
                      Waiting for the household owner
                    </AppText>
                  ) : null}
                </Card>
              );
            })
          )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.margin, gap: spacing.md, paddingBottom: 120 },
  ballot: {
    borderRadius: radii.md,
    padding: spacing.md,
  },
  votedPill: {
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  wrap: { flexWrap: 'wrap' },
  ballotEmoji: { fontSize: 20 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  bold: { fontFamily: 'PlusJakartaSans-Bold' },
  semibold: { fontFamily: 'PlusJakartaSans-SemiBold' },
  medium: { fontFamily: 'PlusJakartaSans-Medium' },
  voterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 8,
    flexWrap: 'wrap',
  },
  avatarStack: { flexDirection: 'row' },
  voter: { position: 'relative' },
  voterFace: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voterCheck: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: colors.onSecondary,
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  inputWrap: { marginTop: 8, position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 12, zIndex: 1 },
  input: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceLow,
    paddingLeft: 40,
    paddingRight: 104,
    paddingVertical: 12,
    color: colors.onSurface,
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 14,
  },
  toss: {
    position: 'absolute',
    right: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickRow: { gap: 8, paddingTop: 8, alignItems: 'center' },
  quickChip: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  voteCard: { overflow: 'hidden' },
  dishRow: { flexDirection: 'row', gap: 8, minWidth: 0 },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  thumbBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(217,227,246,0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thumbBadgeText: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.onSurface,
  },
  flex: { flex: 1, minWidth: 0 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    flexShrink: 1,
    maxWidth: '100%',
  },
  statusTop: { backgroundColor: colors.secondaryFixed },
  statusGreen: { backgroundColor: colors.tertiaryFixed },
  statusHigh: { backgroundColor: colors.surfaceHigh },
  statusNew: { backgroundColor: colors.primaryFixed },
  statusText: { fontSize: 10, fontFamily: 'PlusJakartaSans-Bold' },
  miniEmoji: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  comment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,218,214,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  italic: { fontStyle: 'italic', marginTop: 4 },
  voteBar: {
    marginTop: 12,
    backgroundColor: colors.surfaceLow,
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  voteBarWin: { backgroundColor: 'rgba(124,249,148,0.4)' },
  voteBarSplit: { backgroundColor: colors.surfaceContainer },
  vote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  radarIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarBox: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  histItem: { alignItems: 'center', gap: 2 },
  histDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  histOut: { backgroundColor: colors.primary },
  histHome: { backgroundColor: colors.surfaceHigh },
  tiny: { fontSize: 10, fontFamily: 'PlusJakartaSans-SemiBold' },
  takeoutBtns: { gap: 8, marginTop: 12 },
  takeoutYes: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  takeoutNo: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  takeoutResult: { marginTop: 12, padding: 12, borderRadius: 12 },
  takeoutYesResult: { backgroundColor: colors.secondaryContainer },
  takeoutNoResult: { backgroundColor: colors.surfaceContainer },
  engageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginTop: 10,
  },
  engageCard: {
    width: '48.5%',
    backgroundColor: colors.surfaceLow,
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  engageFace: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
