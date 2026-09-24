import {useEffect, useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import Animated, {Easing, useAnimatedStyle, useSharedValue, withTiming} from 'react-native-reanimated';
import {Check, PencilSimple, Plus, Trash} from 'phosphor-react-native';
import {colors, fonts, hitSlop, radii, shadows, spacing} from '../theme/tokens';
import {AppButton, AppText, EmptyState, ScreenHeader} from '../components/ui';
import {services} from '../services';
import {queryClient} from '../app/queryClient';
import {useAppStore} from '../store/useAppStore';
import type {GroceryStackProps} from '../app/navigation/types';
import type {GroceryItem, PantryItem} from '../domain/types';

type ListTab = 'inventory' | 'shopping';
type Editor = {list: ListTab; id: string} | null;

const TAB_TIMING = {duration: 240, easing: Easing.out(Easing.cubic)};

export function GroceryScreen({navigation}: GroceryStackProps<'GroceryHome'>) {
  const grocery = useAppStore(state => state.snapshot.grocery);
  const inventory = useAppStore(state => state.snapshot.pantry);
  const showToast = useAppStore(state => state.showToast);
  const shopping = grocery.filter(item => !item.desk);
  const allBought = shopping.length > 0 && shopping.every(item => item.checked);

  const [tab, setTab] = useState<ListTab>('shopping');
  const progress = useSharedValue(tab === 'shopping' ? 1 : 0);
  const trackWidth = useSharedValue(0);
  const pageWidth = useSharedValue(0);
  const [inventoryDraft, setInventoryDraft] = useState('');
  const [shoppingDraft, setShoppingDraft] = useState('');
  const [pagerWidth, setPagerWidth] = useState(0);
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [editing, setEditing] = useState<Editor>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({queryKey: ['grocery']}),
      queryClient.invalidateQueries({queryKey: ['pantry']}),
    ]);

  useEffect(() => {
    progress.value = withTiming(tab === 'shopping' ? 1 : 0, TAB_TIMING);
  }, [progress, tab]);

  const pillStyle = useAnimatedStyle(() => {
    const inner = Math.max(trackWidth.value - 8, 0);
    const segment = inner / 2;
    return {
      width: segment,
      transform: [{translateX: progress.value * segment}],
    };
  });

  const pagesStyle = useAnimatedStyle(() => ({
    transform: [{translateX: -progress.value * pageWidth.value}],
  }));

  const switchTab = (next: ListTab) => {
    setTab(next);
  };

  const addInventory = async () => {
    const next = inventoryDraft.trim();
    if (!next) {
      return;
    }
    setInventoryDraft('');
    await services.grocery.addPantry(next);
    showToast('Added to inventory', 'success');
    await refresh();
  };

  const addShopping = async () => {
    const next = shoppingDraft.trim();
    if (!next) {
      return;
    }
    setShoppingDraft('');
    await services.grocery.addGrocery(next, {pending: false});
    showToast('Added to the shopping list', 'success');
    await refresh();
  };

  const createList = async () => {
    setCreating(true);
    try {
      const before = new Set(shopping.map(item => item.name.toLowerCase()));
      const next = await services.grocery.syncFromPlan();
      const added = next.filter(item => !item.desk && !before.has(item.name.toLowerCase())).length;
      showToast(
        added
          ? `Added ${added} ${added === 1 ? 'ingredient' : 'ingredients'} from this week’s meals`
          : 'This week’s meals are already on the list',
        'success',
      );
      await refresh();
    } finally {
      setCreating(false);
    }
  };

  const toggle = (id: string) => {
    void services.grocery.toggleGrocery(id);
  };

  const openShopping = (item: GroceryItem) => {
    setEditing({list: 'shopping', id: item.id});
    setName(item.name);
    setQuantity(item.quantity ?? '');
  };

  const openInventory = (item: PantryItem) => {
    setEditing({list: 'inventory', id: item.id});
    setName(item.name);
    setQuantity(item.quantityLabel ?? '');
  };

  const closeEdit = () => {
    if (saving) {
      return;
    }
    setEditing(null);
  };

  const saveEdit = async () => {
    if (!editing || !name.trim()) {
      return;
    }
    setSaving(true);
    try {
      if (editing.list === 'shopping') {
        await services.grocery.updateGrocery(editing.id, {name: name.trim(), quantity: quantity.trim()});
      } else {
        await services.grocery.updatePantry(editing.id, {name: name.trim(), quantity: quantity.trim()});
      }
      setEditing(null);
      showToast('Item updated', 'success');
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) {
      return;
    }
    setSaving(true);
    try {
      if (editing.list === 'shopping') {
        await services.grocery.removeGrocery(editing.id);
        showToast('Removed from the shopping list', 'success');
      } else {
        await services.grocery.removePantry(editing.id);
        showToast('Removed from inventory', 'success');
      }
      setEditing(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const complete = async () => {
    setCompleting(true);
    try {
      await services.grocery.completeShopping();
      showToast('Added to inventory', 'success');
      setTab('inventory');
      await refresh();
    } finally {
      setCompleting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="Grocery" onProfile={() => navigation.navigate('HouseholdShare')} />
      <View
        style={styles.tabs}
        onLayout={event => {
          trackWidth.value = event.nativeEvent.layout.width;
        }}>
        <Animated.View pointerEvents="none" style={[styles.pill, pillStyle]} />
        <TabButton label="Inventory" selected={tab === 'inventory'} onPress={() => switchTab('inventory')} />
        <TabButton label="Shopping list" selected={tab === 'shopping'} onPress={() => switchTab('shopping')} />
      </View>
      <View
        style={styles.pager}
        onLayout={event => {
          const width = event.nativeEvent.layout.width;
          pageWidth.value = width;
          setPagerWidth(width);
        }}>
        <Animated.View style={[styles.pages, {width: pagerWidth * 2}, pagesStyle]}>
          <View style={[styles.page, {width: pagerWidth}]}>
            <KeyboardAwareScrollView
              style={styles.flex}
              contentContainerStyle={styles.content}
              enableOnAndroid
              extraScrollHeight={24}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag">
              <AddRow
                label="Add inventory item"
                placeholder="Add an item you have"
                value={inventoryDraft}
                onChangeText={setInventoryDraft}
                onAdd={addInventory}
              />
              {!inventory.length ? (
                <EmptyState title="Nothing in inventory" body="Add items you already have at home." />
              ) : null}
              {inventory.map(item => (
                <StockRow key={item.id} name={item.name} quantity={item.quantityLabel} onEdit={() => openInventory(item)} />
              ))}
            </KeyboardAwareScrollView>
          </View>
          <View style={[styles.page, {width: pagerWidth}]}>
            <KeyboardAwareScrollView
              style={styles.flex}
              contentContainerStyle={styles.content}
              enableOnAndroid
              extraScrollHeight={24}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag">
              <AppButton
                label="Create shopping list"
                loading={creating}
                onPress={createList}
                accessibilityLabel="Create shopping list from this week’s meals"
              />
              <AppText variant="bodySm" color={colors.onSurfaceVariant}>
                Pulls ingredients from the meals planned this week.
              </AppText>
              <AddRow
                label="Add shopping item"
                placeholder="Add an item to buy"
                value={shoppingDraft}
                onChangeText={setShoppingDraft}
                onAdd={addShopping}
              />
              {!shopping.length ? (
                <EmptyState
                  title="Nothing on the list"
                  body="Create a shopping list from this week’s meals, or add an item above."
                />
              ) : null}
              {shopping.map(item => (
                <ShoppingRow key={item.id} item={item} onToggle={() => toggle(item.id)} onEdit={() => openShopping(item)} />
              ))}
            </KeyboardAwareScrollView>
            {allBought ? (
              <View style={styles.footer}>
                <AppButton
                  label="Complete shopping"
                  loading={completing}
                  onPress={complete}
                  accessibilityLabel="Complete shopping and add items to inventory"
                />
              </View>
            ) : null}
          </View>
        </Animated.View>
      </View>

      <Modal visible={editing != null} transparent animationType="fade" onRequestClose={closeEdit}>
        <KeyboardAvoidingView style={styles.scrim} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.scrimPress} onPress={closeEdit}>
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <AppText variant="headlineMd">Edit item</AppText>
              <TextInput
                accessibilityLabel="Item name"
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor={colors.outline}
                style={styles.input}
                autoFocus
              />
              <TextInput
                accessibilityLabel="Quantity"
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Quantity"
                placeholderTextColor={colors.outline}
                style={styles.input}
              />
              <View style={styles.sheetActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove item"
                  onPress={remove}
                  disabled={saving}
                  hitSlop={hitSlop}
                  style={styles.remove}>
                  <Trash size={18} color={colors.error} />
                  <AppText variant="labelMd" color={colors.error}>
                    Remove
                  </AppText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save item"
                  onPress={saveEdit}
                  disabled={saving || !name.trim()}
                  style={[styles.save, (!name.trim() || saving) && styles.addBtnOff]}>
                  <AppText variant="labelMd" color={colors.onPrimary}>
                    Save
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

function AddRow({
  label,
  placeholder,
  value,
  onChangeText,
  onAdd,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <View style={styles.addRow}>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onAdd}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        returnKeyType="done"
        style={styles.addInput}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add item"
        onPress={onAdd}
        disabled={!value.trim()}
        style={({pressed}) => [styles.addBtn, !value.trim() && styles.addBtnOff, pressed && styles.pressed]}>
        <Plus size={20} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

function TabButton({label, selected, onPress}: {label: string; selected: boolean; onPress: () => void}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{selected}}
      onPress={onPress}
      style={styles.tab}>
      <AppText variant="labelMd" color={selected ? colors.primary : colors.onSurfaceVariant} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

function StockRow({name, quantity, onEdit}: {name: string; quantity?: string; onEdit: () => void}) {
  return (
    <View style={styles.item}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${name}`}
        onPress={onEdit}
        style={styles.itemBody}>
        <AppText variant="bodyMd" numberOfLines={2} style={styles.itemTitle}>
          {name}
        </AppText>
        {quantity ? (
          <AppText variant="labelSm" color={colors.onSurfaceVariant} numberOfLines={1}>
            {quantity}
          </AppText>
        ) : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${name}`}
        onPress={onEdit}
        hitSlop={hitSlop}
        style={styles.edit}>
        <PencilSimple size={18} color={colors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

function ShoppingRow({
  item,
  onToggle,
  onEdit,
}: {
  item: GroceryItem;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const [checked, setChecked] = useState(item.checked);

  useEffect(() => {
    setChecked(item.checked);
  }, [item.checked]);

  return (
    <View style={[styles.item, checked && styles.itemOn]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={item.name}
        accessibilityState={{checked}}
        onPress={() => {
          setChecked(value => !value);
          onToggle();
        }}
        hitSlop={hitSlop}
        style={[styles.check, checked ? styles.checkOn : styles.checkOff]}>
        <Check size={16} color={checked ? colors.onSecondary : 'transparent'} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.name}`}
        onPress={onEdit}
        style={styles.itemBody}>
        <AppText variant="bodyMd" numberOfLines={2} style={[styles.itemTitle, checked && styles.strike]}>
          {item.name}
        </AppText>
        {item.quantity ? (
          <AppText variant="labelSm" color={colors.onSurfaceVariant} numberOfLines={1}>
            {item.quantity}
          </AppText>
        ) : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${item.name}`}
        onPress={onEdit}
        hitSlop={hitSlop}
        style={styles.edit}>
        <PencilSimple size={18} color={colors.onSurfaceVariant} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.surface},
  flex: {flex: 1},
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.margin,
    marginTop: spacing.sm,
    padding: 4,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceContainer,
  },
  pill: {
    position: 'absolute',
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceLowest,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pager: {flex: 1, overflow: 'hidden'},
  pages: {flexDirection: 'row', height: '100%'},
  page: {height: '100%'},
  content: {padding: spacing.margin, gap: spacing.md, paddingBottom: 32},
  addRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  addInput: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 16,
    color: colors.onSurface,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnOff: {opacity: 0.45},
  pressed: {opacity: 0.88},
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceLowest,
    minWidth: 0,
  },
  itemOn: {backgroundColor: colors.surfaceLow},
  itemBody: {flex: 1, minWidth: 0, gap: 2},
  itemTitle: {fontFamily: fonts.bold},
  strike: {textDecorationLine: 'line-through', opacity: 0.6},
  check: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {backgroundColor: colors.secondary},
  checkOff: {backgroundColor: colors.surfaceContainer},
  edit: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.margin,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    ...shadows.tabBar,
  },
  scrim: {flex: 1},
  scrimPress: {
    flex: 1,
    backgroundColor: 'rgba(18,28,42,0.45)',
    justifyContent: 'center',
    padding: spacing.margin,
  },
  sheet: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: radii.card,
    padding: 20,
    gap: 12,
  },
  input: {
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 16,
    color: colors.onSurface,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  sheetActions: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8},
  remove: {flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 4},
  save: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
