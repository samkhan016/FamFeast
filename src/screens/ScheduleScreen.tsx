import {memo, useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {ArrowRight, Check, CheckCircle, DiceFive, ForkKnife, Lightning, LinkSimple, Package, PersonSimpleRun, SlidersHorizontal, Star, YoutubeLogo} from 'phosphor-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {colors, radii, spacing} from '../theme/tokens';
import {WEEKLY_THEMES} from '../theme/weeklyThemes';
import {AppSwitch, AppText, CachedImage, Card, ScreenHeader} from '../components/ui';
import {DaySelector} from '../components/planner/DaySelector';
import {ScheduleSkeleton} from '../components/planner/ScheduleSkeleton';
import {EmptyState, ErrorState} from '../components/ui';
import {usePlanMutations, useRecipes, useWeeklyPlan} from '../hooks/useFamFeast';
import {useAppStore} from '../store/useAppStore';
import {formatWeekRange, addDaysISO, weekdayName} from '../utils/dates';
import {getShareLink} from '../services';
import type {MealSlot, Recipe} from '../domain/types';
import type {TabProps} from '../app/navigation/types';

export function ScheduleScreen({navigation}: TabProps<'Schedule'>) {
  const planQuery = useWeeklyPlan();
  const recipesQuery = useRecipes();
  const selectedDate = useAppStore(state => state.selectedDate);
  const setSelectedDate = useAppStore(state => state.setSelectedDate);
  const snapshot = useAppStore(state => state.snapshot);
  const canEdit = useAppStore(state => state.canEdit());
  const showToast = useAppStore(state => state.showToast);
  const mutations = usePlanMutations();

  const plan = planQuery.data ?? snapshot.plan;
  const recipes = recipesQuery.data ?? snapshot.recipes;
  const theme = WEEKLY_THEMES[plan.theme];
  const dates = useMemo(() => [...new Set(plan.slots.map(slot => slot.date))], [plan.slots]);
  const daySlots = plan.slots.filter(slot => slot.date === selectedDate);
  const dinner = daySlots.find(slot => slot.mealType === 'dinner');
  const lunch = daySlots.find(slot => slot.mealType === 'lunch');
  const breakfast = daySlots.find(slot => slot.mealType === 'breakfast');
  const plannedOut = dinner?.status === 'eatingOut';
  const [optimisticOut, setOptimisticOut] = useState<boolean | null>(null);
  const eatingOut = optimisticOut ?? plannedOut;

  useEffect(() => {
    setOptimisticOut(null);
  }, [selectedDate]);

  useEffect(() => {
    if (optimisticOut !== null && plannedOut === optimisticOut) {
      setOptimisticOut(null);
    }
  }, [plannedOut, optimisticOut]);

  const recipeMap = useMemo(() => Object.fromEntries(recipes.map(recipe => [recipe.id, recipe])), [recipes]);
  const plannedCount = daySlots.filter(slot => slot.recipeId).length;
  const weekNum = plan.weekId.split('-W')[1] ?? '';

  const share = () => {
    Clipboard.setString(getShareLink());
    showToast(`Link copied: ${getShareLink().replace('https://', '')}`, 'success');
  };

  const togglePlans = async () => {
    if (!canEdit) {
      showToast('Ask a household editor to change tonight’s plan.', 'info');
      return;
    }
    const next = !eatingOut;
    setOptimisticOut(next);
    try {
      if (next) {
        const moveTo = selectedDate === plan.endDate ? addDaysISO(selectedDate, -1) : addDaysISO(selectedDate, 2);
        await mutations.markEatingOut(selectedDate, moveTo);
      } else {
        await mutations.restoreHomeCook(selectedDate);
      }
    } catch {
      setOptimisticOut(null);
    }
  };

  if (planQuery.isLoading && !planQuery.data) {
    return (
      <View style={styles.screen}>
        <ScreenHeader subtitle="Schedule" onProfile={() => navigation.navigate('HouseholdShare')} />
        <ScheduleSkeleton />
      </View>
    );
  }

  if (planQuery.isError && !plan) {
    return (
      <View style={styles.screen}>
        <ScreenHeader subtitle="Schedule" onProfile={() => navigation.navigate('HouseholdShare')} />
        <ErrorState message={planQuery.error.message} onRetry={() => planQuery.refetch()} />
      </View>
    );
  }

  const bannerColors = theme.bannerVia
    ? [theme.bannerFrom, theme.bannerVia, theme.bannerTo]
    : [theme.bannerFrom, theme.bannerTo];

  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="Schedule" onProfile={() => navigation.navigate('HouseholdShare')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={bannerColors} start={{x: 0, y: 0.5}} end={{x: 1, y: 0.5}} style={styles.banner}>
          <View pointerEvents="none" style={styles.confetti}>
            <View style={[styles.spark, {top: 16, left: 24, width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff'}]} />
            <View style={[styles.spark, {top: 12, left: 74, width: 6, height: 6, backgroundColor: colors.primaryFixedDim, transform: [{rotate: '25deg'}]}]} />
            <View style={[styles.spark, {top: 28, left: 150, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondaryFixed}]} />
            <View style={[styles.spark, {top: 18, right: 80, width: 7, height: 4, backgroundColor: colors.tertiaryFixed}]} />
            <View style={[styles.spark, {bottom: 22, left: 110, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primaryFixedDim}]} />
          </View>
          <View style={styles.bannerTop}>
            <View style={styles.partyPill}>
              <AppText variant="labelSm" color={colors.onPrimary} numberOfLines={1}>
                🎉  {theme.label} Mode
              </AppText>
            </View>
            <AppText variant="labelSm" color={colors.primaryFixedDim} style={styles.weekCaps} numberOfLines={1}>
              WEEK {weekNum}
            </AppText>
          </View>
          <View style={styles.bannerBottom}>
            <View style={styles.flex}>
              <AppText variant="headlineLg" color={colors.onPrimary} style={styles.bannerTitle} numberOfLines={2}>
                {theme.id === 'party' ? `${weekdayName(selectedDate)} Fiesta! 🌮🎉` : `${weekdayName(selectedDate)} feast`}
              </AppText>
              <AppText variant="bodySm" color={colors.primaryFixed} numberOfLines={2}>
                {theme.tagline}
              </AppText>
            </View>
            <Pressable onPress={share} style={styles.shareBtn} accessibilityRole="button" accessibilityLabel="Share weekly plan link">
              <LinkSimple size={18} color={colors.primary} />
              <AppText variant="labelMd" color={colors.primary} style={styles.shareLabel} numberOfLines={1}>
                Share Link
              </AppText>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.energy}>
          <View style={styles.energyIcon}>
            <Lightning size={22} color={colors.onTertiary} weight="fill" />
          </View>
          <View style={styles.flex}>
            <View style={styles.energyMeta}>
              <AppText variant="labelSm" color={colors.tertiary} style={styles.energyCaps}>
                Family Energy Gauge
              </AppText>
              <View style={styles.energyDot} />
              <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                4:30 PM Check-in
              </AppText>
            </View>
            <AppText variant="bodySm" style={styles.energyCopy} numberOfLines={3}>
              {plan.energyLabel}
            </AppText>
          </View>
        </View>

        <Card>
          <View style={styles.rowBetween}>
            <View style={[styles.row, styles.flex, styles.nowrap]}>
              <View style={styles.runIcon}>
                <PersonSimpleRun size={22} color={colors.primary} />
              </View>
              <View style={styles.flex}>
                <AppText variant="headlineMd" numberOfLines={2}>
                  Sudden change of plans tonight?
                </AppText>
                <AppText variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={2}>
                  Quick toggle adapts meals & rescues pantry prep
                </AppText>
              </View>
            </View>
            <View style={styles.shrink}>
              <AppSwitch
                value={eatingOut}
                disabled={!canEdit}
                onValueChange={() => togglePlans()}
                label="Eating out tonight"
              />
            </View>
          </View>
          {eatingOut ? (
            <View style={styles.takeout}>
              <View style={[styles.row, styles.wrap]}>
                <View style={styles.habitPill}>
                  <AppText variant="labelSm" color={colors.onPrimaryFixed} numberOfLines={1}>
                    Habit Pattern Detected
                  </AppText>
                </View>
                <AppText variant="labelSm" color={colors.onSurfaceVariant} numberOfLines={2} style={styles.flex}>
                  2nd Thursday eating out this month
                </AppText>
              </View>
              <AppText variant="bodySm">
                Tonight’s {dinner?.recipeId ? recipeMap[dinner.recipeId]?.title : 'dinner'} prep will safely freeze and bump to Saturday Dinner!
              </AppText>
              <View style={[styles.row, styles.wrap]}>
                <View style={styles.placePill}>
                  <AppText variant="labelSm" numberOfLines={1}>🌿 Wild Greens Grill (8m away)</AppText>
                </View>
                <View style={styles.placePill}>
                  <AppText variant="labelSm" numberOfLines={1}>🍔 Bun & Seed Artisan Burgers (12m)</AppText>
                </View>
              </View>
            </View>
          ) : null}
        </Card>

        <View>
          <View style={styles.rosterHead}>
            <AppText variant="labelLg" style={styles.rosterTitle} numberOfLines={1}>
              Weekly Roster
            </AppText>
            <AppText variant="labelSm" color={colors.primary} style={styles.rosterRange} numberOfLines={1}>
              {formatWeekRange(plan.startDate, plan.endDate)}
            </AppText>
          </View>
          <DaySelector dates={dates} selected={selectedDate} onSelect={setSelectedDate} />
        </View>

        <View style={[styles.rowBetween, styles.wrap]}>
          <View style={[styles.row, styles.flex, styles.wrap]}>
            <AppText variant="headlineMd" style={styles.feastTitle} numberOfLines={1}>
              Today’s Feast
            </AppText>
            <View style={styles.countPill}>
              <AppText variant="labelSm" color={colors.onPrimaryFixed} numberOfLines={1}>
                {plannedCount} Meals Planned
              </AppText>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.navigate('MealEditor', {date: selectedDate, mealType: 'dinner', slotId: dinner?.id})}
            accessibilityRole="button"
            style={styles.adjust}>
            <SlidersHorizontal size={18} color={colors.primary} />
            <AppText variant="labelMd" color={colors.primary} style={styles.adjustLabel} numberOfLines={1}>
              Adjust Portions
            </AppText>
          </Pressable>
        </View>

        {!dinner?.recipeId && !eatingOut ? (
          <EmptyState
            title="No dinner planned yet"
            body="Spin a favourite or pick a dish from the cookbook."
            actionLabel="Spin a meal"
            onAction={() => navigation.navigate('Spin', {date: selectedDate})}
          />
        ) : null}

        {dinner ? (
          <FeaturedMeal
            slot={dinner}
            recipe={dinner.recipeId ? recipeMap[dinner.recipeId] : undefined}
            chefName={snapshot.members.find(member => member.id === dinner.chefId)?.name}
            onPress={() =>
              dinner.recipeId
                ? navigation.navigate('RecipeDetail', {recipeId: dinner.recipeId, slotId: dinner.id})
                : navigation.navigate('MealEditor', {date: selectedDate, mealType: 'dinner', slotId: dinner.id})
            }
          />
        ) : null}

        {lunch ? (
          <CompactMeal
            slot={lunch}
            recipe={lunch.recipeId ? recipeMap[lunch.recipeId] : undefined}
            chefName={snapshot.members.find(member => member.id === lunch.chefId)?.name}
            onPress={() =>
              lunch.recipeId
                ? navigation.navigate('RecipeDetail', {recipeId: lunch.recipeId, slotId: lunch.id})
                : navigation.navigate('MealEditor', {date: selectedDate, mealType: 'lunch', slotId: lunch.id})
            }
            onComplete={() =>
              canEdit
                ? mutations.updateSlot(lunch.id, {status: lunch.status === 'served' ? 'planned' : 'served'})
                : showToast('Viewers can cheer — editors mark meals done.', 'info')
            }
          />
        ) : null}

        {breakfast ? (
          <CompactMeal
            slot={breakfast}
            recipe={breakfast.recipeId ? recipeMap[breakfast.recipeId] : undefined}
            chefName={snapshot.members.find(member => member.id === breakfast.chefId)?.name}
            onPress={() =>
              breakfast.recipeId
                ? navigation.navigate('RecipeDetail', {recipeId: breakfast.recipeId, slotId: breakfast.id})
                : navigation.navigate('MealEditor', {date: selectedDate, mealType: 'breakfast', slotId: breakfast.id})
            }
            onComplete={() =>
              canEdit
                ? mutations.updateSlot(breakfast.id, {status: breakfast.status === 'served' ? 'planned' : 'served'})
                : showToast('Viewers can cheer — editors mark meals done.', 'info')
            }
          />
        ) : null}

        <View style={styles.quickSwap}>
          <View style={[styles.row, styles.flex, styles.nowrap]}>
            <View style={styles.swapIcon}>
              <DiceFive size={20} color={colors.onPrimary} weight="fill" />
            </View>
            <View style={styles.flex}>
              <AppText variant="labelMd" color={colors.inverseOnSurface} numberOfLines={1}>
                Kids picky tonight?
              </AppText>
              <AppText variant="labelSm" color={colors.surfaceDim} numberOfLines={1}>
                Spin from {recipes.filter(recipe => recipe.favorite).length} saved favorites
              </AppText>
            </View>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Spin', {date: selectedDate})}
            style={styles.swapBtn}
            accessibilityRole="button">
            <DiceFive size={18} color={colors.onPrimary} />
            <AppText variant="labelMd" color={colors.onPrimary} style={styles.swapBtnLabel}>
              Quick Swap
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const FeaturedMeal = memo(function FeaturedMeal({
  slot,
  recipe,
  chefName,
  onPress,
}: {
  slot: MealSlot;
  recipe?: Recipe;
  chefName?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card lifted style={styles.featureCard}>
        <View style={[styles.rowBetween, styles.wrap]}>
          <View style={styles.dinnerTag}>
            <ForkKnife size={16} color={colors.onPrimary} />
            <AppText variant="labelSm" color={colors.onPrimary} style={styles.tagBold} numberOfLines={1}>
              {slot.status === 'eatingOut' ? 'Eating out' : 'Dinner • Main Feature'}
            </AppText>
          </View>
          <View style={styles.chefTag}>
            <View style={styles.liveDot} />
            <AppText variant="labelSm" numberOfLines={1}>
              Chef: {chefName ?? 'Open'} {chefName === 'Mom' ? '👩‍🍳 (Apron On!)' : chefName === 'Dad' ? '👨‍🍳' : ''}
            </AppText>
          </View>
        </View>
        {recipe ? (
          <>
            <View style={styles.hero}>
              <CachedImage uri={recipe.thumbnail} label={recipe.title} style={styles.heroImage} />
              <LinearGradient colors={['transparent', 'rgba(39,49,63,0.2)', 'rgba(39,49,63,0.8)']} style={styles.heroScrim}>
                <View style={styles.heroBottom}>
                  <View style={styles.flex}>
                    {recipe.familyRating ? (
                      <View style={styles.starRow}>
                        <Star size={14} color={colors.tertiaryFixedDim} weight="fill" />
                        <AppText variant="labelSm" color={colors.tertiaryFixedDim} style={styles.starCopy}>
                          {recipe.familyRating} ({recipe.voteCount ?? 4} family votes)
                        </AppText>
                      </View>
                    ) : null}
                    <AppText variant="headlineMd" color={colors.surfaceLowest} numberOfLines={2}>
                      {recipe.title}
                    </AppText>
                  </View>
                  <View style={styles.timeBadge}>
                    <AppText variant="labelSm" style={styles.timeCopy}>
                      {recipe.cookMinutes + recipe.prepMinutes} mins
                    </AppText>
                  </View>
                </View>
              </LinearGradient>
            </View>
            {recipe.youtube ? (
              <View style={styles.yt}>
                <View style={styles.ytIcon}>
                  <YoutubeLogo size={18} color={colors.onError} weight="fill" />
                </View>
                <View style={styles.flex}>
                  <AppText variant="labelMd" numberOfLines={2} color={colors.onErrorContainer} style={styles.ytTitle}>
                    YouTube: “{recipe.youtube.title}”
                  </AppText>
                  <AppText variant="labelSm" color={colors.onErrorContainer} numberOfLines={2}>
                    Video length: {recipe.youtube.durationLabel} mins • Step-by-step sync
                  </AppText>
                </View>
                <View style={styles.watch}>
                  <AppText variant="labelSm" color={colors.error} style={styles.watchCopy}>
                    Watch
                  </AppText>
                  <ArrowRight size={16} color={colors.error} />
                </View>
              </View>
            ) : null}
            <View style={[styles.rowBetween, {alignItems: 'flex-start', flexWrap: 'wrap'}]}>
              <View style={styles.dietPills}>
                <View style={styles.dietPill}>
                  <AppText variant="labelSm" color={colors.onSecondaryFixedVariant} numberOfLines={1}>
                    🥬 Sweet & Light
                  </AppText>
                </View>
                <View style={styles.kidPill}>
                  <AppText variant="labelSm" color={colors.onTertiaryFixed} numberOfLines={1}>
                    ⭐ Kid Favorite
                  </AppText>
                </View>
              </View>
              <View style={[styles.row, styles.nowrap]}>
                <Package size={18} color={colors.primary} />
                <AppText variant="labelSm" color={colors.onSurfaceVariant} numberOfLines={1}>
                  Ingredients 100% in pantry
                </AppText>
              </View>
            </View>
          </>
        ) : (
          <AppText variant="bodyMd">No recipe locked — tap to add one or spin.</AppText>
        )}
      </Card>
    </Pressable>
  );
});

const CompactMeal = memo(function CompactMeal({
  slot,
  recipe,
  chefName,
  onPress,
  onComplete,
}: {
  slot: MealSlot;
  recipe?: Recipe;
  chefName?: string;
  onPress: () => void;
  onComplete: () => void;
}) {
  const served = slot.status === 'served';
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card>
        <View style={styles.compactRow}>
          <CachedImage uri={recipe?.thumbnail} style={styles.thumb} label={recipe?.title} />
          <View style={styles.flex}>
            <View style={[styles.row, styles.wrap]}>
              <View style={styles.mealTypePill}>
                <AppText variant="labelSm" color={colors.onSurfaceVariant} style={styles.tagBold} numberOfLines={1}>
                  {slot.mealType === 'lunch' ? 'Lunch' : 'Breakfast'}
                </AppText>
              </View>
              <AppText variant="labelSm" color={served ? colors.secondary : colors.onSurfaceVariant} style={served ? styles.servedCopy : undefined} numberOfLines={1}>
                {served ? 'Served • Cleaned Up' : chefName ? `Chef: ${chefName} 👨‍🍳` : 'Open slot'}
              </AppText>
            </View>
            <AppText variant="labelLg" numberOfLines={1}>
              {recipe?.title ?? 'Tap to plan this meal'}
            </AppText>
            <AppText variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={2}>
              {served
                ? recipe?.familyRating
                  ? `Family scored ${recipe.familyRating}/5 ⭐`
                  : 'Family scored 5/5 ⭐'
                : recipe
                  ? `Prep done • ${recipe.cookMinutes} mins reheat`
                  : 'Add a dish'}
            </AppText>
          </View>
          <Pressable
            onPress={onComplete}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${slot.mealType} ${served ? 'planned' : 'served'}`}
            style={[styles.check, served ? styles.checkDone : styles.checkOpen]}>
            {served ? (
              <CheckCircle size={20} color={colors.onSurfaceVariant} weight="fill" />
            ) : (
              <Check size={20} color={colors.secondary} />
            )}
          </Pressable>
        </View>
      </Card>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.surface},
  content: {padding: spacing.margin, gap: spacing.md, paddingBottom: 120},
  banner: {borderRadius: radii.card, padding: spacing.md, overflow: 'hidden', minHeight: 132, gap: 8},
  confetti: {...StyleSheet.absoluteFill, opacity: 0.25},
  spark: {position: 'absolute'},
  bannerTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap'},
  partyPill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '72%',
  },
  weekCaps: {fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase'},
  bannerBottom: {flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap'},
  bannerTitle: {fontFamily: 'PlusJakartaSans-ExtraBold'},
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
    borderRadius: radii.lg,
    flexShrink: 0,
  },
  shareLabel: {fontFamily: 'PlusJakartaSans-Bold'},
  energy: {
    backgroundColor: 'rgba(255,221,184,0.3)',
    borderRadius: radii.lg,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  energyIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyMeta: {flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap'},
  energyCaps: {textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'PlusJakartaSans-ExtraBold'},
  energyDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: colors.tertiary},
  energyCopy: {fontFamily: 'PlusJakartaSans-SemiBold'},
  flex: {flex: 1, minWidth: 0},
  shrink: {flexShrink: 0},
  nowrap: {flexWrap: 'nowrap'},
  wrap: {flexWrap: 'wrap'},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0},
  runIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeout: {marginTop: 12, backgroundColor: colors.surfaceLow, borderRadius: 16, padding: 12, gap: 8},
  habitPill: {backgroundColor: colors.primaryFixed, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
  placePill: {
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  rosterHead: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingHorizontal: 4, marginBottom: 8, flexWrap: 'wrap'},
  rosterTitle: {fontFamily: 'PlusJakartaSans-ExtraBold'},
  rosterRange: {fontFamily: 'PlusJakartaSans-Bold'},
  feastTitle: {fontFamily: 'PlusJakartaSans-ExtraBold'},
  countPill: {backgroundColor: colors.primaryFixed, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999},
  adjust: {flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, flexShrink: 0},
  adjustLabel: {fontFamily: 'PlusJakartaSans-Bold'},
  featureCard: {gap: 8},
  dinnerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '100%',
    flexShrink: 1,
  },
  tagBold: {fontFamily: 'PlusJakartaSans-ExtraBold'},
  chefTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 1,
    maxWidth: '100%',
  },
  liveDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary},
  hero: {height: 176, borderRadius: 16, overflow: 'hidden'},
  heroImage: {width: '100%', height: '100%'},
  heroScrim: {position: 'absolute', left: 0, right: 0, bottom: 0, top: 0, justifyContent: 'flex-end', padding: 12},
  heroBottom: {flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8},
  starRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  starCopy: {fontFamily: 'PlusJakartaSans-Bold'},
  timeBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeCopy: {fontFamily: 'PlusJakartaSans-ExtraBold'},
  yt: {
    backgroundColor: colors.errorContainer,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ytIcon: {
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytTitle: {fontFamily: 'PlusJakartaSans-Bold'},
  watch: {flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 8, flexShrink: 0, minHeight: 32},
  watchCopy: {fontFamily: 'PlusJakartaSans-ExtraBold'},
  dietPills: {flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1, minWidth: 0},
  dietPill: {
    backgroundColor: 'rgba(127,252,151,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  kidPill: {
    backgroundColor: 'rgba(255,221,184,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  compactRow: {flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0},
  thumb: {width: 64, height: 64, borderRadius: 16},
  mealTypePill: {
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  servedCopy: {fontFamily: 'PlusJakartaSans-Bold'},
  check: {width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  checkOpen: {backgroundColor: 'rgba(127,252,151,0.5)'},
  checkDone: {backgroundColor: colors.surfaceContainer},
  quickSwap: {
    backgroundColor: 'rgba(39,49,63,0.95)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  swapIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    borderRadius: 12,
    flexShrink: 0,
  },
  swapBtnLabel: {fontFamily: 'PlusJakartaSans-ExtraBold'},
});
