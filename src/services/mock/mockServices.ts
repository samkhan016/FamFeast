import type {
  ChefNote,
  GroceryItem,
  Household,
  MealSlot,
  MealType,
  Member,
  MoodId,
  Recipe,
  Suggestion,
  YouTubeMeta,
} from '../../domain/types';
import type {WeeklyThemeId} from '../../theme/weeklyThemes';
import {createId} from '../../utils/ids';
import {addDaysISO, todayISO} from '../../utils/dates';
import {
  extractYouTubeId,
  isYouTubeUrl,
  looksLikeUrl,
  youtubeThumb,
  youtubeWatchUrl,
} from '../../utils/youtube';
import {colors} from '../../theme/tokens';
import type {
  FamFeastServices,
  GroceryService,
  HouseholdService,
  MealPlanService,
  RandomizerService,
  RecipeService,
  SpinInput,
  SuggestionService,
  YouTubeMetadataService,
} from '../interfaces';
import {loadSnapshot, maybeFail, replaceSnapshot, simulateLatency, updateSnapshot} from './database';
import {createDemoSnapshot, createEmptySnapshot, MOODS} from './seed';
import {explainMatch, pickWeighted, plannedIds, scoreRecipe} from './randomizer';

const AVATAR_COLORS = [colors.primaryFixed, colors.secondaryFixed, colors.tertiaryFixed, colors.surfaceHigh];

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'household';
}

function memberDefaults(name: string, index: number): Pick<Member, 'avatarInitial' | 'avatarColor' | 'displayName' | 'emoji'> {
  const emojis = ['👩', '🧔', '👦', '👧'];
  return {
    avatarInitial: name.trim().charAt(0).toUpperCase() || 'F',
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    displayName: name,
    emoji: emojis[index % emojis.length],
  };
}

const householdService: HouseholdService = {
  async bootstrap() {
    await simulateLatency(180, 420);
    return loadSnapshot();
  },
  async completeOnboarding({householdName, members, theme, useDemo}) {
    await simulateLatency();
    if (useDemo) {
      return replaceSnapshot(createDemoSnapshot());
    }
    const empty = createEmptySnapshot();
    const created = members.map((member, index) => ({
      id: createId('mem'),
      name: member.name,
      role: member.role,
      permission: member.permission,
      specialty: member.specialty,
      badge: member.role,
      helper: member.permission !== 'editor',
      photoUrl: undefined,
      ...memberDefaults(member.name, index),
    }));
    const snapshot = {
      ...empty,
      onboardingComplete: true,
      household: {
        ...empty.household,
        id: createId('hh'),
        name: householdName || 'Our Feast',
        slug: slugify(householdName || 'our-feast'),
        inviteCode: `${(householdName || 'FEAST').slice(0, 6).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`,
        theme,
        houseRule: created.length ? `${created[0].name} leads the week` : '',
      },
      members: created,
      currentMemberId: created[0]?.id ?? '',
      plan: {...empty.plan, theme},
    };
    return replaceSnapshot(snapshot);
  },
  async getHousehold() {
    await simulateLatency(120, 280);
    return loadSnapshot().household;
  },
  async updateHousehold(patch) {
    await simulateLatency(160, 320);
    return updateSnapshot(current => ({
      ...current,
      household: {...current.household, ...patch},
      plan: patch.theme ? {...current.plan, theme: patch.theme} : current.plan,
    })).household;
  },
  async listMembers() {
    await simulateLatency(120, 260);
    return loadSnapshot().members;
  },
  async addMember(input) {
    await simulateLatency();
    const snapshot = loadSnapshot();
    const member: Member = {
      id: createId('mem'),
      helper: input.helper,
      badge: input.badge,
      specialty: input.specialty,
      permission: input.permission,
      role: input.role,
      customRole: input.customRole,
      name: input.name,
      photoUrl: input.photoUrl,
      ...memberDefaults(input.name, snapshot.members.length),
      displayName: input.displayName ?? input.name,
    };
    updateSnapshot(current => ({...current, members: [...current.members, member]}));
    return member;
  },
  async updateMember(id, patch) {
    await simulateLatency();
    const snapshot = updateSnapshot(current => ({
      ...current,
      members: current.members.map(member => (member.id === id ? {...member, ...patch} : member)),
    }));
    const member = snapshot.members.find(item => item.id === id);
    if (!member) {
      throw new Error('Family member not found.');
    }
    return member;
  },
  async removeMember(id) {
    await simulateLatency();
    updateSnapshot(current => {
      const remaining = current.members.filter(member => member.id !== id);
      return {
        ...current,
        members: remaining,
        currentMemberId: current.currentMemberId === id ? remaining[0]?.id ?? '' : current.currentMemberId,
        plan: {
          ...current.plan,
          slots: current.plan.slots.map(slot =>
            slot.chefId === id || slot.helperId === id
              ? {...slot, chefId: slot.chefId === id ? undefined : slot.chefId, helperId: slot.helperId === id ? undefined : slot.helperId}
              : slot,
          ),
        },
      };
    });
  },
  async setCurrentMember(id) {
    const snapshot = updateSnapshot(current => ({...current, currentMemberId: id}));
    const member = snapshot.members.find(item => item.id === id);
    if (!member) {
      throw new Error('Family member not found.');
    }
    return member;
  },
  currentPermission() {
    const snapshot = loadSnapshot();
    return snapshot.members.find(member => member.id === snapshot.currentMemberId)?.permission ?? 'viewer';
  },
  async signOut() {
    await simulateLatency(160, 280);
    replaceSnapshot(createEmptySnapshot());
  },
};

