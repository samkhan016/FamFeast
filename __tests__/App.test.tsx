/**
 * @format
 */

import {scoreRecipe} from '../src/services/mock/randomizer';
import {recipes} from '../src/services/mock/seed';

test('randomizer scores theme and mood matches higher than mismatches', () => {
  const recipe = recipes.find(item => item.id === 'honey-chicken');
  if (!recipe) {
    throw new Error('seed recipe missing');
  }
  const partyScore = scoreRecipe({
    recipe,
    theme: 'party',
    moodId: 'sweet',
    plannedRecipeIds: [],
    pantryFriendlyIds: [],
  });
  const alreadyPlanned = scoreRecipe({
    recipe,
    theme: 'party',
    moodId: 'sweet',
    plannedRecipeIds: ['honey-chicken'],
    pantryFriendlyIds: [],
  });
  expect(partyScore).toBeGreaterThan(alreadyPlanned);
});
