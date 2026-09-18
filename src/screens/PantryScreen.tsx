import {useMemo, useState, type ReactNode} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View} from 'react-native';
import {
  ArrowLeft,
  Barcode,
  CaretDown,
  Check,
  CheckCircle,
  Lightbulb,
  MagnifyingGlass,
  Microphone,
  Minus,
  Plus,
  PlusCircle,
  SlidersHorizontal,
  ShoppingCart,
  Sparkle,
  Timer,
  Warning,
  Snowflake,
  Package,
  Drop,
  Bread,
  SortAscending,
  ForkKnife,
  Handbag,
  CookingPot,
  ArrowsClockwise,
} from 'phosphor-react-native';
import {differenceInCalendarDays, parseISO} from 'date-fns';
import {colors, radii, spacing} from '../theme/tokens';
import {AppText, CachedImage, ScreenHeader} from '../components/ui';
import {usePantry} from '../hooks/useFamFeast';
import {useAppStore} from '../store/useAppStore';
import {services} from '../services';
import {queryClient} from '../app/queryClient';
import {todayISO} from '../utils/dates';
import type {GroceryStackProps} from '../app/navigation/types';
import type {PantryItem} from '../domain/types';

type Filter = 'all' | 'expiring' | 'low' | 'fridge' | 'dry' | 'spice';