function requireEditor() {
  if (householdService.currentPermission() !== 'editor') {
    throw new Error('Only an editor chef can change the household plan.');
  }
}

const mealPlanService: MealPlanService = {
  async getWeeklyPlan() {
    await simulateLatency();
    maybeFail(0.03);
    return loadSnapshot().plan;
  },
  async updateSlot(slotId, patch) {
    requireEditor();
    await simulateLatency();
    return updateSnapshot(current => ({
      ...current,
      plan: {
        ...current.plan,
        slots: current.plan.slots.map(slot => (slot.id === slotId ? {...slot, ...patch} : slot)),
      },
    })).plan;
  },
  async assignChef(date, chefId) {
    requireEditor();
    await simulateLatency();
    return updateSnapshot(current => ({
      ...current,
      plan: {
        ...current.plan,
        slots: current.plan.slots.map(slot =>
          slot.date === date && slot.mealType === 'dinner' ? {...slot, chefId} : slot,
        ),
      },
    })).plan;
  },
  async balanceRoster() {
    requireEditor();
    await simulateLatency();
    return updateSnapshot(current => {
      const chefs = current.members.filter(member => !member.helper);
      const pool = chefs.length ? chefs : current.members;
      let index = 0;
      return {
        ...current,
        plan: {
          ...current.plan,
          slots: current.plan.slots.map(slot => {
            if (slot.mealType !== 'dinner') {
              return slot;
            }
            const chef = pool[index % pool.length];
            index += 1;
            return {...slot, chefId: chef?.id};
          }),
        },
      };
    }).plan;
  },
  async setTheme(theme) {
    requireEditor();
    await simulateLatency(140, 280);
    return updateSnapshot(current => ({
      ...current,
      household: {...current.household, theme},
      plan: {...current.plan, theme},
    })).plan;
  },
  async setMood(moodId, energyLabel) {
    await simulateLatency(100, 220);
    return updateSnapshot(current => ({
      ...current,
      plan: {...current.plan, moodId, energyLabel},
    })).plan;
  },
  async markEatingOut(date, moveDinnerTo) {
    requireEditor();
    await simulateLatency();
    return updateSnapshot(current => {
      const dinner = current.plan.slots.find(slot => slot.date === date && slot.mealType === 'dinner');
      const targetDate = moveDinnerTo ?? addDaysISO(date, date === current.plan.endDate ? -1 : 2);
      return {
        ...current,
        plan: {
          ...current.plan,
          slots: current.plan.slots.map(slot => {
            if (slot.date === date && slot.mealType === 'dinner') {
              return {
                ...slot,
                status: 'eatingOut' as const,
                eatingOutNote: 'Family takeout night',
                recipeId: undefined,
              };
            }
            if (dinner?.recipeId && slot.date === targetDate && slot.mealType === 'dinner' && !slot.recipeId) {
              return {...slot, recipeId: dinner.recipeId, chefId: dinner.chefId, status: 'planned' as const};
            }
            if (dinner?.recipeId && slot.date === targetDate && slot.mealType === 'dinner' && slot.recipeId && slot.date !== date) {
              return slot;
            }
            if (dinner?.recipeId && slot.date === targetDate && slot.mealType === 'dinner') {
              return {...slot, recipeId: dinner.recipeId, chefId: dinner.chefId};
            }
            return slot;
          }),
        },
      };
    }).plan;
  },
  async restoreHomeCook(date) {
    requireEditor();
    await simulateLatency();
    return updateSnapshot(current => ({
      ...current,
      plan: {
        ...current.plan,
        slots: current.plan.slots.map(slot =>
          slot.date === date && slot.mealType === 'dinner'
            ? {...slot, status: 'planned' as const, eatingOutNote: undefined}
            : slot,
        ),
      },
    })).plan;
  },
  async togglePrepTask(taskId) {
    await simulateLatency(80, 160);
    return updateSnapshot(current => ({
      ...current,
      plan: {
        ...current.plan,
        prepTasks: current.plan.prepTasks.map(task => (task.id === taskId ? {...task, done: !task.done} : task)),
      },
    })).plan;
  },
  async lockRecipeToSlot({date, mealType, recipeId, chefId}) {
    requireEditor();
    await simulateLatency();
    return updateSnapshot(current => ({
      ...current,
      plan: {
        ...current.plan,
        slots: current.plan.slots.map(slot =>
          slot.date === date && slot.mealType === mealType
            ? {...slot, recipeId, chefId: chefId ?? slot.chefId, status: 'planned', eatingOutNote: undefined}
            : slot,
        ),
      },
    })).plan;
  },
};

