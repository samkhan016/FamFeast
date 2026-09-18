import type {MealType, MoodId, Recipe, WeeklyPlan} from '../../domain/types';
import type {WeeklyThemeId} from '../../theme/weeklyThemes';

const MOOD_TAG: Record<MoodId, string[]> = {
  exhausted: ['quick'],
  celebrate: ['party', 'kid-favorite'],
  sweet: ['sweet-light', 'light', 'healthy'],
  comfort: ['comfort'],
  busy: ['quick'],
  outside: [],
};

export function scoreRecipe(input: {
  recipe: Recipe;
  theme: WeeklyThemeId;
  moodId?: MoodId;
  chefSpecialty?: string;
  plannedRecipeIds: string[];
  pantryFriendlyIds: string[];
  maxCookMinutes?: number;
}): number {
  let score = 10;
  if (input.recipe.themes.includes(input.theme)) {
    score += 24;
  }
  if (input.moodId && input.recipe.moods.includes(input.moodId)) {
    score += 18;
  }
  if (input.moodId) {
    const tags = MOOD_TAG[input.moodId];
    if (tags.some(tag => input.recipe.tags.includes(tag))) {
      score += 10;
    }
  }
  if (input.maxCookMinutes && input.recipe.cookMinutes + input.recipe.prepMinutes > input.maxCookMinutes) {
    score -= 16;
  }
  if (input.plannedRecipeIds.includes(input.recipe.id)) {
    score -= 28;
  }
  if (input.recipe.favorite) {
    score += 8;
  }
  if (input.pantryFriendlyIds.includes(input.recipe.id)) {
    score += 12;
  }
  if (input.chefSpecialty) {
    const haystack = `${input.recipe.title} ${input.recipe.tags.join(' ')}`.toLowerCase();
    if (haystack.includes(input.chefSpecialty.toLowerCase().split(' ')[0] ?? '')) {
      score += 6;
    }
  }
  return Math.max(score, 1);
}

export function pickWeighted(recipes: Recipe[], scores: number[]): Recipe {
  const total = scores.reduce((sum, value) => sum + value, 0);
  let cursor = Math.random() * total;
  for (let i = 0; i < recipes.length; i += 1) {
    cursor -= scores[i];
    if (cursor <= 0) {
      return recipes[i];
    }
  }
  return recipes[recipes.length - 1];
}

export function explainMatch(recipe: Recipe, theme: WeeklyThemeId, moodId?: MoodId): string {
  if (moodId === 'exhausted') {
    return `Fast finish: ${recipe.cookMinutes + recipe.prepMinutes} minutes so the kitchen stays calm after a long day.`;
  }
  if (moodId === 'sweet') {
    return `Keeps tonight light and fresh — ${recipe.title} fits a sweet, easy craving.`;
  }
  if (moodId === 'comfort') {
    return `Warm and hearty without rebuilding the week. Perfect comfort pick.`;
  }
  if (theme === 'party') {
    return `Party Week energy: shareable, colorful, and fun for the whole table.`;
  }
  if (theme === 'healthy') {
    return `Garden-bright and balanced for Health Reset.`;
  }
  if (theme === 'quick') {
    return `Low-effort cook time so weeknights stay sane.`;
  }
  return `A household favorite that fits this week's ${theme} vibe.`;
}

export function mealTypeForRecipe(recipe: Recipe): MealType {
  if (recipe.category === 'breakfast') {
    return 'breakfast';
  }
  if (recipe.category === 'lunch') {
    return 'lunch';
  }
  return 'dinner';
}

export function plannedIds(plan: WeeklyPlan): string[] {
  return plan.slots.map(slot => slot.recipeId).filter((id): id is string => Boolean(id));
}
