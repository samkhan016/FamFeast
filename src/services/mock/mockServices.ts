import type {
  ChefNote,
  GroceryItem,
  Household,
  PantryItem,
  MealSlot,
  MealType,
  Member,
  MoodId,
  Recipe,
  Suggestion,
  YouTubeMeta,
  AppSnapshot,
} from '../../domain/types';
import {PLAN_SEATS} from '../../domain/types';
import type {WeeklyThemeId} from '../../theme/weeklyThemes';
import {createId} from '../../utils/ids';
import {addDaysISO, monthDates, todayISO} from '../../utils/dates';
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

function memberDefaults(name: string, index: number): Pick<Member, 'avatarInitial' | 'avatarColor' | 'displayName'> {
  return {
    avatarInitial: name.trim().charAt(0).toUpperCase() || 'F',
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
    displayName: name,
  };
}

const householdService: HouseholdService = {
  async bootstrap() {
    await simulateLatency(180, 420);
    return loadSnapshot();
  },
  async completeOnboarding({householdName, members, theme, plan = 'family', useDemo}) {
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
    const snapshot: AppSnapshot = {
      ...empty,
      onboardingComplete: true,
      signedIn: true,
      planChosen: true,
      account: empty.account,
      household: {
        ...empty.household,
        id: createId('hh'),
        name: householdName || 'Our Feast',
        slug: slugify(householdName || 'our-feast'),
        inviteCode: `${(householdName || 'FEAST').slice(0, 6).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`,
        theme,
        plan,
        calendarSpan: 'week',
        ownerId: created[0]?.id ?? '',
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
      household: {...current.household, ...patch, ownerId: current.household.ownerId},
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
    const seats = PLAN_SEATS[snapshot.household.plan] ?? 1;
    if (snapshot.members.length >= seats) {
      throw new Error(
        snapshot.household.plan === 'family'
          ? 'The family plan includes up to 4 people.'
          : 'The $5 plan is for one person. Switch to Family to invite others.',
      );
    }
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
    const snapshot = updateSnapshot(current => {
      const isAdmin = current.household.ownerId === id;
      const nextPatch = isAdmin ? {...patch, permission: current.members.find(member => member.id === id)?.permission} : patch;
      return {
        ...current,
        members: current.members.map(member => (member.id === id ? {...member, ...nextPatch} : member)),
      };
    });
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
  async signUp({name, email, password, photoUri}) {
    await simulateLatency(160, 280);
    const trimmedEmail = email.trim().toLowerCase();
    if (!name.trim() || !trimmedEmail.includes('@') || password.length < 6) {
      throw new Error('Add your name, a valid email, and a password of at least 6 characters.');
    }
    const existing = loadSnapshot().account;
    if (existing && existing.email === trimmedEmail) {
      throw new Error('That email already has an account. Sign in instead.');
    }
    const fresh = createEmptySnapshot();
    return replaceSnapshot({
      ...fresh,
      account: {name: name.trim(), email: trimmedEmail, password, photoUri},
      signedIn: true,
      photoStepComplete: false,
      planChosen: false,
      onboardingComplete: false,
    });
  },
  async signIn({email, password}) {
    await simulateLatency(160, 280);
    const snapshot = loadSnapshot();
    const account = snapshot.account;
    const trimmedEmail = email.trim().toLowerCase();
    if (!account || account.email !== trimmedEmail || account.password !== password) {
      throw new Error('Email or password doesn’t match.');
    }
    return updateSnapshot(current => ({...current, signedIn: true}));
  },
  async choosePlan(plan) {
    await simulateLatency(120, 220);
    const snapshot = loadSnapshot();
    if (!snapshot.signedIn) {
      throw new Error('Create an account first.');
    }
    return updateSnapshot(current => ({
      ...current,
      planChosen: true,
      household: {...current.household, plan},
    }));
  },
  async reopenPaywall() {
    await simulateLatency(80, 140);
    return updateSnapshot(current => ({...current, planChosen: false}));
  },
  async createHousehold({householdName, memberName, role}) {
    await simulateLatency();
    const current = loadSnapshot();
    if (!current.signedIn || !current.planChosen) {
      throw new Error('Choose a plan before creating the household.');
    }
    const name = householdName.trim();
    const person = memberName.trim() || current.account?.name || 'Chef';
    if (!name) {
      throw new Error('Name your household.');
    }
    const owner = {
      id: createId('mem'),
      name: person,
      role,
      permission: 'editor' as const,
      specialty: 'Weeknight dinners',
      badge: role,
      helper: false,
      photoUrl: current.account?.photoUri,
      ...memberDefaults(person, 0),
    };
    return updateSnapshot(snapshot => ({
      ...snapshot,
      onboardingComplete: true,
      members: [owner],
      currentMemberId: owner.id,
      household: {
        ...snapshot.household,
        id: createId('hh'),
        name,
        slug: slugify(name),
        inviteCode: `${name.slice(0, 6).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`,
        ownerId: owner.id,
        houseRule: `${person} leads the week`,
      },
    }));
  },
  async setAccountPhoto(photoUri) {
    await simulateLatency(80, 160);
    const snapshot = loadSnapshot();
    if (!snapshot.account) {
      throw new Error('Create an account before adding a photo.');
    }
    return updateSnapshot(current => ({
      ...current,
      photoStepComplete: true,
      account: current.account ? {...current.account, photoUri} : current.account,
      members: current.members.map(member =>
        member.id === current.household.ownerId ? {...member, photoUrl: photoUri} : member,
      ),
    }));
  },
  async skipPhotoStep() {
    await simulateLatency(40, 80);
    return updateSnapshot(current => ({...current, photoStepComplete: true}));
  },
  async signOut() {
    await simulateLatency(160, 280);
    updateSnapshot(current => ({...current, signedIn: false}));
  },
};

function requireEditor() {
  if (householdService.currentPermission() !== 'editor') {
    throw new Error('Only an editor chef can change the household plan.');
  }
}

function requireOwner() {
  const snapshot = loadSnapshot();
  if (!snapshot.household.ownerId || snapshot.currentMemberId !== snapshot.household.ownerId) {
    throw new Error('Only the household owner can accept or decline this.');
  }
}

function consumeIngredients(current: ReturnType<typeof loadSnapshot>, recipe: Recipe) {
  const pantry = current.pantry.map(item => ({...item}));
  const grocery = [...current.grocery];
  recipe.ingredients.forEach(ingredient => {
    const key = ingredient.name.toLowerCase();
    const stock = pantry.find(item => {
      const name = item.name.toLowerCase();
      return name.includes(key) || key.includes(name);
    });
    if (stock) {
      stock.lowStock = true;
      stock.percentLeft = Math.max(0, (stock.percentLeft ?? 40) - 35);
      stock.statusLabel = 'Used for tonight';
    }
    const listed = grocery.some(item => item.name.toLowerCase() === key && !item.pending && !item.checked);
    if (!listed) {
      grocery.unshift({
        id: createId('gro'),
        name: ingredient.name,
        aisle: ingredient.location === 'fridge' ? 'Produce' : 'Dry Goods',
        category: ingredient.location === 'fridge' ? 'produce' : 'aisle',
        quantity: `${ingredient.quantity} ${ingredient.unit}`,
        checked: false,
        fromRecipeId: recipe.id,
        recipeLabel: recipe.title,
      });
    }
  });
  return {pantry, grocery};
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
    return updateSnapshot(current => {
      const slots = current.plan.slots.map(slot => (slot.id === slotId ? {...slot, ...patch} : slot));
      const served = patch.status === 'served' ? slots.find(slot => slot.id === slotId) : undefined;
      const recipe = served?.recipeId ? current.recipes.find(item => item.id === served.recipeId) : undefined;
      const refreshed = recipe ? consumeIngredients(current, recipe) : null;
      return {
        ...current,
        grocery: refreshed?.grocery ?? current.grocery,
        pantry: refreshed?.pantry ?? current.pantry,
        plan: {...current.plan, slots},
      };
    }).plan;
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
  async setOccasion(date, occasion) {
    requireEditor();
    await simulateLatency(80, 180);
    return updateSnapshot(current => ({
      ...current,
      plan: {
        ...current.plan,
        slots: current.plan.slots.map(slot =>
          slot.date === date && slot.mealType === 'dinner' ? {...slot, occasion} : slot,
        ),
      },
    })).plan;
  },
  async setCalendarSpan(span) {
    requireEditor();
    await simulateLatency(80, 160);
    return updateSnapshot(current => {
      if (span === 'week') {
        return {...current, household: {...current.household, calendarSpan: span}};
      }
      const existing = new Set(current.plan.slots.map(slot => `${slot.date}_${slot.mealType}`));
      const extra: MealSlot[] = [];
      monthDates(current.plan.startDate).forEach(date => {
        (['breakfast', 'lunch', 'dinner'] as const).forEach(mealType => {
          if (!existing.has(`${date}_${mealType}`)) {
            extra.push({id: `slot_${date}_${mealType}`, date, mealType, status: 'planned'});
          }
        });
      });
      const slots = [...current.plan.slots, ...extra].sort(
        (a, b) => a.date.localeCompare(b.date) || a.mealType.localeCompare(b.mealType),
      );
      return {
        ...current,
        household: {...current.household, calendarSpan: span},
        plan: {
          ...current.plan,
          startDate: slots[0]?.date ?? current.plan.startDate,
          endDate: slots[slots.length - 1]?.date ?? current.plan.endDate,
          slots,
        },
      };
    }).plan;
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
  async submit({title, youtubeUrl, note, kind = 'dish', targetDate, occasion}) {
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
    if (kind === 'dish' && plannedTitles.includes(trimmed.toLowerCase())) {
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
      kind,
      targetDate,
      occasion,
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
    requireOwner();
    await simulateLatency();
    const snapshot = updateSnapshot(current => {
      const target = current.suggestions.find(item => item.id === id);
      if (!target) {
        return current;
      }
      let slots = current.plan.slots;
      if (status === 'accepted' && target.kind === 'plan' && target.targetDate) {
        slots = slots.map(slot => {
          if (slot.date !== target.targetDate || slot.mealType !== 'dinner') {
            return slot;
          }
          if (target.occasion) {
            return {...slot, occasion: target.occasion};
          }
          return {...slot, status: 'eatingOut' as const, eatingOutNote: target.note ?? target.title, recipeId: undefined};
        });
      } else if (status === 'accepted' && target.recipeId) {
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
    const snapshot = loadSnapshot();
    const isOwner = snapshot.currentMemberId === snapshot.household.ownerId;
    const item: GroceryItem = {
      id: createId('gro'),
      name,
      aisle: meta?.aisle ?? 'Other',
      category: meta?.category ?? 'other',
      quantity: meta?.quantity ?? '',
      checked: false,
      requestedBy: snapshot.currentMemberId,
      ...meta,
      pending: meta?.pending ?? !isOwner,
    };
    updateSnapshot(current => ({...current, grocery: [item, ...current.grocery]}));
    return item;
  },
  async updateGrocery(id, patch) {
    await simulateLatency(80, 160);
    const name = patch.name.trim();
    if (!name) {
      throw new Error('Item name is required.');
    }
    const snapshot = updateSnapshot(current => ({
      ...current,
      grocery: current.grocery.map(item =>
        item.id === id ? {...item, name, quantity: patch.quantity?.trim() ?? ''} : item,
      ),
    }));
    const item = snapshot.grocery.find(value => value.id === id);
    if (!item) {
      throw new Error('Grocery item not found.');
    }
    return item;
  },
  async removeGrocery(id) {
    await simulateLatency(80, 160);
    updateSnapshot(current => ({
      ...current,
      grocery: current.grocery.filter(item => item.id !== id),
    }));
  },
  async decideGrocery(id, status) {
    requireOwner();
    await simulateLatency(80, 160);
    return updateSnapshot(current => ({
      ...current,
      grocery:
        status === 'rejected'
          ? current.grocery.filter(item => item.id !== id)
          : current.grocery.map(item => (item.id === id ? {...item, pending: false} : item)),
    })).grocery;
  },
  async toggleGrocery(id) {
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
  async addPantry(name, quantity) {
    await simulateLatency(100, 220);
    const trimmed = name.trim();
    if (!trimmed) {
      throw new Error('Item name is required.');
    }
    const item: PantryItem = {
      id: createId('pan'),
      name: trimmed,
      location: 'pantry',
      quantityLabel: quantity?.trim() ?? '',
      lowStock: false,
    };
    updateSnapshot(current => ({...current, pantry: [item, ...current.pantry]}));
    return item;
  },
  async updatePantry(id, patch) {
    await simulateLatency(80, 160);
    const name = patch.name.trim();
    if (!name) {
      throw new Error('Item name is required.');
    }
    const snapshot = updateSnapshot(current => ({
      ...current,
      pantry: current.pantry.map(item =>
        item.id === id ? {...item, name, quantityLabel: patch.quantity?.trim() ?? ''} : item,
      ),
    }));
    const item = snapshot.pantry.find(value => value.id === id);
    if (!item) {
      throw new Error('Inventory item not found.');
    }
    return item;
  },
  async removePantry(id) {
    await simulateLatency(80, 160);
    updateSnapshot(current => ({
      ...current,
      pantry: current.pantry.filter(item => item.id !== id),
    }));
  },
  async completeShopping() {
    await simulateLatency(120, 240);
    updateSnapshot(current => {
      const moving = current.grocery.filter(item => !item.desk && item.checked);
      if (!moving.length) {
        return current;
      }
      const pantry = current.pantry.map(item => ({...item}));
      moving.forEach(item => {
        const match = pantry.find(stock => stock.name.toLowerCase() === item.name.toLowerCase());
        const quantity = item.quantity?.trim() ?? '';
        if (match) {
          if (quantity) {
            match.quantityLabel = quantity;
          }
          match.lowStock = false;
          return;
        }
        pantry.unshift({
          id: createId('pan'),
          name: item.name,
          location: 'pantry',
          quantityLabel: quantity,
          lowStock: false,
        });
      });
      const movedIds = new Set(moving.map(item => item.id));
      return {
        ...current,
        pantry,
        grocery: current.grocery.filter(item => !movedIds.has(item.id)),
      };
    });
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
    const treatDays = snapshot.plan.slots.filter(slot => slot.mealType === 'dinner' && slot.status === 'eatingOut').length;
    const preferTreats = input.preferTreats || treatDays >= 2;
    const scores = candidates.map(recipe =>
      scoreRecipe({
        recipe,
        theme: input.theme,
        moodId: input.moodId,
        chefSpecialty: chef?.specialty,
        plannedRecipeIds: plannedIds(snapshot.plan),
        pantryFriendlyIds,
        maxCookMinutes: mood?.maxCookMinutes,
        occasion: input.occasion,
        preferTreats,
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
      reason: explainMatch(recipe, input.theme, input.moodId, preferTreats || input.occasion === 'cheat'),
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