const youtubeCatalog: Record<string, YouTubeMeta> = {
  '8NKukOQ6jHY': {
    videoId: '8NKukOQ6jHY',
    title: '15-Min Crispy Honey Chicken by Tasty',
    channel: 'Tasty',
    durationLabel: '14:20',
    durationSeconds: 860,
    thumbnail: youtubeThumb('8NKukOQ6jHY'),
    url: youtubeWatchUrl('8NKukOQ6jHY'),
  },
};

const youtubeService: YouTubeMetadataService = {
  async fetch(url) {
    await simulateLatency(400, 900);
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      throw new Error('That does not look like a YouTube recipe link.');
    }
    if (url.includes('unavailable') || videoId === '00000000000') {
      throw new Error('This video is unavailable. Try another recipe link.');
    }
    return (
      youtubeCatalog[videoId] ?? {
        videoId,
        title: 'Family YouTube Recipe',
        channel: 'YouTube Kitchen',
        durationLabel: '12:00',
        durationSeconds: 720,
        thumbnail: youtubeThumb(videoId),
        url: youtubeWatchUrl(videoId),
      }
    );
  },
};

const recipeService: RecipeService = {
  async listRecipes() {
    await simulateLatency();
    return loadSnapshot().recipes;
  },
  async getRecipe(id) {
    await simulateLatency(160, 360);
    const recipe = loadSnapshot().recipes.find(item => item.id === id);
    if (!recipe) {
      throw new Error('Recipe not found.');
    }
    return recipe;
  },
  async addFromYouTube(url) {
    requireEditor();
    const meta = await youtubeService.fetch(url);
    const recipe: Recipe = {
      id: createId('rec'),
      title: meta.title,
      thumbnail: meta.thumbnail,
      category: 'dinner',
      tags: ['youtube'],
      themes: ['regular'],
      moods: ['busy'],
      cookMinutes: 20,
      prepMinutes: 10,
      favorite: true,
      youtube: meta,
      ingredients: [],
      steps: [{id: createId('step'), title: 'Follow along', body: 'Open the YouTube guide and cook together.'}],
      chefIds: [],
    };
    updateSnapshot(current => ({...current, recipes: [recipe, ...current.recipes]}));
    return recipe;
  },
  async addManual({title, category}) {
    requireEditor();
    await simulateLatency();
    const recipe: Recipe = {
      id: createId('rec'),
      title,
      thumbnail: 'https://images.unsplash.com/photo-1495521821757-91d4016ac697?w=900&h=600&fit=crop',
      category: category ?? 'dinner',
      tags: ['homemade'],
      themes: ['regular'],
      moods: ['comfort'],
      cookMinutes: 25,
      prepMinutes: 10,
      favorite: true,
      ingredients: [],
      steps: [],
      chefIds: [],
    };
    updateSnapshot(current => ({...current, recipes: [recipe, ...current.recipes]}));
    return recipe;
  },
  async toggleFavorite(id) {
    await simulateLatency(80, 160);
    const snapshot = updateSnapshot(current => ({
      ...current,
      recipes: current.recipes.map(recipe => (recipe.id === id ? {...recipe, favorite: !recipe.favorite} : recipe)),
    }));
    const recipe = snapshot.recipes.find(item => item.id === id);
    if (!recipe) {
      throw new Error('Recipe not found.');
    }
    return recipe;
  },
  async addChefNote(recipeId, body) {
    await simulateLatency();
    const note: ChefNote = {
      id: createId('note'),
      recipeId,
      authorId: loadSnapshot().currentMemberId,
      body,
      createdAt: new Date().toISOString(),
    };
    updateSnapshot(current => ({...current, chefNotes: [note, ...current.chefNotes]}));
    return note;
  },
  async listNotes(recipeId) {
    return loadSnapshot().chefNotes.filter(note => note.recipeId === recipeId);
  },
};