export function PantryScreen({navigation}: GroceryStackProps<'Pantry'>) {
  const query = usePantry();
  const snapshot = useAppStore(state => state.snapshot);
  const items = query.data ?? snapshot.pantry;
  const [queryText, setQueryText] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [addedAll, setAddedAll] = useState(false);
  const showToast = useAppStore(state => state.showToast);
  const canEdit = useAppStore(state => state.canEdit());

  const filtered = useMemo(() => {
    return items.filter(item => {
      const days = item.expiresOn ? differenceInCalendarDays(parseISO(item.expiresOn), parseISO(todayISO())) : 99;
      const matchesText = item.name.toLowerCase().includes(queryText.toLowerCase());
      const matchesFilter =
        filter === 'all' ||
        (filter === 'low' && item.lowStock) ||
        (filter === 'expiring' && days <= 3) ||
        (filter === 'fridge' && item.location === 'fridge') ||
        (filter === 'dry' && (item.location === 'pantry' || item.zone === 'grains')) ||
        (filter === 'spice' && (item.location === 'spice' || item.zone === 'spices'));
      return matchesText && matchesFilter;
    });
  }, [filter, items, queryText]);

  const urgent = items.filter(item => {
    const days = item.expiresOn ? differenceInCalendarDays(parseISO(item.expiresOn), parseISO(todayISO())) : 99;
    return days <= 2;
  });
  const low = items.filter(item => item.lowStock);
  const dairy = items.filter(item => item.zone === 'dairy');
  const grains = items.filter(item => item.zone === 'grains');
  const spices = items.filter(item => item.zone === 'spices');

  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="Grocery & Pantry" onProfile={() => navigation.navigate('HouseholdShare')} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.content, {paddingBottom: 96}]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.topBar}>
          <View style={[styles.row, styles.flex, styles.nowrap]}>
            <Pressable
              accessibilityLabel="Back to grocery hub"
              onPress={() => navigation.goBack()}
              style={styles.back}>
              <ArrowLeft size={22} color={colors.onSurface} />
            </Pressable>
            <View style={styles.flex}>
              <View style={[styles.row, styles.wrap]}>
                <AppText variant="headlineMd" style={styles.bold} numberOfLines={1}>
                  Pantry & Expiry
                </AppText>
                <View style={styles.livePill}>
                  <AppText variant="labelSm" color={colors.onSecondaryContainer} numberOfLines={1}>
                    Live Sync
                  </AppText>
                </View>
              </View>
              <AppText variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={1}>
                The Miller Kitchen Inventory • {items.length} tracked
              </AppText>
            </View>
          </View>
          <View style={[styles.row, {flexShrink: 0}]}>
            <Pressable
              accessibilityLabel="Barcode Scanner"
              onPress={() => showToast('Point camera at a barcode to add a pantry item.', 'info')}
              style={styles.scan}>
              <Barcode size={20} color={colors.onPrimaryFixed} />
            </Pressable>
            <Pressable accessibilityLabel="Household pantry options" style={styles.tune}>
              <SlidersHorizontal size={20} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
        </View>

        <View style={styles.search}>
          <MagnifyingGlass size={22} color={colors.primary} />
          <TextInput
            accessibilityLabel="Search pantry"
            value={queryText}
            onChangeText={setQueryText}
            placeholder={`Search ${items.length} pantry items, spices, dairy...`}
            placeholderTextColor={colors.onSurfaceVariant}
            style={styles.searchInput}
          />
          <Microphone size={20} color={colors.onSurfaceVariant} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <FilterChip label={`All Items (${items.length})`} active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label="Expiring Soon (4)" icon={<Warning size={14} color={colors.onErrorContainer} />} tone="danger" active={filter === 'expiring'} onPress={() => setFilter('expiring')} />
          <FilterChip label="Low Stock (6)" icon={<Package size={14} color={colors.onTertiaryFixed} />} tone="tertiary" active={filter === 'low'} onPress={() => setFilter('low')} />
          <FilterChip label="Fridge (18)" icon={<Snowflake size={14} color={colors.onSurfaceVariant} />} active={filter === 'fridge'} onPress={() => setFilter('fridge')} />
          <FilterChip label="Dry Goods (16)" icon={<Bread size={14} color={colors.onSurfaceVariant} />} active={filter === 'dry'} onPress={() => setFilter('dry')} />
          <FilterChip label="Spices & Oils (8)" icon={<Drop size={14} color={colors.onSurfaceVariant} />} active={filter === 'spice'} onPress={() => setFilter('spice')} />
        </ScrollView>
        {queryText && filtered.length === 0 ? (
          <AppText variant="bodySm" color={colors.onSurfaceVariant}>
            No pantry items match that search.
          </AppText>
        ) : null}

        <View style={[styles.hero]}>
          <View style={[styles.rowBetween, styles.wrap]}>
            <View style={[styles.row, styles.flex]}>
              <View style={styles.timerIcon}>
                <Timer size={22} color={colors.onErrorContainer} />
              </View>
              <View style={styles.flex}>
                <View style={[styles.row, styles.wrap]}>
                  <AppText variant="labelLg" style={styles.bold} numberOfLines={1}>
                    Waste Rescue Radar
                  </AppText>
                  <View style={styles.urgentPill}>
                    <AppText variant="labelSm" color={colors.onErrorContainer} style={styles.bold} numberOfLines={1}>
                      {urgent.length} urgent
                    </AppText>
                  </View>
                </View>
                <AppText variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={2}>
                  Cook these first to save ~$18 this week
                </AppText>
              </View>
            </View>
            <Sparkle size={20} color={colors.primary} />
          </View>
          {urgent.map((item, index) => (
            <View key={item.id} style={styles.urgentCard}>
              <View style={[styles.rowBetween, styles.wrap]}>
                <View style={[styles.row, styles.flex]}>
                  <CachedImage uri={item.thumbnail} style={index === 0 ? styles.urgentImgLg : styles.urgentImg} label={item.name} />
                  <View style={styles.flex}>
                    <View style={styles.row}>
                      <AppText variant="labelMd" style={styles.semibold} numberOfLines={1}>
                        {item.name}
                      </AppText>
                      <View style={[styles.expPill, item.statusLabel === 'Eat Today' ? styles.expGold : styles.expRed]}>
                        <AppText variant="labelSm" color={item.statusLabel === 'Eat Today' ? colors.onTertiaryFixed : colors.onErrorContainer}>
                          {item.statusLabel}
                        </AppText>
                      </View>
                    </View>
                    <AppText variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={1}>
                      {item.quantityLabel}
                    </AppText>
                  </View>
                </View>
                {index === 0 ? (
                  <Pressable
                    onPress={async () => {
                      if (!canEdit) {
                        showToast('Ask an editor to move this onto tonight’s plan.', 'info');
                        return;
                      }
                      await services.grocery.usePantryItemTonight(item.id);
                      await queryClient.invalidateQueries({queryKey: ['plan']});
                      navigation.navigate('Main', {screen: 'Schedule'});
                    }}
                    style={styles.useTonight}>
                    <AppText variant="labelSm" color={colors.onPrimary}>
                      Use Tonight 🍝
                    </AppText>
                  </Pressable>
                ) : (
                  <View style={styles.roundBtn}>
                    {index === 2 ? <Check size={18} color={colors.onSurfaceVariant} /> : <PlusCircle size={18} color={colors.onSurfaceVariant} />}
                  </View>
                )}
              </View>
              {index === 0 && item.neededFor ? (
                <View style={styles.matchRow}>
                  <View style={styles.row}>
                    <Lightbulb size={15} color={colors.primary} />
                    <AppText variant="labelSm" color={colors.primary} numberOfLines={1}>
                      Matches: {item.neededFor}
                    </AppText>
                  </View>
                  <AppText variant="labelSm" style={styles.semibold}>
                    {item.unitLabel}
                  </AppText>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.lowCard}>
          <View style={[styles.rowBetween, styles.wrap]}>
            <View style={[styles.row, styles.flex]}>
              <View style={styles.lowIcon}>
                <Warning size={20} color={colors.onTertiaryFixed} />
              </View>
              <View style={styles.flex}>
                <AppText variant="labelLg" style={styles.bold} numberOfLines={1}>
                  Low Stock Radar
                </AppText>
                <AppText variant="bodySm" color={colors.onSurfaceVariant} numberOfLines={2}>
                  Required for upcoming feast plan
                </AppText>
              </View>
            </View>
            <Pressable
              onPress={() => {
                setAddedAll(true);
                showToast('Low-stock items added to the grocery list', 'success');
                setTimeout(() => setAddedAll(false), 2500);
              }}
              style={[styles.addAll, addedAll && styles.addAllOn]}>
              <AppText variant="labelSm" color={addedAll ? colors.onSecondaryContainer : colors.onPrimaryFixed} style={styles.bold}>
                {addedAll ? '✓ Added to Cart!' : '+ Add All (3)'}
              </AppText>
            </Pressable>
          </View>
          {low.slice(0, 3).map(item => (
            <View key={item.id} style={styles.lowRow}>
              <View style={[styles.rowBetween, styles.wrap]}>
                <View style={[styles.row, styles.flex, styles.wrap]}>
                  <AppText variant="bodySm" style={styles.semibold} numberOfLines={1}>
                    {item.name}
                  </AppText>
                  <AppText variant="labelSm" color={item.percentLeft === 10 ? colors.error : item.percentLeft === 15 ? colors.tertiary : colors.onSurfaceVariant} style={styles.bold} numberOfLines={1}>
                    {item.statusLabel ?? `${item.percentLeft}% left`}
                  </AppText>
                </View>
                <View style={styles.row}>
                  {item.listed ? <ShoppingCart size={16} color={colors.primary} /> : <Plus size={16} color={colors.primary} />}
                  <AppText variant="labelSm" color={colors.primary} style={styles.bold}>
                    {item.listed ? 'List Added' : item.percentLeft === 25 ? 'Tracked' : 'Add to Cart'}
                  </AppText>
                </View>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${item.percentLeft ?? 25}%`,
                      backgroundColor: (item.percentLeft ?? 25) <= 10 ? colors.error : (item.percentLeft ?? 25) <= 15 ? colors.tertiary : colors.primary,
                    },
                  ]}
                />
              </View>
              {item.neededFor ? (
                <View style={styles.row}>
                  <ForkKnife size={14} color={colors.onSurfaceVariant} />
                  <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                    Needed for {item.neededFor}
                  </AppText>
                </View>
              ) : item.quantityLabel.includes('Auto-reorder') ? (
                <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                  {item.quantityLabel}
                </AppText>
              ) : null}
            </View>
          ))}
        </View>

          <View style={[styles.rowBetween, styles.wrap]}>
            <AppText variant="headlineMd" style={styles.bold} numberOfLines={1}>
              Kitchen Zones
            </AppText>
          <View style={styles.row}>
            <SortAscending size={14} color={colors.onSurfaceVariant} />
            <AppText variant="labelSm" color={colors.onSurfaceVariant}>
              Expiry First
            </AppText>
          </View>
        </View>
        <ZoneCard title="Dairy & Chilled Goods" subtitle={`${dairy.length} items • 2 expiring this week`} items={dairy} icon={<Snowflake size={18} color={colors.primary} />} />
        <ZoneCard title="Baking, Grains & Pasta" subtitle={`${grains.length} items • 1 critical restock`} items={grains} breakfast icon={<Bread size={18} color={colors.primary} />} />
        <ZoneCard title="Oils, Sauces & Spices" subtitle={`${spices.length} items • All active`} items={spices} icon={<CookingPot size={18} color={colors.primary} />} />

        <View style={styles.syncNote}>
          <View style={styles.syncIcon}>
            <ArrowsClockwise size={20} color={colors.onPrimary} />
          </View>
          <View style={styles.flex}>
            <AppText variant="labelLg" style={styles.bold}>
              Auto-Deduct Recipe Sync
            </AppText>
            <AppText variant="bodySm" color={colors.onSurfaceVariant}>
              When Mom marks "Lemon Garlic Herb Salmon" cooked tonight, 1 lemon, 2 sprigs dill, and 2 tbsp olive oil will auto-deduct.
            </AppText>
            <View style={styles.row}>
              <CheckCircle size={15} color={colors.secondary} />
              <AppText variant="labelSm" color={colors.secondary} style={styles.bold}>
                Household Sync Enabled
              </AppText>
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
      <View style={styles.dock}>
        <Pressable
          style={styles.addItem}
          onPress={() => showToast('Add pantry item from the grocery run or barcode scan.', 'info')}>
          <PlusCircle size={22} color={colors.onPrimary} />
            <AppText variant="labelLg" color={colors.onPrimary} style={styles.bold} numberOfLines={1}>
              Add Pantry Item
            </AppText>
        </Pressable>
        <Pressable
          style={styles.syncList}
          onPress={() => {
              navigation.navigate('GroceryHome');
            }}>
          <Handbag size={22} color={colors.primary} />
          <AppText variant="labelLg" style={styles.bold} numberOfLines={1}>
            Sync List
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  tone,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  tone?: 'danger' | 'tertiary';
  icon?: ReactNode;
}) {
  const bg = active
    ? colors.primary
    : tone === 'danger'
      ? colors.errorContainer
      : tone === 'tertiary'
        ? colors.tertiaryFixed
        : colors.surfaceContainer;
  const fg = active
    ? colors.onPrimary
    : tone === 'danger'
      ? colors.onErrorContainer
      : tone === 'tertiary'
        ? colors.onTertiaryFixed
        : colors.onSurfaceVariant;
  return (
    <Pressable onPress={onPress} style={[styles.filter, {backgroundColor: bg}]}>
      {icon}
      <AppText variant="labelSm" color={fg}>
        {label}
      </AppText>
    </Pressable>
  );
}

function ZoneCard({
  title,
  subtitle,
  items,
  breakfast,
  icon,
}: {
  title: string;
  subtitle: string;
  items: PantryItem[];
  breakfast?: boolean;
  icon: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const emoji: Record<string, string> = {
    'Whole Milk (1 Gal)': '🥛',
    'Greek Yogurt (Plain 32oz)': '🥣',
    'Sharp Cheddar Block': '🧀',
    'Jasmine Rice (5kg Bag)': '🍚',
    'Artisan Sourdough Loaf': '🍞',
    'King Arthur AP Flour': '🌾',
    'Toasted Sesame Oil (Kadoya)': '🍶',
    'Greek Cold-Pressed Olive Oil': '🫒',
  };
  return (
    <View style={styles.zone}>
      <Pressable onPress={() => setOpen(!open)} style={[styles.rowBetween, styles.wrap]}>
        <View style={[styles.row, styles.flex]}>
          <View style={styles.zoneIcon}>
            {icon}
          </View>
          <View style={styles.flex}>
            <AppText variant="labelLg" style={styles.bold} numberOfLines={1}>
              {title}
            </AppText>
            <AppText variant="labelSm" color={colors.onSurfaceVariant} numberOfLines={1}>
              {subtitle}
            </AppText>
          </View>
        </View>
        <CaretDown size={20} color={colors.onSurfaceVariant} />
      </Pressable>
      {open
        ? items.map(item => (
            <View key={item.id} style={styles.zoneRow}>
              <View style={[styles.row, styles.flex]}>
                <View style={styles.zoneEmoji}>
                  <AppText>{emoji[item.name] ?? '📦'}</AppText>
                </View>
                <View style={styles.flex}>
                  <View style={[styles.row, styles.wrap]}>
                    <AppText variant="labelMd" style={styles.semibold} numberOfLines={1}>
                      {item.name}
                    </AppText>
                    {item.statusLabel ? (
                      <View
                        style={[
                          styles.zonePill,
                          item.statusLabel === 'Fresh' || item.statusLabel === 'Sealed' || item.statusLabel === 'Plenty'
                            ? styles.zoneGreen
                            : styles.zoneGold,
                        ]}>
                        <AppText
                          variant="labelSm"
                          color={
                            item.statusLabel === 'Fresh' || item.statusLabel === 'Sealed' || item.statusLabel === 'Plenty'
                              ? colors.onSecondaryContainer
                              : colors.onTertiaryFixed
                          }>
                          {item.statusLabel}
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                  <AppText variant="labelSm" color={colors.onSurfaceVariant} numberOfLines={1}>
                    {item.quantityLabel}
                  </AppText>
                </View>
              </View>
              {item.unitLabel === '3/4' || item.unitLabel === '1/2' ? (
                <View style={styles.stepper}>
                  <View style={styles.stepBtn}>
                    <Minus size={14} color={colors.onSurface} />
                  </View>
                  <AppText variant="labelMd" style={styles.bold}>
                    {item.unitLabel}
                  </AppText>
                  <View style={styles.stepBtn}>
                    <Plus size={14} color={colors.onSurface} />
                  </View>
                </View>
              ) : breakfast && item.name.includes('Sourdough') ? (
                <View style={styles.breakfast}>
                  <AppText variant="labelSm" color={colors.primary} style={styles.semibold}>
                    Breakfast
                  </AppText>
                </View>
              ) : (
                <AppText variant="labelMd" color={item.statusLabel === 'Plenty' ? colors.secondary : colors.onSurface} style={styles.bold}>
                  {item.unitLabel ?? ''}
                </AppText>
              )}
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.surface},
  content: {padding: spacing.margin, gap: spacing.md, paddingBottom: 40},
  topBar: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8},
  row: {flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0},
  rowBetween: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, minWidth: 0},
  flex: {flex: 1, minWidth: 0},
  nowrap: {flexWrap: 'nowrap'},
  wrap: {flexWrap: 'wrap'},
  bold: {fontFamily: 'PlusJakartaSans-Bold'},
  semibold: {fontFamily: 'PlusJakartaSans-SemiBold'},
  back: {width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  livePill: {backgroundColor: colors.secondaryContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, flexShrink: 0},
  scan: {width: 40, height: 40, borderRadius: 16, backgroundColor: colors.primaryFixed, alignItems: 'center', justifyContent: 'center'},
  tune: {width: 40, height: 40, borderRadius: 16, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center'},
  search: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {flex: 1, minWidth: 0, color: colors.onSurface, fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, paddingVertical: 4},
  filters: {gap: 8, paddingRight: 20},
  filter: {minHeight: 32, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6},
  hero: {backgroundColor: colors.surfaceLowest, borderRadius: radii.card, padding: spacing.md, gap: 10},
  timerIcon: {width: 40, height: 40, borderRadius: 16, backgroundColor: colors.errorContainer, alignItems: 'center', justifyContent: 'center'},
  urgentPill: {backgroundColor: colors.errorContainer, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999},
  urgentCard: {backgroundColor: colors.surfaceLow, borderRadius: 16, padding: 12, gap: 8},
  urgentImgLg: {width: 48, height: 48, borderRadius: 12},
  urgentImg: {width: 44, height: 44, borderRadius: 12},
  expPill: {paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6},
  expRed: {backgroundColor: colors.errorContainer},
  expGold: {backgroundColor: colors.tertiaryFixed},
  useTonight: {backgroundColor: colors.primary, paddingHorizontal: 12, minHeight: 36, paddingVertical: 6, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  roundBtn: {width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center'},
  matchRow: {backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: 6, flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap'},
  lowCard: {backgroundColor: colors.surfaceLowest, borderRadius: radii.card, padding: spacing.md, gap: 12},
  lowIcon: {width: 36, height: 36, borderRadius: 12, backgroundColor: colors.tertiaryFixed, alignItems: 'center', justifyContent: 'center'},
  addAll: {backgroundColor: colors.primaryFixed, paddingHorizontal: 10, paddingVertical: 8, minHeight: 32, borderRadius: 999, flexShrink: 0},
  addAllOn: {backgroundColor: colors.secondaryContainer},
  lowRow: {gap: 6},
  barTrack: {height: 8, backgroundColor: colors.surfaceContainer, borderRadius: 999, overflow: 'hidden'},
  barFill: {height: 8, borderRadius: 999},
  zone: {backgroundColor: colors.surfaceLowest, borderRadius: radii.card, padding: spacing.md, gap: 12},
  zoneIcon: {width: 32, height: 32, borderRadius: 12, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center'},
  zoneRow: {backgroundColor: colors.surfaceLow, borderRadius: 16, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap'},
  zoneEmoji: {width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceLowest, alignItems: 'center', justifyContent: 'center'},
  zonePill: {paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999},
  zoneGreen: {backgroundColor: colors.secondaryContainer},
  zoneGold: {backgroundColor: colors.tertiaryFixed},
  stepper: {flexDirection: 'row', alignItems: 'center', gap: 4},
  stepBtn: {width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surfaceLowest, alignItems: 'center', justifyContent: 'center'},
  breakfast: {backgroundColor: colors.surfaceLowest, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999},
  syncNote: {backgroundColor: colors.surfaceHigh, borderRadius: radii.card, padding: spacing.md, flexDirection: 'row', gap: 12},
  syncIcon: {width: 40, height: 40, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center'},
  dock: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.margin,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(248,249,255,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
  },
  addItem: {flex: 1, minWidth: 0, minHeight: 52, paddingHorizontal: 8, borderRadius: 16, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6},
  syncList: {minHeight: 52, paddingHorizontal: 12, borderRadius: 16, backgroundColor: colors.surfaceHighest, flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0},
});
