import {Pressable, StyleSheet, View} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {colors, spacing} from '../theme/tokens';
import {AppButton, AppText, CachedImage, Card, Chip, EmptyState, ScreenHeader} from '../components/ui';
import {useRecipes} from '../hooks/useFamFeast';
import {useAppStore} from '../store/useAppStore';
import type {RootProps} from '../app/navigation/types';

export function CookbookScreen({navigation}: RootProps<'Cookbook'>) {
  const query = useRecipes();
  const recipes = query.data ?? useAppStore(state => state.snapshot.recipes);

  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="Cookbook" onBack={() => navigation.goBack()} onProfile={() => navigation.navigate('HouseholdShare')} />
      <View style={styles.content}>
        <AppButton label="Add YouTube or homemade dish" onPress={() => navigation.navigate('AddRecipe')} />
        {recipes.length === 0 ? (
          <EmptyState
            title="No favourite recipes yet"
            body="Paste a YouTube link or add a family classic to start planning."
            actionLabel="Add a recipe"
            onAction={() => navigation.navigate('AddRecipe')}
          />
        ) : (
          <FlashList
            data={recipes}
            keyExtractor={item => item.id}
            contentContainerStyle={{paddingBottom: 24}}
            renderItem={({item}) => (
              <Pressable onPress={() => navigation.navigate('RecipeDetail', {recipeId: item.id})}>
                <Card style={styles.card}>
                  <View style={styles.row}>
                    <CachedImage uri={item.thumbnail} style={styles.thumb} label={item.title} />
                    <View style={styles.flex}>
                      <AppText variant="labelLg" numberOfLines={2}>
                        {item.title}
                      </AppText>
                      <View style={[styles.row, styles.chips]}>
                        <Chip label={`${item.cookMinutes} min`} />
                        {item.favorite ? <Chip label="Favorite" tone="tertiary" /> : null}
                      </View>
                    </View>
                  </View>
                </Card>
              </Pressable>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.surface},
  content: {flex: 1, padding: spacing.margin, gap: spacing.md},
  card: {marginBottom: 10},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0},
  chips: {flexWrap: 'wrap', marginTop: 6},
  thumb: {width: 72, height: 72, borderRadius: 16, flexShrink: 0},
  flex: {flex: 1, minWidth: 0},
});