const suggestionService: SuggestionService = {
  async list() {
    await simulateLatency();
    return loadSnapshot().suggestions;
  },
  async submit({title, youtubeUrl, note}) {
    await simulateLatency();
    const trimmed = title.trim();
    if (!trimmed) {
      throw new Error('Add a dish name or paste a YouTube link.');
    }
    if (looksLikeUrl(trimmed) && !isYouTubeUrl(trimmed)) {
      throw new Error('Only YouTube recipe links are supported.');
    }
    if (youtubeUrl && !isYouTubeUrl(youtubeUrl) && looksLikeUrl(youtubeUrl)) {
      throw new Error('That YouTube link looks invalid or unsupported.');
    }
    const snapshot = loadSnapshot();
    const plannedTitles = snapshot.plan.slots
      .map(slot => snapshot.recipes.find(recipe => recipe.id === slot.recipeId)?.title.toLowerCase())
      .filter(Boolean);
    if (plannedTitles.includes(trimmed.toLowerCase())) {
      throw new Error('That meal is already on this week’s plan.');
    }
    const match = snapshot.recipes.find(recipe => recipe.title.toLowerCase() === trimmed.toLowerCase());
    const suggestion: Suggestion = {
      id: createId('sug'),
      title: match?.title ?? trimmed,
      authorId: snapshot.currentMemberId,
      recipeId: match?.id,
      youtubeUrl: youtubeUrl || (isYouTubeUrl(trimmed) ? trimmed : undefined),
      thumbnail: match?.thumbnail,
      note,
      upVoterIds: snapshot.currentMemberId ? [snapshot.currentMemberId] : [],
      downVoterIds: [],
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    updateSnapshot(current => ({...current, suggestions: [suggestion, ...current.suggestions]}));
    return suggestion;
  },
  async vote(id, direction) {
    await simulateLatency(80, 180);
    const voter = loadSnapshot().currentMemberId;
    const snapshot = updateSnapshot(current => ({
      ...current,
      suggestions: current.suggestions.map(item => {
        if (item.id !== id) {
          return item;
        }
        const up = item.upVoterIds.filter(value => value !== voter);
        const down = item.downVoterIds.filter(value => value !== voter);
        if (direction === 'up') {
          up.push(voter);
        } else {
          down.push(voter);
        }
        return {...item, upVoterIds: up, downVoterIds: down};
      }),
    }));
    const suggestion = snapshot.suggestions.find(item => item.id === id);
    if (!suggestion) {
      throw new Error('Suggestion not found.');
    }
    return suggestion;
  },
  async decide(id, status) {
    requireEditor();
    await simulateLatency();
    const snapshot = updateSnapshot(current => {
      const target = current.suggestions.find(item => item.id === id);
      if (!target) {
        return current;
      }
      let slots = current.plan.slots;
      if (status === 'accepted' && target.recipeId) {
        const openDinner = slots.find(slot => slot.mealType === 'dinner' && (!slot.recipeId || slot.status === 'eatingOut'));
        const friday = slots.find(slot => slot.mealType === 'dinner' && slot.date === current.plan.slots.filter(s => s.mealType === 'dinner')[4]?.date);
        const dest = target.targetDate
          ? slots.find(slot => slot.date === target.targetDate && slot.mealType === 'dinner')
          : openDinner ?? friday;
        if (dest) {
          slots = slots.map(slot =>
            slot.id === dest.id
              ? {...slot, recipeId: target.recipeId, status: 'planned', eatingOutNote: undefined}
              : slot,
          );
        }
      }
      return {
        ...current,
        suggestions: current.suggestions.map(item => (item.id === id ? {...item, status} : item)),
        plan: {...current.plan, slots},
      };
    });
    const suggestion = snapshot.suggestions.find(item => item.id === id);
    if (!suggestion) {
      throw new Error('Suggestion not found.');
    }
    return suggestion;
  },
};

const groceryService: GroceryService = {
  async listGrocery() {
    await simulateLatency();
    return loadSnapshot().grocery;
  },
  async addGrocery(name, meta) {
    await simulateLatency(100, 220);
    const item: GroceryItem = {
      id: createId('gro'),
      name,
      aisle: meta?.aisle ?? 'Other',
      category: meta?.category ?? 'other',
      quantity: meta?.quantity ?? '',
      checked: false,
      requestedBy: loadSnapshot().currentMemberId,
      ...meta,
    };
    updateSnapshot(current => ({...current, grocery: [item, ...current.grocery]}));
    return item;
  },
  async toggleGrocery(id) {
    await simulateLatency(60, 140);
    const snapshot = updateSnapshot(current => ({
      ...current,
      grocery: current.grocery.map(item => (item.id === id ? {...item, checked: !item.checked} : item)),
    }));
    const item = snapshot.grocery.find(value => value.id === id);
    if (!item) {
      throw new Error('Grocery item not found.');
    }
    return item;
  },
  async syncFromPlan() {
    await simulateLatency();
    return updateSnapshot(current => {
      const names = new Set(current.grocery.map(item => item.name.toLowerCase()));
      const extras: GroceryItem[] = [];
      current.plan.slots.forEach(slot => {
        const recipe = current.recipes.find(item => item.id === slot.recipeId);
        recipe?.ingredients.forEach(ingredient => {
          if (!names.has(ingredient.name.toLowerCase())) {
            names.add(ingredient.name.toLowerCase());
            extras.push({
              id: createId('gro'),
              name: ingredient.name,
              aisle: ingredient.location === 'fridge' ? 'Produce' : 'Dry Goods',
              category: ingredient.location === 'fridge' ? 'produce' : 'aisle',
              quantity: `${ingredient.quantity} ${ingredient.unit}`,
              recipeLabel: recipe.title,
              checked: false,
              fromRecipeId: recipe.id,
            });
          }
        });
      });
      return {...current, grocery: [...extras, ...current.grocery]};
    }).grocery;
  },
  async listPantry() {
    await simulateLatency();
    return loadSnapshot().pantry;
  },
  async usePantryItemTonight(itemId) {
    requireEditor();
    await simulateLatency();
    const snapshot = loadSnapshot();
    const item = snapshot.pantry.find(value => value.id === itemId);
    if (!item?.matchRecipeId) {
      return null;
    }
    return mealPlanService.lockRecipeToSlot({
      date: todayISO(),
      mealType: 'dinner',
      recipeId: item.matchRecipeId,
    });
  },
};

const randomizerService: RandomizerService = {
  async spin(input: SpinInput) {
    await simulateLatency(420, 780);
    const snapshot = loadSnapshot();
    if (snapshot.recipes.length === 0) {
      throw new Error('Add a favourite recipe before spinning.');
    }
    if (snapshot.spinsLeft <= 0) {
      throw new Error('Out of wheel spins for today. Lock this feast or swap tomorrow’s slot.');
    }
    const mood = MOODS.find(item => item.id === input.moodId);
    const dinnerChefId = snapshot.plan.slots.find(
      slot => slot.date === input.date && slot.mealType === (input.mealType ?? 'dinner'),
    )?.chefId;
    const chef = snapshot.members.find(member => member.id === dinnerChefId);
    const pantryFriendlyIds = snapshot.pantry
      .map(item => item.matchRecipeId)
      .filter((id): id is string => Boolean(id));
    const pool = snapshot.recipes.filter(recipe => recipe.favorite || recipe.themes.includes(input.theme));
    const candidates = pool.length ? pool : snapshot.recipes;
    const scores = candidates.map(recipe =>
      scoreRecipe({
        recipe,
        theme: input.theme,
        moodId: input.moodId,
        chefSpecialty: chef?.specialty,
        plannedRecipeIds: plannedIds(snapshot.plan),
        pantryFriendlyIds,
        maxCookMinutes: mood?.maxCookMinutes,
      }),
    );
    const recipe = pickWeighted(candidates, scores);
    const max = Math.max(...scores);
    const matchPercent = Math.min(99, Math.round((Math.max(...scores.filter((_, i) => candidates[i].id === recipe.id), 20) / (max + 8)) * 100));
    updateSnapshot(current => ({
      ...current,
      spinsLeft: Math.max(0, current.spinsLeft - 1),
      spinHistory: [recipe.id, ...current.spinHistory].slice(0, 12),
    }));
    return {
      recipe,
      reason: explainMatch(recipe, input.theme, input.moodId),
      recommendedChefIds: recipe.chefIds,
      matchPercent,
      spinsLeft: loadSnapshot().spinsLeft,
    };
  },
};

export const mockServices: FamFeastServices = {
  household: householdService,
  mealPlan: mealPlanService,
  recipes: recipeService,
  suggestions: suggestionService,
  grocery: groceryService,
  youtube: youtubeService,
  randomizer: randomizerService,
};

export function getShareLink(): string {
  const {household, plan} = loadSnapshot();
  const week = plan.weekId.split('-W')[1] ?? '01';
  return `https://famfeast.app/m/${household.slug || 'household'}-wk${week}`;
}

export type {Household, MealSlot, MealType, MoodId, WeeklyThemeId};
