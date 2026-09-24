import {useEffect, useMemo, useRef, useState} from 'react';
import {Linking, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  Fire,
  ForkKnife,
  Heart,
  Play,
  Pause,
  ShareNetwork,
  Timer,
  CookingPot,
  ClosedCaptioning,
  CornersOut,
  SpeakerHigh,
  PencilSimple,
} from 'phosphor-react-native';
import {colors, radii, spacing} from '../theme/tokens';
import {AppText, CachedImage, ScreenHeader} from '../components/ui';
import {useAppStore} from '../store/useAppStore';
import {services} from '../services';
import {useQuery} from '@tanstack/react-query';
import type {RootProps} from '../app/navigation/types';

const LOCATION_LABEL: Record<string, string> = {
  fridge: 'Fridge',
  pantry: 'Pantry',
  spice: 'Spice Bin',
  freezer: 'Freezer',
  counter: 'Counter',
  other: 'Baking Cab',
};

const CHAPTERS = [
  {time: '0:00', label: 'Intro & Prep', percent: 0},
  {time: '2:15', label: 'Sauce Glaze', percent: 16},
  {time: '6:40', label: 'Crispy Fry Method', percent: 47},
  {time: '11:20', label: 'Sesame Slaw Toss', percent: 80},
];

export function RecipeDetailScreen({navigation, route}: RootProps<'RecipeDetail'>) {
  const insets = useSafeAreaInsets();
  const {recipeId} = route.params;
  const snapshot = useAppStore(state => state.snapshot);
  const showToast = useAppStore(state => state.showToast);
  const query = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => services.recipes.getRecipe(recipeId),
    initialData: snapshot.recipes.find(recipe => recipe.id === recipeId),
  });
  const recipe = query.data;
  const notes = snapshot.chefNotes.filter(note => note.recipeId === recipeId);
  const [servings, setServings] = useState(4);
  const [liked, setLiked] = useState(recipe?.favorite ?? false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [shareToast, setShareToast] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [prepped, setPrepped] = useState<Record<string, boolean>>({});
  const [seconds, setSeconds] = useState(480);
  const [timerOn, setTimerOn] = useState(false);
  const [progress, setProgress] = useState(30);
  const [timeLabel, setTimeLabel] = useState('04:18 / 14:20');
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!timerOn) {
      return;
    }
    interval.current = setInterval(() => {
      setSeconds(current => {
        if (current <= 1) {
          setTimerOn(false);
          showToast('Chicken sear complete! Ready for the next step.', 'success');
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
    };
  }, [showToast, timerOn]);

  useEffect(() => {
    if (!recipe) {
      return;
    }
    setPrepped(current => {
      if (Object.keys(current).length) {
        return current;
      }
      return Object.fromEntries(recipe.ingredients.slice(0, 2).map(item => [item.id, true]));
    });
  }, [recipe]);

  const factor = servings / 4;
  const qty = (value: number) => {
    const next = value * factor;
    return next % 1 === 0 ? String(next) : next.toFixed(1);
  };
  const members = useMemo(() => Object.fromEntries(snapshot.members.map(member => [member.id, member])), [snapshot.members]);
  const preppedCount = recipe ? recipe.ingredients.filter(item => prepped[item.id]).length : 0;

  if (!recipe) {
    return (
      <View style={styles.screen}>
        <ScreenHeader subtitle="Recipe Detail" onBack={() => navigation.goBack()} onProfile={() => navigation.navigate('HouseholdShare')} />
        <AppText variant="bodyMd" style={{padding: 20}}>
          This recipe is no longer in the household cookbook.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        subtitle="Recipe Detail"
        onBack={() => navigation.goBack()}
        onProfile={() => navigation.navigate('HouseholdShare')}
        onBookmark={async () => {
          const next = await services.recipes.toggleFavorite(recipe.id);
          setLiked(next.favorite);
        }}
        bookmarked={liked}
      />
      <ScrollView contentContainerStyle={[styles.content, {paddingBottom: 24 + insets.bottom}]}>
        <View style={[styles.rowBetween, styles.wrap]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backChip} accessibilityRole="button">
            <ArrowLeft size={18} color={colors.primary} />
            <AppText variant="labelMd" color={colors.primary} numberOfLines={1}>
              Back to Schedule
            </AppText>
          </Pressable>
          <View style={[styles.row, {flexShrink: 1, flexWrap: 'wrap'}]}>
            <Pressable
              onPress={async () => {
                const next = await services.recipes.toggleFavorite(recipe.id);
                setLiked(next.favorite);
              }}
              style={[styles.round, liked && styles.liked]}
              accessibilityLabel="Add to household favorites">
              <Heart size={20} color={liked ? colors.error : colors.onSurfaceVariant} weight={liked ? 'fill' : 'regular'} />
            </Pressable>
            <Pressable
              onPress={() => {
                setShareToast(true);
                setTimeout(() => setShareToast(false), 4000);
              }}
              style={styles.shareChip}>
              <ShareNetwork size={18} color={colors.onSurfaceVariant} />
              <AppText variant="labelMd" color={colors.onSurfaceVariant} numberOfLines={1}>
                Share with Family
              </AppText>
            </Pressable>
          </View>
        </View>

        {shareToast ? (
          <View style={styles.shareToast}>
            <AppText variant="labelMd" color={colors.onSecondaryContainer}>
              Link copied. Sent to the household.
            </AppText>
          </View>
        ) : null}

        <View style={styles.playerCard}>
          <View style={styles.player}>
            <CachedImage uri={recipe.youtube?.thumbnail ?? recipe.thumbnail} style={styles.playerImage} label={recipe.title} />
            <View style={styles.playerUi}>
              <View style={styles.rowBetween}>
                <View style={styles.row}>
                  <View style={styles.ytBadge}>
                    <AppText variant="labelSm" color={colors.onError} style={styles.ytCaps}>
                      YouTube
                    </AppText>
                  </View>
                  <View style={styles.hd}>
                    <AppText variant="labelSm" color="#fff" style={styles.semibold}>
                      HD 1080p
                    </AppText>
                  </View>
                </View>
                <View style={styles.liveChip}>
                  <View style={styles.redDot} />
                  <AppText variant="labelSm" color="#fff" numberOfLines={1}>
                    {recipe.youtube?.channel ?? 'Sam Cooking • 120k'}
                  </AppText>
                </View>
              </View>
              <Pressable
                accessibilityLabel="Play video"
                style={styles.play}
                onPress={() => {
                  setPlaying(!playing);
                  if (recipe.youtube?.url) {
                    Linking.openURL(recipe.youtube.url);
                  }
                }}>
                {playing ? <Pause size={32} color={colors.onPrimary} weight="fill" /> : <Play size={32} color={colors.onPrimary} weight="fill" />}
              </Pressable>
              <View>
                <View style={styles.timeline}>
                  <View style={[styles.progress, {width: `${progress}%`}]} />
                </View>
                <View style={styles.rowBetween}>
                  <AppText variant="labelSm" color="#fff">
                    {timeLabel}
                  </AppText>
                  <View style={styles.row}>
                    <SpeakerHigh size={18} color="#fff" />
                    <ClosedCaptioning size={18} color="#fff" />
                    <CornersOut size={18} color="#fff" />
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.chaptersHead}>
            <AppText variant="labelSm" color={colors.onSurfaceVariant}>
              Interactive Video Chapters
            </AppText>
            <AppText variant="labelSm" color={colors.secondary} style={styles.bold}>
              Jump directly to step
            </AppText>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapterRow}>
            {(recipe.id === 'honey-chicken' ? CHAPTERS : recipe.steps.map((step, index) => ({time: step.timestampLabel ?? '0:00', label: step.title, percent: step.timestampPercent ?? (index + 1) * 20}))).map((chapter, index) => (
              <Pressable
                key={chapter.time + chapter.label}
                onPress={() => {
                  setProgress(chapter.percent);
                  setTimeLabel(`${chapter.time} / ${recipe.youtube?.durationLabel ?? '14:20'}`);
                  setPlaying(true);
                }}
                style={[styles.chapter, index === 1 && styles.chapterOn]}>
                <AppText variant="labelSm">
                  <AppText variant="labelSm" color={colors.primary} style={styles.bold}>
                    {chapter.time}
                  </AppText>{' '}
                  {chapter.label}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.card}>
          <AppText variant="headlineLg" style={styles.title} numberOfLines={3}>
            {recipe.title}
          </AppText>
          <View style={styles.stats}>
            {[
              ['schedule', 'Total', `${recipe.cookMinutes + recipe.prepMinutes} mins`, colors.primary],
              ['skillet', 'Cook', `${recipe.cookMinutes} mins`, colors.secondary],
              ['fire', 'Calories', recipe.calories ? `${recipe.calories} kcal` : '—', colors.tertiary],
              ['fork', 'Flavor', recipe.flavor ?? 'Savory', colors.primaryContainer],
            ].map(([icon, label, value, color]) => (
              <View key={label} style={styles.stat}>
                {icon === 'fire' ? <Fire size={20} color={String(color)} /> : icon === 'fork' ? <ForkKnife size={20} color={String(color)} /> : icon === 'skillet' ? <CookingPot size={20} color={String(color)} /> : <Timer size={20} color={String(color)} />}
                <AppText variant="labelSm" color={colors.onSurfaceVariant} numberOfLines={1}>
                  {label}
                </AppText>
                <AppText variant="labelMd" style={styles.bold} numberOfLines={1}>
                  {value}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.rowBetween, styles.wrap]}>
            <View style={styles.flex}>
              <AppText variant="headlineMd" style={styles.bold} numberOfLines={1}>
                Ingredients
              </AppText>
              <AppText variant="labelSm" color={colors.onSurfaceVariant} numberOfLines={1}>
                {preppedCount} of {recipe.ingredients.length} items prepped
              </AppText>
            </View>
            <View style={styles.stepper}>
              <Pressable onPress={() => setServings(Math.max(1, servings - 1))} style={styles.stepBtn} accessibilityLabel="Decrease servings">
                <AppText variant="headlineMd">-</AppText>
              </Pressable>
              <AppText variant="labelMd" style={styles.bold}>
                {servings} Servings
              </AppText>
              <Pressable onPress={() => setServings(Math.min(12, servings + 1))} style={styles.stepBtn} accessibilityLabel="Increase servings">
                <AppText variant="headlineMd">+</AppText>
              </Pressable>
            </View>
          </View>
          {recipe.ingredients.map(ingredient => {
            const done = prepped[ingredient.id];
            return (
              <Pressable
                key={ingredient.id}
                onPress={() => setPrepped(current => ({...current, [ingredient.id]: !done}))}
                style={styles.ing}
                accessibilityRole="checkbox"
                accessibilityState={{checked: !!done}}>
                <View style={[styles.box, done && styles.boxOn]}>
                  <Check size={16} color={done ? colors.onSecondary : 'transparent'} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="bodyMd" style={done ? styles.strike : undefined} numberOfLines={2}>
                    {qty(ingredient.quantity)} {ingredient.unit} {ingredient.name}
                  </AppText>
                  {ingredient.note ? (
                    <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                      {ingredient.note}
                    </AppText>
                  ) : null}
                </View>
                <View style={[styles.loc, ingredient.assigneeId && styles.mayaTask]}>
                  <AppText variant="labelSm" color={ingredient.assigneeId ? colors.onSecondaryContainer : colors.onSurfaceVariant} style={ingredient.assigneeId ? styles.bold : undefined} numberOfLines={1}>
                    {LOCATION_LABEL[ingredient.location] ?? 'Other'}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View>
              <AppText variant="headlineMd" style={styles.bold}>
                Step-by-Step Guide
              </AppText>
              <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                Synced with video timestamps
              </AppText>
            </View>
            <View style={styles.stepsPill}>
              <AppText variant="labelSm" style={styles.bold}>
                {recipe.steps.length} Steps
              </AppText>
            </View>
          </View>
          {recipe.steps.map((step, index) => {
            const active = index === 1;
            const done = index === 0;
            return (
              <View key={step.id} style={[styles.step, active && styles.stepActive, step.assigneeId && styles.stepMaya, done && styles.stepDone]}>
                <View style={[styles.rowBetween, styles.wrap]}>
                  <View style={[styles.row, styles.flex, styles.wrap]}>
                    <View style={[styles.stepNum, done && styles.stepNumDone, active && styles.stepNumActive, step.assigneeId && styles.stepNumMaya]}>
                      <AppText variant="labelSm" color={done || active ? colors.onPrimary : colors.onSurface} style={styles.bold}>
                        {done ? '✓' : index + 1}
                      </AppText>
                    </View>
                    <AppText variant="labelMd" style={[styles.bold, styles.flex]} numberOfLines={2}>
                      Step {index + 1} • {step.title}
                    </AppText>
                    {step.assigneeId ? (
                      <View style={styles.maya}>
                        <AppText variant="labelSm" color={colors.onSecondary} style={styles.bold}>
                          Maya Task
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => {
                      setProgress(step.timestampPercent ?? 16);
                      setTimeLabel(`${step.timestampLabel ?? '02:15'} / 14:20`);
                    }}
                    style={[styles.ts, active && styles.tsActive]}>
                    <Play size={14} color={active ? colors.onPrimaryFixed : colors.primary} />
                    <AppText variant="labelSm" color={active ? colors.onPrimaryFixed : colors.primary}>
                      {step.timestampLabel ?? '02:15'}
                    </AppText>
                  </Pressable>
                </View>
                <AppText variant="bodySm" color={active ? colors.onSurface : colors.onSurfaceVariant} style={styles.stepBody}>
                  {step.body}
                </AppText>
                {step.minutes ? (
                  <View style={[styles.timer, styles.wrap]}>
                    <View style={styles.row}>
                      <View style={styles.timerIcon}>
                        <Timer size={22} color={colors.primary} />
                      </View>
                      <View>
                        <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                          Sear Chicken Timer
                        </AppText>
                        <AppText variant="headlineMd" style={styles.timerNum}>
                          {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
                        </AppText>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => setTimerOn(!timerOn)}
                      style={[styles.timerBtn, timerOn && styles.timerPause]}>
                      {timerOn ? <Pause size={18} color={colors.onSecondary} /> : <Play size={18} color={colors.onPrimary} />}
                      <AppText variant="labelMd" color={timerOn ? colors.onSecondary : colors.onPrimary} style={styles.bold}>
                        {timerOn ? 'Pause' : seconds < 480 ? 'Resume' : 'Start Timer'}
                      </AppText>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={[styles.rowBetween, styles.wrap]}>
            <View style={[styles.row, styles.flex]}>
              <AppText variant="headlineMd" style={[styles.bold, styles.flex]} numberOfLines={1}>
                Household Customizations
              </AppText>
            </View>
            <AppText variant="labelSm" color={colors.primary} style={styles.bold}>
              {notes.length} active notes
            </AppText>
          </View>
          {notes.map(item => {
            const author = members[item.authorId];
            const dad = item.authorId === 'dad';
            return (
              <View key={item.id} style={[styles.note, dad ? styles.noteDad : styles.noteMaya]}>
                <View style={[styles.noteFace, dad ? styles.noteDadFace : styles.noteMayaFace]}>
                  <AppText>{author?.avatarInitial ?? ''}</AppText>
                </View>
                <View style={styles.flex}>
                  <View style={styles.rowBetween}>
                    <AppText variant="labelMd" style={styles.bold}>
                      {author?.name ?? 'Family'}'s Preference
                    </AppText>
                    <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                      Today {dad ? '4:15 PM' : '3:40 PM'}
                    </AppText>
                  </View>
                  <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                    "{item.body}"
                  </AppText>
                </View>
              </View>
            );
          })}
          <Pressable onPress={() => setNoteOpen(true)} style={styles.leaveNote}>
            <PencilSimple size={18} color={colors.primary} />
            <AppText variant="labelMd" style={styles.bold}>
              Leave Note for Tonight's Chef
            </AppText>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={noteOpen} transparent animationType="fade" onRequestClose={() => setNoteOpen(false)}>
        <KeyboardAvoidingView style={styles.scrim} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.scrimPress} onPress={() => setNoteOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => undefined}>
            <View style={styles.rowBetween}>
              <AppText variant="headlineMd" style={styles.bold}>
                Leave chef note
              </AppText>
              <Pressable onPress={() => setNoteOpen(false)} style={styles.close}>
                <AppText>✕</AppText>
              </Pressable>
            </View>
            <AppText variant="bodySm" color={colors.onSurfaceVariant}>
              Chef Mom will see this note on the kitchen counter display before starting step 1.
            </AppText>
            <TextInput
              accessibilityLabel="Chef note"
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Can we leave garlic out of one portion? Or serve with extra lime wedges?"
              placeholderTextColor={colors.outline}
              style={styles.area}
              multiline
            />
            <View style={styles.row}>
              <Pressable onPress={() => setNoteOpen(false)} style={styles.cancel}>
                <AppText variant="labelMd" style={styles.bold}>
                  Cancel
                </AppText>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (note.trim()) {
                    await services.recipes.addChefNote(recipe.id, note.trim());
                    showToast('Note saved for tonight’s chef');
                    setNote('');
                  }
                  setNoteOpen(false);
                }}
                style={styles.save}>
                <AppText variant="labelMd" color={colors.onPrimary} style={styles.bold}>
                  Save Note
                </AppText>
              </Pressable>
            </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.surface},
  content: {padding: spacing.margin, gap: spacing.md},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0},
  rowBetween: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, minWidth: 0},
  flex: {flex: 1, minWidth: 0},
  wrap: {flexWrap: 'wrap'},
  bold: {fontFamily: 'PlusJakartaSans-Bold'},
  semibold: {fontFamily: 'PlusJakartaSans-SemiBold'},
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liked: {backgroundColor: colors.errorContainer},
  shareChip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flexShrink: 1,
  },
  shareToast: {backgroundColor: colors.secondaryContainer, borderRadius: 12, padding: 12},
  playerCard: {backgroundColor: colors.surfaceLowest, borderRadius: radii.card, padding: 8, gap: 8},
  player: {aspectRatio: 16 / 9, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.inverseSurface},
  playerImage: {width: '100%', height: '100%'},
  playerUi: {...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)', padding: 12, justifyContent: 'space-between'},
  ytBadge: {backgroundColor: colors.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6},
  ytCaps: {textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'PlusJakartaSans-ExtraBold'},
  hd: {backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6},
  liveChip: {backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '62%', flexShrink: 1},
  redDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444'},
  play: {alignSelf: 'center', width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  timeline: {height: 6, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 999, overflow: 'hidden', marginBottom: 6},
  progress: {height: 6, backgroundColor: colors.primary, borderRadius: 999},
  chaptersHead: {flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 8, gap: 8, flexWrap: 'wrap'},
  chapterRow: {gap: 8, paddingBottom: 4},
  chapter: {paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.surfaceContainer},
  chapterOn: {backgroundColor: colors.primaryFixed},
  voice: {backgroundColor: colors.surfaceLow, borderRadius: 16, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8},
  mic: {width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  card: {backgroundColor: colors.surfaceLowest, borderRadius: radii.card, padding: 20, gap: 10},
  chefChip: {backgroundColor: colors.primaryFixed, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999},
  helperChip: {backgroundColor: colors.secondaryContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999},
  ratingChip: {backgroundColor: colors.tertiaryFixed, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999},
  title: {fontFamily: 'PlusJakartaSans-ExtraBold'},
  fit: {backgroundColor: colors.surfaceLow, borderRadius: 16, padding: 12, flexDirection: 'row', gap: 10},
  bolt: {fontSize: 20},
  stats: {flexDirection: 'row', gap: 6, minWidth: 0},
  stat: {flex: 1, minWidth: 0, backgroundColor: colors.surfaceContainer, borderRadius: 16, padding: 8, alignItems: 'center', gap: 2},
  pantryAlert: {backgroundColor: 'rgba(124,249,148,0.3)', borderRadius: radii.card, padding: 20, gap: 12},
  pantryIcon: {width: 32, height: 32, borderRadius: 16, backgroundColor: colors.secondaryContainer, alignItems: 'center', justifyContent: 'center'},
  ready: {backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999},
  safePill: {backgroundColor: colors.surfaceLowest, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999},
  backup: {minHeight: 44, borderRadius: 12, backgroundColor: colors.surfaceLowest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, flexWrap: 'wrap'},
  backupOn: {backgroundColor: colors.secondaryContainer},
  stepper: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceContainer, borderRadius: 16, padding: 4},
  stepBtn: {width: 32, height: 32, borderRadius: 12, backgroundColor: colors.surfaceLowest, alignItems: 'center', justifyContent: 'center'},
  ing: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: colors.surfaceLow, minWidth: 0},
  box: {width: 24, height: 24, borderRadius: 8, backgroundColor: colors.surfaceLowest, alignItems: 'center', justifyContent: 'center'},
  boxOn: {backgroundColor: colors.secondary},
  strike: {textDecorationLine: 'line-through', opacity: 0.7},
  loc: {backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexShrink: 1, maxWidth: '48%'},
  mayaTask: {backgroundColor: colors.secondaryContainer},
  stepsPill: {backgroundColor: colors.surfaceHigh, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999},
  step: {backgroundColor: colors.surfaceLow, borderRadius: 16, padding: 16, gap: 10},
  stepActive: {backgroundColor: 'rgba(255,219,206,0.2)'},
  stepMaya: {backgroundColor: 'rgba(124,249,148,0.25)'},
  stepDone: {opacity: 0.9},
  stepNum: {width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center'},
  stepNumDone: {backgroundColor: colors.secondary},
  stepNumActive: {backgroundColor: colors.primary},
  stepNumMaya: {backgroundColor: colors.secondaryContainer},
  maya: {backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999},
  ts: {flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.surfaceContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999},
  tsActive: {backgroundColor: colors.primaryFixed},
  stepBody: {paddingLeft: 36},
  timer: {marginLeft: 0, backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8},
  timerIcon: {width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center'},
  timerNum: {fontFamily: 'PlusJakartaSans-ExtraBold', letterSpacing: 1},
  timerBtn: {minHeight: 40, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0},
  timerPause: {backgroundColor: colors.secondary},
  note: {flexDirection: 'row', gap: 12, padding: 14, borderRadius: 16},
  noteDad: {backgroundColor: 'rgba(255,221,184,0.2)'},
  noteMaya: {backgroundColor: 'rgba(124,249,148,0.2)'},
  noteFace: {width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  noteDadFace: {backgroundColor: colors.tertiaryFixed},
  noteMayaFace: {backgroundColor: colors.secondaryContainer},
  leaveNote: {minHeight: 44, borderRadius: 12, backgroundColor: colors.surfaceContainer, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12},
  cookBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(248,249,255,0.9)',
    flexDirection: 'row',
    gap: 8,
  },
  cookMain: {flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  cookOn: {backgroundColor: colors.secondary},
  mins: {backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999},
  cooked: {width: 52, height: 52, borderRadius: 16, backgroundColor: colors.secondaryContainer, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  cookedOn: {backgroundColor: colors.secondary},
  scrim: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center'},
  scrimPress: {flex: 1, justifyContent: 'center', padding: 16},
  sheet: {backgroundColor: colors.surfaceLowest, padding: 20, borderRadius: 24, gap: 12, maxHeight: '90%'},
  close: {width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center'},
  area: {minHeight: 90, borderRadius: 12, backgroundColor: colors.surfaceLow, padding: 12, color: colors.onSurface, fontFamily: 'PlusJakartaSans-Regular'},
  cancel: {flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center'},
  save: {flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
});
