import {StyleSheet, View} from 'react-native';
import {colors} from '../theme/tokens';
import {AppButton, AppText, CachedImage, Card, Chip, Screen, ScreenHeader} from '../components/ui';
import {useAppStore} from '../store/useAppStore';
import {usePlanMutations} from '../hooks/useFamFeast';
import type {RootProps} from '../app/navigation/types';
import type {MealType} from '../domain/types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner'];

export function MealEditorScreen({navigation, route}: RootProps<'MealEditor'>) {
  const {date, mealType = 'dinner', slotId} = route.params;
  const snapshot = useAppStore(state => state.snapshot);
  const canEdit = useAppStore(state => state.canEdit());
  const showToast = useAppStore(state => state.showToast);
  const mutations = usePlanMutations();
  const slot =
    snapshot.plan.slots.find(item => item.id === slotId) ??
    snapshot.plan.slots.find(item => item.date === date && item.mealType === mealType);

  return (
    <Screen
      keyboard
      header={<ScreenHeader subtitle="Edit meal" onBack={() => navigation.goBack()} onProfile={() => navigation.navigate('HouseholdShare')} />}>
        <AppText variant="headlineLg">Replace or reassign</AppText>
        <AppText variant="bodySm" color={colors.onSurfaceVariant}>
          Changes apply to this slot only. The rest of the week stays intact.
        </AppText>
        <View style={styles.row}>
          {MEALS.map(type => (
            <Chip key={type} label={type} selected={slot?.mealType === type} />
          ))}
        </View>
        <AppText variant="labelLg">Assign chef</AppText>
        <View style={styles.row}>
          {snapshot.members.map(member => (
            <Chip
              key={member.id}
              label={member.name}
              selected={slot?.chefId === member.id}
              onPress={() => {
                if (!canEdit || !slot) {
                  showToast('Editors assign chefs.', 'info');
                  return;
                }
                mutations.updateSlot(slot.id, {chefId: member.id});
              }}
            />
          ))}
        </View>
        <AppText variant="labelLg">Pick a household dish</AppText>
        {snapshot.recipes.map(recipe => (
          <Card key={recipe.id}>
            <View style={styles.row}>
              <CachedImage uri={recipe.thumbnail} style={styles.thumb} label={recipe.title} />
              <View style={styles.flex}>
                <AppText variant="labelLg" numberOfLines={2}>
                  {recipe.title}
                </AppText>
                <AppText variant="labelSm" color={colors.onSurfaceVariant} numberOfLines={1}>
                  {recipe.cookMinutes} min • {recipe.category}
                </AppText>
              </View>
              <AppButton
                label={slot?.recipeId === recipe.id ? 'Selected' : 'Use'}
                variant={slot?.recipeId === recipe.id ? 'secondary' : 'tint'}
                style={styles.useBtn}
                onPress={() => {
                  if (!canEdit) {
                    showToast('Suggest this dish on the Voting board.', 'info');
                    return;
                  }
                  mutations.lockRecipe({
                    date,
                    mealType: slot?.mealType ?? mealType,
                    recipeId: recipe.id,
                    chefId: slot?.chefId,
                  });
                  navigation.goBack();
                }}
              />
            </View>
          </Card>
        ))}
        <AppButton label="Browse cookbook" variant="ghost" onPress={() => navigation.navigate('Cookbook')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center'},
  thumb: {width: 56, height: 56, borderRadius: 12},
  flex: {flex: 1, minWidth: 0},
  useBtn: {minHeight: 40, paddingVertical: 8, paddingHorizontal: 14, flexShrink: 0},
});
