import {useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  ArrowSquareOut,
  BatteryCharging,
  CheckCircle,
  DiceFive,
  Lightning,
  MagicWand,
  Play,
  Repeat,
  Smiley,
  CookingPot,
} from 'phosphor-react-native';
import {colors, radii, spacing} from '../theme/tokens';
import {SPIN_THEMES} from '../theme/weeklyThemes';
import {MOODS} from '../services';
import {AppText, CachedImage, Card, ScreenHeader, Shimmer} from '../components/ui';
import {EmptyState} from '../components/ui';
import {usePlanMutations, useRecipes, useSpinMutation, useWeeklyPlan} from '../hooks/useFamFeast';
import {useAppStore} from '../store/useAppStore';
import {useReducedMotion} from '../hooks/useReducedMotion';
import type {TabProps} from '../app/navigation/types';
import type {MoodId} from '../domain/types';
import type {WeeklyThemeId} from '../theme/weeklyThemes';
import type {SpinResult} from '../services/interfaces';

const SPIN_MOODS = MOODS.filter(item => ['exhausted', 'celebrate', 'sweet', 'comfort'].includes(item.id));

export function SpinScreen({navigation, route}: TabProps<'Spin'>) {
  const planQuery = useWeeklyPlan();
  const recipesQuery = useRecipes();
  const snapshot = useAppStore(state => state.snapshot);
  const storeDate = useAppStore(state => state.selectedDate);
  const selectedDate = route.params?.date ?? storeDate;
  const canEdit = useAppStore(state => state.canEdit());
  const showToast = useAppStore(state => state.showToast);
  const planMutations = usePlanMutations();
  const spin = useSpinMutation();
  const reduced = useReducedMotion();

  const plan = planQuery.data ?? snapshot.plan;
  const recipes = recipesQuery.data ?? snapshot.recipes;
  const [theme, setTheme] = useState<WeeklyThemeId>(plan.theme === 'regular' || plan.theme === 'comfort' ? 'party' : plan.theme);
  const [moodId, setMoodId] = useState<MoodId>(plan.moodId && SPIN_MOODS.some(item => item.id === plan.moodId) ? plan.moodId : 'celebrate');
  const [result, setResult] = useState<SpinResult | undefined>();
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (SPIN_THEMES.some(item => item.id === plan.theme)) {
      setTheme(plan.theme);
    }
  }, [plan.theme]);

  const history = useMemo(
    () => snapshot.spinHistory.map(id => recipes.find(recipe => recipe.id === id)).filter(Boolean),
    [recipes, snapshot.spinHistory],
  );

  const shown = result?.recipe ?? recipes.find(recipe => recipe.id === 'teriyaki-salmon') ?? recipes[0];
  const energy = MOODS.find(item => item.id === moodId);

  const runSpin = async (nextTheme = theme, nextMood = moodId) => {
    const spun = await spin.mutateAsync({theme: nextTheme, moodId: nextMood, date: selectedDate, mealType: 'dinner'});
    setResult(spun);
    setLocked(false);
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="Spin" onProfile={() => navigation.navigate('HouseholdShare')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.rowBetween, styles.wrap]}>
          <View style={styles.flex}>
            <View style={[styles.row, styles.nowrap]}>
              <DiceFive size={22} color={colors.primary} weight="fill" />
              <AppText variant="headlineLg" style={styles.heroTitle} numberOfLines={1}>
                Spin the Feast
              </AppText>
            </View>
            <AppText variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={2}>
              Break decision fatigue with tonight's culinary wheel!
            </AppText>
          </View>
          <View style={styles.spinPill}>
            <Lightning size={18} color={colors.tertiaryContainer} />
            <AppText variant="labelMd" color={colors.tertiary} style={styles.bold} numberOfLines={1}>
              {snapshot.spinsLeft} {snapshot.spinsLeft === 1 ? 'Spin Left' : 'Spins Left'}
            </AppText>
          </View>
        </View>

        <View>
          <View style={[styles.rowBetween, styles.wrap]}>
            <AppText variant="labelLg" style={styles.bold} numberOfLines={1}>
              1. Pick This Week's Vibe
            </AppText>
            <AppText variant="labelSm" color={colors.primary} style={styles.semibold} numberOfLines={1}>
              Swipe vibes 👉
            </AppText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeRow} style={styles.themeBleed}>
            {SPIN_THEMES.map(item => {
              const selected = theme === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    setTheme(item.id);
                    if (canEdit) {
                      planMutations.setTheme(item.id);
                    }
                    if (recipes.length) {
                      runSpin(item.id, moodId);
                    }
                  }}
                  style={[styles.themePill, selected ? styles.themeOn : styles.themeOff]}>
                  <AppText>{item.emoji}</AppText>
                  <AppText variant="labelMd" color={selected ? colors.onPrimary : colors.onSurface} style={styles.bold}>
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <Card>
          <View style={[styles.rowBetween, styles.wrap]}>
            <View style={[styles.row, styles.flex, styles.nowrap]}>
              <BatteryCharging size={20} color={colors.primary} />
              <AppText variant="labelLg" style={styles.bold} numberOfLines={1}>
                Household Energy Level
              </AppText>
            </View>
            <View style={styles.energyLabel}>
              <AppText variant="labelSm" color={colors.primary} style={styles.bold} numberOfLines={1}>
                {energy?.energyLabel ?? 'Moderate • 25m'}
              </AppText>
            </View>
          </View>
          <View style={styles.moodGrid}>
            {SPIN_MOODS.map(mood => {
              const on = moodId === mood.id;
              return (
                <Pressable
                  key={mood.id}
                  onPress={() => {
                    setMoodId(mood.id);
                    planMutations.setMood(mood.id, mood.energyLabel);
                  }}
                  style={[styles.mood, on ? styles.moodOn : styles.moodOff]}>
                  <AppText style={styles.moodEmoji}>{mood.emoji}</AppText>
                  <View style={styles.flex}>
                    <AppText variant="labelMd" numberOfLines={1} color={on ? colors.onPrimaryFixed : colors.onSurface} style={styles.bold}>
                      {mood.label}
                    </AppText>
                    <AppText variant="labelSm" color={on ? colors.onPrimaryFixedVariant : colors.onSurfaceVariant} numberOfLines={1}>
                      {mood.hint}
                    </AppText>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        {recipes.length === 0 ? (
          <EmptyState
            title="No favourite dishes yet"
            body="Add a YouTube recipe or homemade dish, then spin a week that actually fits the household."
            actionLabel="Add a recipe"
            onAction={() => navigation.navigate('AddRecipe')}
          />
        ) : shown ? (
          <Card lifted>
            <View style={styles.rowBetween}>
              <View style={styles.matchPill}>
                <AppText variant="labelMd" color={colors.secondary} style={styles.bold}>
                  ✓  AI Match • {result?.matchPercent ?? 98}%
                </AppText>
              </View>
              <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                Kitchen Roulette
              </AppText>
            </View>
            <View style={styles.wheel}>
              <CachedImage uri={shown.thumbnail} label={shown.title} style={styles.wheelImage} />
              <LinearGradient colors={['transparent', 'rgba(39,49,63,0.3)', 'rgba(39,49,63,0.9)']} style={styles.wheelScrim} />
              {spin.isPending && !reduced ? (
                <View style={styles.overlay} accessibilityState={{busy: true}}>
                  <AppText variant="headlineMd" color={colors.onPrimary} style={styles.bold} align="center" numberOfLines={2}>
                    Spinning family recipes...
                  </AppText>
                  <AppText style={styles.spinEmojis}>🍱 ✨ 🥗 🥘</AppText>
                </View>
              ) : null}
              <View style={styles.wheelCopy}>
                <View style={[styles.row, styles.wrap]}>
                  <View style={styles.dishTag}>
                    <AppText variant="labelSm" color={colors.onTertiary} style={styles.bold} numberOfLines={1}>
                      {result
                        ? `${SPIN_THEMES.find(item => item.id === theme)?.label ?? 'Party'} ${SPIN_THEMES.find(item => item.id === theme)?.emoji ?? ''}`
                        : 'Party Finger Food'}
                    </AppText>
                  </View>
                  <View style={styles.timeTag}>
                    <AppText variant="labelSm" color={colors.inverseOnSurface}>
                      {shown.prepMinutes || shown.cookMinutes} min prep
                    </AppText>
                  </View>
                </View>
                <AppText variant="headlineMd" color={colors.inverseOnSurface} style={styles.heroTitle} numberOfLines={2}>
                  {shown.title}
                </AppText>
              </View>
            </View>
            {spin.isPending ? <Shimmer height={64} radius={16} /> : null}
            <View style={styles.why}>
              <MagicWand size={22} color={colors.primary} />
              <View style={styles.flex}>
                <AppText variant="labelMd" style={styles.bold}>
                  Why it fits today:
                </AppText>
                <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                  {result?.reason ?? 'Perfect balance for busy Thursday: light yet high protein with crunchy cucumber and crispy glazed salmon!'}
                </AppText>
              </View>
            </View>
            {shown.youtube ? (
              <View style={styles.yt}>
                <View style={styles.playIcon}>
                  <Play size={24} color={colors.onError} weight="fill" />
                </View>
                <View style={styles.flex}>
                  <AppText variant="labelSm" color={colors.error} style={styles.ytCaps}>
                    YouTube Guide
                  </AppText>
                  <AppText variant="labelMd" numberOfLines={1} style={styles.semibold}>
                    {shown.youtube.title}
                  </AppText>
                  <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                    {shown.youtube.channel}
                  </AppText>
                </View>
                <Pressable
                  onPress={() => navigation.navigate('RecipeDetail', {recipeId: shown.id})}
                  style={styles.openBtn}
                  accessibilityRole="button">
                  <ArrowSquareOut size={20} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>
            ) : null}
            <View style={styles.chefRec}>
              <View style={[styles.row, styles.flex, styles.nowrap]}>
                <CookingPot size={20} color={colors.tertiaryContainer} />
                <AppText variant="labelMd" numberOfLines={1}>
                  Recommended Chef:
                </AppText>
              </View>
              <View style={[styles.row, {flexShrink: 0}]}>
                <View style={styles.chefInitial}>
                  <AppText variant="labelSm" color={colors.onPrimaryFixed} style={styles.bold}>
                    D
                  </AppText>
                </View>
                <AppText variant="labelMd" color={colors.primary} style={styles.bold} numberOfLines={1}>
                  {(result?.recommendedChefIds.length
                    ? result.recommendedChefIds
                        .map(id => snapshot.members.find(member => member.id === id)?.name)
                        .filter(Boolean)
                        .join(' & ')
                    : 'Dad & Maya') + (result?.recommendedChefIds.includes('maya') || !result ? ' (Assistant)' : '')}
                </AppText>
              </View>
            </View>
            <Pressable onPress={() => runSpin()} style={styles.spinBtn} accessibilityRole="button">
              <DiceFive size={24} color={colors.onPrimary} />
              <AppText variant="labelLg" color={colors.onPrimary} style={styles.bold} numberOfLines={1}>
                Spin for Tonight's Dinner
              </AppText>
            </Pressable>
            <View style={styles.two}>
              <Pressable onPress={() => runSpin()} style={styles.respin} accessibilityRole="button">
                <Repeat size={18} color={colors.onSurface} />
                <AppText variant="labelMd" style={styles.bold} numberOfLines={1}>
                  {result ? `Re-spin (${snapshot.spinsLeft})` : 'Quick Re-Spin'}
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!canEdit) {
                    showToast('Suggest it on the Voting board instead.', 'info');
                    return;
                  }
                  planMutations.lockRecipe({
                    date: selectedDate,
                    mealType: 'dinner',
                    recipeId: shown.id,
                    chefId: result?.recommendedChefIds[0],
                  });
                  setLocked(true);
                }}
                style={[styles.lockBtn, locked && styles.lockOn]}
                accessibilityRole="button">
                <CheckCircle size={18} color={colors.onSecondary} />
                <AppText variant="labelMd" color={colors.onSecondary} style={styles.bold} numberOfLines={1}>
                  {locked ? 'Added to Plan! 🎉' : 'Lock In Feast'}
                </AppText>
              </Pressable>
            </View>
          </Card>
        ) : null}

        <View style={styles.rowBetween}>
          <AppText variant="labelLg" style={styles.bold}>
            Recent Wheel Favorites
          </AppText>
          <AppText variant="labelSm" color={colors.primary} style={styles.bold}>
            History ({history.length || 12})
          </AppText>
        </View>
        <View style={styles.history}>
          {history.slice(0, 2).map(recipe => (
            <Pressable
              key={recipe!.id}
              style={styles.histCard}
              onPress={() => navigation.navigate('RecipeDetail', {recipeId: recipe!.id})}>
              <View>
                <CachedImage uri={recipe!.thumbnail} style={styles.histImg} label={recipe!.title} />
                <View style={styles.histTime}>
                  <AppText variant="labelSm" style={styles.bold}>
                    {recipe!.cookMinutes}m
                  </AppText>
                </View>
              </View>
              <AppText variant="labelMd" numberOfLines={1} style={styles.bold}>
                {recipe!.title}
              </AppText>
              <View style={styles.row}>
                {recipe!.id === 'sheet-fajitas' ? (
                  <AppText variant="labelSm" color={colors.error}>
                    🔥 Mom's special
                  </AppText>
                ) : (
                  <>
                    <Smiley size={14} color={colors.secondary} />
                    <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                      Voted 5/5 stars
                    </AppText>
                  </>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.surface},
  content: {padding: spacing.margin, gap: spacing.lg, paddingBottom: 112},
  row: {flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0},
  rowBetween: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, minWidth: 0},
  flex: {flex: 1, minWidth: 0},
  nowrap: {flexWrap: 'nowrap'},
  wrap: {flexWrap: 'wrap'},
  heroTitle: {fontFamily: 'PlusJakartaSans-ExtraBold'},
  bold: {fontFamily: 'PlusJakartaSans-Bold'},
  semibold: {fontFamily: 'PlusJakartaSans-SemiBold'},
  spinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexShrink: 0,
  },
  themeBleed: {marginHorizontal: -spacing.margin},
  themeRow: {gap: 8, paddingHorizontal: spacing.margin, paddingVertical: 4},
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  themeOn: {backgroundColor: colors.primary},
  themeOff: {backgroundColor: colors.surfaceContainer},
  energyLabel: {backgroundColor: colors.primaryFixed, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, flexShrink: 1, maxWidth: '100%'},
  moodGrid: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginTop: 8},
  mood: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radii.md,
    padding: 10,
    minWidth: 0,
  },
  moodOn: {backgroundColor: colors.primaryFixed},
  moodOff: {backgroundColor: colors.surfaceContainer},
  moodEmoji: {fontSize: 20},
  matchPill: {backgroundColor: colors.secondaryContainer, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999},
  wheel: {height: 192, borderRadius: 16, overflow: 'hidden', marginTop: 12},
  wheelImage: {width: '100%', height: '100%'},
  wheelScrim: StyleSheet.absoluteFill,
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(163,57,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    gap: 8,
    padding: 16,
  },
  spinEmojis: {fontSize: 24},
  wheelCopy: {position: 'absolute', left: 12, right: 12, bottom: 12, gap: 6, zIndex: 1, minWidth: 0},
  dishTag: {backgroundColor: colors.tertiaryContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
  timeTag: {backgroundColor: 'rgba(39,49,63,0.8)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8},
  why: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.surfaceLow,
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
  },
  yt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
  },
  playIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ytCaps: {letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: 'PlusJakartaSans-Bold'},
  openBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chefRec: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: 10,
    marginTop: 8,
    gap: 8,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  chefInitial: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinBtn: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  two: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4},
  respin: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  lockBtn: {
    flexGrow: 1,
    flexBasis: 140,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  lockOn: {backgroundColor: colors.primary},
  history: {flexDirection: 'row', gap: 8},
  histCard: {flex: 1, minWidth: 0, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 10, gap: 8, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2},
  histImg: {width: '100%', height: 96, borderRadius: 12},
  histTime: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
});
