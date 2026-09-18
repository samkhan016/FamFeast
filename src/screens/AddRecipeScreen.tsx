import {useState} from 'react';
import {StyleSheet, TextInput} from 'react-native';
import {colors, radii} from '../theme/tokens';
import {AppButton, AppText, Screen, ScreenHeader} from '../components/ui';
import {services} from '../services';
import {useAppStore} from '../store/useAppStore';
import {looksLikeUrl} from '../utils/youtube';
import {queryClient} from '../app/queryClient';
import type {RootProps} from '../app/navigation/types';

export function AddRecipeScreen({navigation}: RootProps<'AddRecipe'>) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const showToast = useAppStore(state => state.showToast);
  const canEdit = useAppStore(state => state.canEdit());

  const save = async () => {
    if (!canEdit) {
      showToast('Editors add recipes to the household cookbook.', 'info');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const recipe = looksLikeUrl(value)
        ? await services.recipes.addFromYouTube(value)
        : await services.recipes.addManual({title: value});
      await queryClient.invalidateQueries({queryKey: ['recipes']});
      showToast(`${recipe.title} saved to the cookbook`);
      navigation.replace('RecipeDetail', {recipeId: recipe.id});
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      keyboard
      header={<ScreenHeader subtitle="Add recipe" onBack={() => navigation.goBack()} onProfile={() => navigation.navigate('HouseholdShare')} />}>
      <AppText variant="headlineLg">Favourite dish or YouTube link</AppText>
      <AppText variant="bodySm" color={colors.onSurfaceVariant}>
        We store title, thumbnail, and source URL when the link is valid. Unsupported links stay out of the plan.
      </AppText>
      <TextInput
        accessibilityLabel="Recipe title or YouTube URL"
        value={value}
        onChangeText={setValue}
        placeholder="https://youtube.com/watch?v=... or Honey Garlic Chicken"
        placeholderTextColor={colors.outline}
        style={styles.input}
        autoCapitalize="none"
      />
      {error ? (
        <AppText variant="bodySm" color={colors.error}>
          {error}
        </AppText>
      ) : null}
      <AppButton label="Save to cookbook" loading={busy} onPress={save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 52,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.onSurface,
    fontFamily: 'PlusJakartaSans-Regular',
  },
});
