import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  Barcode,
  Basket,
  Check,
  Heart,
  Microphone,
  Package,
  PlusCircle,
  Warning,
  CalendarBlank,
  Hourglass,
  ForkKnife,
  Signpost,
} from 'phosphor-react-native';
import { colors, radii, spacing } from '../theme/tokens';
import { AppText, ScreenHeader, Shimmer } from '../components/ui';
import { EmptyState } from '../components/ui';
import { useGrocery, usePantry } from '../hooks/useFamFeast';
import { services } from '../services';
import { queryClient } from '../app/queryClient';
import { useAppStore } from '../store/useAppStore';
import type { GroceryStackProps } from '../app/navigation/types';
import type { GroceryItem } from '../domain/types';

const QUICK_CHIPS = [
  '🥛 Whole Milk',
  '🥑 Avocados',
  '🥚 Farm Eggs',
  '🍚 Jasmine Rice',
];

export function GroceryScreen({
  navigation,
}: GroceryStackProps<'GroceryHome'>) {
  const query = useGrocery();
  const pantryQuery = usePantry();
  const snapshot = useAppStore(state => state.snapshot);
  const items = (query.data ?? snapshot.grocery).filter(item => !item.desk);
  const desk = (query.data ?? snapshot.grocery).filter(item => item.desk);
  const pantry = pantryQuery.data ?? snapshot.pantry;
  const [draft, setDraft] = useState('');
  const [aisleSort, setAisleSort] = useState(false);
  const [done, setDone] = useState(false);
  const showToast = useAppStore(state => state.showToast);
  const dad = snapshot.members.find(member => member.id === 'dad');

  const list = aisleSort
    ? [...items].sort((a, b) =>
        (a.locationHint ?? a.aisle).localeCompare(b.locationHint ?? b.aisle),
      )
    : items;
  const produce = list.filter(item => item.category === 'produce');
  const meat = list.filter(item => item.category === 'meat');
  const aisle = list.filter(item => item.category === 'aisle');
  const checked = items.filter(item => item.checked).length;
  const pct = items.length ? Math.round((checked / items.length) * 100) : 0;
  const cornstarch = pantry.find(item => item.id === 'p4');
  const honey = pantry.find(item => item.id === 'p5');
  const restock = [cornstarch, honey].filter(Boolean);

  const add = async (name: string) => {
    if (!name.trim()) {
      return;
    }
    await services.grocery.addGrocery(name.trim());
    setDraft('');
    await queryClient.invalidateQueries({ queryKey: ['grocery'] });
  };

  const toggle = async (id: string) => {
    await services.grocery.toggleGrocery(id);
    await queryClient.invalidateQueries({ queryKey: ['grocery'] });
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader
        subtitle="Grocery & Pantry"
        onProfile={() => navigation.navigate('HouseholdShare')}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.syncCard}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <View style={styles.liveWrap}>
                  <View style={styles.livePing} />
                  <View style={styles.liveDot} />
                </View>
                <AppText
                  variant="labelSm"
                  color={colors.secondary}
                  style={styles.liveCaps}
                >
                  Live Store Sync
                </AppText>
              </View>
              <View style={styles.weekPill}>
                <CalendarBlank size={15} color={colors.primary} />
                <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                  Week {snapshot.plan.weekId.split('-W')[1]} Feasts
                </AppText>
              </View>
            </View>
            <View style={styles.shopper}>
              <View style={[styles.row, styles.flex, styles.nowrap]}>
                <View>
                  <View style={styles.dadFace}>
                    <AppText>{dad?.emoji ?? '👨'}</AppText>
                  </View>
                  <View style={styles.cartBadge}>
                    <Basket size={12} color={colors.onSecondary} />
                  </View>
                </View>
                <View style={styles.flex}>
                  <AppText variant="labelLg" numberOfLines={1}>
                    Dad (Mark) is at Trader Joe’s
                  </AppText>
                  <AppText
                    variant="bodySm"
                    color={colors.onSurfaceVariant}
                    numberOfLines={2}
                  >
                    {items.length - checked} items remaining • Updated 2m ago
                  </AppText>
                </View>
              </View>
              <Pressable
                onPress={() => setAisleSort(!aisleSort)}
                style={[styles.aisleBtn, aisleSort && styles.aisleOn]}
                accessibilityRole="button"
              >
                <Signpost size={16} color={colors.onPrimary} />
                <AppText
                  variant="labelMd"
                  color={colors.onPrimary}
                  numberOfLines={1}
                >
                  {aisleSort ? 'Sorted 📍' : 'Aisle Sort'}
                </AppText>
              </Pressable>
            </View>
            <View style={styles.rowBetween}>
              <View style={[styles.row, { flex: 1 }]}>
                <ForkKnife size={14} color={colors.tertiary} />
                <AppText
                  variant="labelSm"
                  color={colors.onSurfaceVariant}
                  numberOfLines={1}
                  style={{ flex: 1 }}
                >
                  Auto-synced: Crispy Chicken, Thai Curry & Detroit Pizza
                </AppText>
              </View>
              <AppText
                variant="labelSm"
                color={colors.primary}
                style={styles.bold}
              >
                3 Meals
              </AppText>
            </View>
          </View>

          <View style={styles.segment}>
            <View style={styles.segmentOn}>
              <Basket size={18} color={colors.primary} />
              <AppText
                variant="labelMd"
                color={colors.primary}
                style={styles.bold}
                numberOfLines={1}
              >
                Supermarket ({items.length})
              </AppText>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Pantry')}
              style={styles.segmentOff}
              accessibilityRole="button"
            >
              <Package size={18} color={colors.onSurfaceVariant} />
              <AppText
                variant="labelMd"
                color={colors.onSurfaceVariant}
                style={styles.bold}
                numberOfLines={1}
              >
                Pantry (82%)
              </AppText>
            </Pressable>
          </View>

          <View style={styles.addCard}>
            <View style={styles.addRow}>
              <PlusCircle
                size={20}
                color={colors.onSurfaceVariant}
                style={styles.addIcon}
              />
              <TextInput
                accessibilityLabel="Add grocery item"
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => add(draft)}
                placeholder="Add milk, honey, scallions..."
                placeholderTextColor={colors.onSurfaceVariant}
                style={styles.addInput}
              />
              <View style={styles.addActions}>
                <Pressable
                  accessibilityLabel="Voice input"
                  style={styles.miniBtn}
                >
                  <Microphone size={18} color={colors.onSurfaceVariant} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Scan barcode"
                  style={styles.miniBtn}
                >
                  <Barcode size={18} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <AppText
                variant="labelSm"
                color={colors.onSurfaceVariant}
                style={styles.bold}
              >
                Quick +
              </AppText>
              {QUICK_CHIPS.map(chip => (
                <Pressable
                  key={chip}
                  onPress={() => setDraft(chip.replace(/^[^\s]+\s/, ''))}
                  style={styles.quickChip}
                >
                  <AppText variant="labelSm">+ {chip}</AppText>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.craving}>
            <View style={[styles.rowBetween, styles.wrap]}>
              <View style={[styles.row, styles.flex, styles.wrap]}>
                <Heart size={20} color={colors.tertiary} />
                <AppText
                  variant="headlineMd"
                  style={styles.bold}
                  numberOfLines={1}
                >
                  Family Craving Desk
                </AppText>
              </View>
              <View style={styles.pinned}>
                <AppText
                  variant="labelSm"
                  color={colors.tertiary}
                  style={styles.bold}
                >
                  {desk.length} Pinned
                </AppText>
              </View>
            </View>
            <View style={styles.craveGrid}>
              {desk.map(item => (
                <View key={item.id} style={styles.craveCard}>
                  <View style={styles.rowBetween}>
                    <View
                      style={[
                        styles.craveFace,
                        {
                          backgroundColor:
                            item.requestedBy === 'maya'
                              ? colors.secondaryFixed
                              : item.requestedBy === 'leo'
                              ? colors.tertiaryFixed
                              : colors.primaryFixed,
                        },
                      ]}
                    >
                      <AppText>
                        {item.requestedBy === 'maya'
                          ? '👧'
                          : item.requestedBy === 'leo'
                          ? '👦'
                          : '👨'}
                      </AppText>
                    </View>
                    <AppText
                      variant="labelSm"
                      color={
                        item.urgent
                          ? colors.tertiary
                          : item.checked
                          ? colors.secondary
                          : colors.primary
                      }
                      style={styles.bold}
                    >
                      {item.voteLabel}
                    </AppText>
                  </View>
                  <AppText
                    variant="labelMd"
                    style={styles.bold}
                    numberOfLines={2}
                  >
                    {item.name}
                  </AppText>
                  <AppText
                    variant="labelSm"
                    color={colors.onSurfaceVariant}
                    numberOfLines={1}
                  >
                    {item.deskHint}
                  </AppText>
                  <Pressable
                    onPress={() => toggle(item.id)}
                    style={[
                      styles.craveBtn,
                      item.deskAction === 'In Cart'
                        ? styles.cravePrimary
                        : item.deskAction === 'Add $4.20'
                        ? styles.craveGreen
                        : styles.craveNeutral,
                    ]}
                  >
                    <AppText
                      variant="labelSm"
                      color={
                        item.deskAction === 'Add $4.20'
                          ? colors.onSecondaryContainer
                          : item.deskAction === '+ Add'
                          ? colors.onSurface
                          : colors.onPrimary
                      }
                      style={styles.bold}
                    >
                      {item.deskAction}
                    </AppText>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.restock}>
            <View style={[styles.rowBetween, styles.wrap]}>
              <View style={[styles.row, styles.flex]}>
                <View style={styles.alertIcon}>
                  <Warning size={18} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText
                    variant="headlineMd"
                    style={styles.bold}
                    numberOfLines={2}
                  >
                    Pantry Restock & Expiry
                  </AppText>
                  <AppText
                    variant="labelSm"
                    color={colors.onSurfaceVariant}
                    numberOfLines={1}
                  >
                    Avoid dinner-prep surprises
                  </AppText>
                </View>
              </View>
              <View style={styles.critical}>
                <AppText
                  variant="labelSm"
                  color={colors.primary}
                  style={styles.bold}
                >
                  {restock.length} Critical
                </AppText>
              </View>
            </View>
            <View style={styles.lowGrid}>
              {restock.map(item => (
                <View key={item!.id} style={styles.lowCard}>
                  <View style={styles.rowBetween}>
                    <AppText variant="labelMd" style={styles.bold}>
                      {item!.name}
                    </AppText>
                    <AppText
                      variant="labelSm"
                      color={
                        item!.percentLeft === 10
                          ? colors.error
                          : colors.tertiary
                      }
                      style={styles.bold}
                    >
                      {item!.percentLeft}% left
                    </AppText>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${item!.percentLeft ?? 10}%`,
                          backgroundColor:
                            (item!.percentLeft ?? 10) <= 10
                              ? colors.error
                              : colors.tertiary,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.rowBetween}>
                    <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                      {item!.id === 'p4' ? 'Needed for Wed' : 'Glaze recipe'}
                    </AppText>
                    <Pressable
                      onPress={() => add(item!.name)}
                      style={styles.listBtn}
                    >
                      <AppText
                        variant="labelSm"
                        color={colors.onPrimary}
                        style={styles.bold}
                      >
                        + List
                      </AppText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.waste}>
              <View style={[styles.row, styles.flex]}>
                <Hourglass size={20} color={colors.secondary} />
                <AppText
                  variant="bodySm"
                  numberOfLines={2}
                  color={colors.onSecondaryContainer}
                  style={styles.flex}
                >
                  <AppText
                    variant="bodySm"
                    color={colors.onSecondaryContainer}
                    style={styles.bold}
                  >
                    Heavy Cream
                  </AppText>{' '}
                  expires in 2 days!
                </AppText>
              </View>
              <Pressable
                onPress={() => navigation.navigate('Schedule')}
                style={styles.planBtn}
              >
                <AppText
                  variant="labelSm"
                  color={colors.secondary}
                  style={styles.bold}
                >
                  Plan Tomato Pasta
                </AppText>
              </Pressable>
            </View>
          </View>

          {query.isLoading && !items.length ? (
            <Shimmer height={200} radius={24} />
          ) : null}
          {items.length === 0 ? (
            <EmptyState
              title="List is empty"
              body="Add a craving or sync ingredients from planned meals."
            />
          ) : (
            <>
              <CategoryBlock
                title="Fresh Produce & Herbs"
                subtitle="Trader Joe’s • Dept 1"
                icon="🥬"
                items={produce}
                badge={`${produce.filter(i => i.checked).length} of ${
                  produce.length
                } bought`}
                onToggle={toggle}
                members={snapshot.members}
              />
              <CategoryBlock
                title="Poultry & Meats"
                subtitle="Butcher Counter • Back Wall"
                icon="🍗"
                items={meat}
                badge="1 Urgent"
                urgent
                onToggle={toggle}
                members={snapshot.members}
              />
              <CategoryBlock
                title="Aisles & Sauces"
                subtitle="Aisle 3 & 4 (International)"
                icon="🍜"
                iconBg={colors.tertiaryFixed}
                items={aisle}
                badge={`${aisle.filter(i => i.checked).length} of ${
                  aisle.length
                } bought`}
                onToggle={toggle}
                members={snapshot.members}
              />
            </>
          )}

          <View style={styles.tally}>
            <View style={styles.rowBetween}>
              <View>
                <View style={styles.row}>
                  <AppText variant="headlineMd" style={styles.heroTitle}>
                    $42.50
                  </AppText>
                  <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                    / $65 weekly budget
                  </AppText>
                </View>
                <AppText
                  variant="labelSm"
                  color={colors.secondary}
                  style={styles.bold}
                >
                  {checked} of {items.length} items checked ({pct}%)
                </AppText>
              </View>
              <View style={styles.gauge}>
                <Svg width={44} height={44} viewBox="0 0 36 36">
                  <Circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke={colors.surfaceContainer}
                    strokeWidth="3.5"
                  />
                  <Circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke={colors.secondary}
                    strokeWidth="3.5"
                    strokeDasharray={`${pct}, 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </Svg>
                <AppText variant="labelSm" style={styles.gaugeText}>
                  {pct}%
                </AppText>
              </View>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: colors.secondary,
                    height: 8,
                  },
                ]}
              />
            </View>
            <Pressable
              onPress={() => {
                setDone(true);
                showToast('Pantry Stock Updated!', 'success');
                setTimeout(() => setDone(false), 2200);
              }}
              style={[styles.finish, done && styles.finishOn]}
            >
              <Check size={20} color={colors.onPrimary} />
              <AppText
                variant="labelLg"
                color={colors.onPrimary}
                style={styles.bold}
                numberOfLines={1}
              >
                {done
                  ? 'Pantry Stock Updated! 🎉'
                  : 'Finish Run & Stock Kitchen'}
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function CategoryBlock({
  title,
  subtitle,
  icon,
  iconBg,
  items,
  badge,
  urgent,
  onToggle,
  members,
}: {
  title: string;
  subtitle: string;
  icon: string;
  iconBg?: string;
  items: GroceryItem[];
  badge: string;
  urgent?: boolean;
  onToggle: (id: string) => void;
  members: { id: string; emoji?: string }[];
}) {
  if (!items.length) {
    return null;
  }
  return (
    <View style={styles.catCard}>
      <View style={[styles.rowBetween, styles.wrap]}>
        <View style={[styles.row, styles.flex, styles.nowrap]}>
          <View
            style={[
              styles.catIcon,
              {
                backgroundColor:
                  iconBg ??
                  (urgent ? colors.primaryFixed : colors.secondaryFixed),
              },
            ]}
          >
            <AppText>{icon}</AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="headlineMd" style={styles.bold} numberOfLines={1}>
              {title}
            </AppText>
            <AppText
              variant="labelSm"
              color={colors.onSurfaceVariant}
              numberOfLines={1}
            >
              {subtitle}
            </AppText>
          </View>
        </View>
        <View
          style={[
            styles.catBadge,
            urgent && { backgroundColor: colors.primaryFixed },
          ]}
        >
          <AppText
            variant="labelSm"
            color={urgent ? colors.onPrimaryFixed : colors.onSurface}
            style={styles.bold}
          >
            {badge}
          </AppText>
        </View>
      </View>
      {items.map(item => {
        const picker = members.find(member => member.id === item.pickedBy);
        return (
          <Pressable
            key={item.id}
            onPress={() => onToggle(item.id)}
            style={[styles.item, item.checked && styles.itemOn]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.checked }}
          >
            <View
              style={[
                styles.check,
                item.checked ? styles.checkOn : styles.checkOff,
              ]}
            >
              <Check
                size={16}
                color={item.checked ? colors.onSecondary : 'transparent'}
              />
            </View>
            <View style={styles.flex}>
              <View style={[styles.row, styles.wrap]}>
                <AppText
                  variant="bodyMd"
                  style={[styles.itemTitle, item.checked && styles.strike]}
                  numberOfLines={1}
                >
                  {item.name}
                </AppText>
                {item.tonight ? (
                  <View style={styles.tonight}>
                    <AppText
                      variant="labelSm"
                      color={colors.onErrorContainer}
                      style={styles.bold}
                    >
                      Tonight
                    </AppText>
                  </View>
                ) : null}
              </View>
              <View style={styles.row}>
                {item.quantity ? (
                  <View style={styles.qty}>
                    <AppText variant="labelSm" color={colors.onSurfaceVariant}>
                      {item.quantity}
                    </AppText>
                  </View>
                ) : null}
                {item.recipeLabel || item.helperLabel ? (
                  <AppText
                    variant="labelSm"
                    color={
                      item.kidsTask
                        ? colors.secondary
                        : item.recipeLabel?.includes('Glaze')
                        ? colors.tertiary
                        : colors.primary
                    }
                    style={item.kidsTask ? styles.bold : undefined}
                  >
                    {item.helperLabel ?? item.recipeLabel}
                  </AppText>
                ) : null}
              </View>
            </View>
            {item.kidsTask ? (
              <View style={styles.kids}>
                <AppText
                  variant="labelSm"
                  color={colors.onSecondaryFixed}
                  style={styles.bold}
                >
                  Kids Task
                </AppText>
              </View>
            ) : picker ? (
              <View style={styles.picker}>
                <AppText>{picker.emoji ?? '👨'}</AppText>
              </View>
            ) : (
              <AppText
                variant="labelSm"
                color={colors.onSurfaceVariant}
                style={styles.bold}
              >
                {item.priceLabel ?? item.locationHint ?? ''}
              </AppText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.margin, gap: spacing.md, paddingBottom: 120 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  flex: { flex: 1, minWidth: 0 },
  nowrap: { flexWrap: 'nowrap' },
  wrap: { flexWrap: 'wrap' },
  bold: { fontFamily: 'PlusJakartaSans-Bold' },
  heroTitle: { fontFamily: 'PlusJakartaSans-ExtraBold' },
  syncCard: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: 8,
  },
  liveWrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
    opacity: 0.35,
  },
  liveDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  liveCaps: {
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  weekPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  shopper: {
    backgroundColor: colors.surfaceLow,
    borderRadius: 16,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  dadFace: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    padding: 2,
  },
  aisleBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  aisleOn: { backgroundColor: colors.secondary },
  segment: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 16,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  segmentOn: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surfaceLowest,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentOff: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addCard: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.card,
    padding: 8,
    gap: 8,
  },
  addRow: { position: 'relative', justifyContent: 'center' },
  addIcon: { position: 'absolute', left: 12, zIndex: 1 },
  addInput: {
    borderRadius: 16,
    backgroundColor: colors.surfaceLow,
    paddingLeft: 40,
    paddingRight: 88,
    paddingVertical: 12,
    color: colors.onSurface,
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 16,
  },
  addActions: { position: 'absolute', right: 8, flexDirection: 'row', gap: 4 },
  miniBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { gap: 6, alignItems: 'center', paddingVertical: 2 },
  quickChip: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  craving: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: 8,
  },
  pinned: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  craveGrid: { flexDirection: 'row', gap: 8, minWidth: 0 },
  craveCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surfaceLowest,
    borderRadius: 16,
    padding: 10,
    gap: 4,
  },
  craveFace: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  craveBtn: {
    marginTop: 4,
    paddingVertical: 8,
    minHeight: 32,
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  craveGreen: { backgroundColor: colors.secondaryContainer },
  cravePrimary: { backgroundColor: colors.primary },
  craveNeutral: { backgroundColor: colors.surfaceContainer },
  restock: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: 8,
  },
  alertIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  critical: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  lowGrid: { flexDirection: 'row', gap: 8, minWidth: 0 },
  lowCard: {
    flex: 1,
    minWidth: 0,
    backgroundColor: colors.surfaceLow,
    borderRadius: 16,
    padding: 10,
    gap: 6,
  },
  barTrack: {
    height: 8,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 999 },
  listBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  waste: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  planBtn: {
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: 999,
    flexShrink: 0,
    justifyContent: 'center',
  },
  catCard: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: 10,
  },
  catIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.secondaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 999,
    flexShrink: 1,
    maxWidth: '48%',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.surfaceLowest,
    minWidth: 0,
  },
  itemOn: { backgroundColor: colors.surfaceLow },
  check: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.secondary },
  checkOff: { backgroundColor: colors.surfaceContainer },
  itemTitle: { fontFamily: 'PlusJakartaSans-Bold' },
  strike: { textDecorationLine: 'line-through', opacity: 0.6 },
  qty: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tonight: {
    backgroundColor: colors.errorContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  kids: {
    backgroundColor: colors.secondaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  picker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tally: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: 8,
  },
  gauge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeText: { position: 'absolute', fontFamily: 'PlusJakartaSans-Bold' },
  finish: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  finishOn: { backgroundColor: colors.secondary },
});
