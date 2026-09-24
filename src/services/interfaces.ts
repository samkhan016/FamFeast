import type {
  AppSnapshot,
  ChefNote,
  GroceryItem,
  Household,
  MealSlot,
  CalendarSpan,
  DayOccasion,
  HouseholdPlanId,
  MealType,
  Member,
  MoodId,
  PantryItem,
  Permission,
  Recipe,
  Suggestion,
  WeeklyPlan,
  YouTubeMeta,
} from '../domain/types';
import type {WeeklyThemeId} from '../theme/weeklyThemes';

export type SpinInput = {
  theme: WeeklyThemeId;
  moodId?: MoodId;
  date: string;
  mealType?: MealType;
  occasion?: DayOccasion;
  preferTreats?: boolean;
};

export type SpinResult = {
  recipe: Recipe;
  reason: string;
  recommendedChefIds: string[];
  matchPercent: number;
  spinsLeft: number;
};

export interface HouseholdService {
  bootstrap(): Promise<AppSnapshot>;
  completeOnboarding(input: {
    householdName: string;
    members: Array<Pick<Member, 'name' | 'role' | 'permission' | 'specialty'>>;
    theme: WeeklyThemeId;
    plan?: HouseholdPlanId;
    useDemo?: boolean;
  }): Promise<AppSnapshot>;
  getHousehold(): Promise<Household>;
  updateHousehold(patch: Partial<Household>): Promise<Household>;
  listMembers(): Promise<Member[]>;
  addMember(input: Omit<Member, 'id' | 'avatarInitial' | 'avatarColor' | 'displayName'> & {displayName?: string}): Promise<Member>;
  updateMember(id: string, patch: Partial<Member>): Promise<Member>;
  removeMember(id: string): Promise<void>;
  setCurrentMember(id: string): Promise<Member>;
  currentPermission(): Permission;
  signUp(input: {name: string; email: string; password: string; photoUri?: string}): Promise<AppSnapshot>;
  setAccountPhoto(photoUri: string): Promise<AppSnapshot>;
  skipPhotoStep(): Promise<AppSnapshot>;
  signIn(input: {email: string; password: string}): Promise<AppSnapshot>;
  choosePlan(plan: HouseholdPlanId): Promise<AppSnapshot>;
  reopenPaywall(): Promise<AppSnapshot>;
  createHousehold(input: {householdName: string; memberName: string; role: Member['role']}): Promise<AppSnapshot>;
  signOut(): Promise<void>;
}

export interface MealPlanService {
  getWeeklyPlan(): Promise<WeeklyPlan>;
  updateSlot(slotId: string, patch: Partial<MealSlot>): Promise<WeeklyPlan>;
  assignChef(date: string, chefId: string): Promise<WeeklyPlan>;
  balanceRoster(): Promise<WeeklyPlan>;
  setTheme(theme: WeeklyThemeId): Promise<WeeklyPlan>;
  setMood(moodId: MoodId, energyLabel: string): Promise<WeeklyPlan>;
  markEatingOut(date: string, moveDinnerTo?: string): Promise<WeeklyPlan>;
  restoreHomeCook(date: string): Promise<WeeklyPlan>;
  togglePrepTask(taskId: string): Promise<WeeklyPlan>;
  lockRecipeToSlot(input: {date: string; mealType: MealType; recipeId: string; chefId?: string}): Promise<WeeklyPlan>;
  setOccasion(date: string, occasion?: DayOccasion): Promise<WeeklyPlan>;
  setCalendarSpan(span: CalendarSpan): Promise<WeeklyPlan>;
}

export interface RecipeService {
  listRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe>;
  addFromYouTube(url: string): Promise<Recipe>;
  addManual(input: {title: string; category?: Recipe['category']}): Promise<Recipe>;
  toggleFavorite(id: string): Promise<Recipe>;
  addChefNote(recipeId: string, body: string): Promise<ChefNote>;
  listNotes(recipeId: string): Promise<ChefNote[]>;
}

export interface SuggestionService {
  list(): Promise<Suggestion[]>;
  submit(input: {
    title: string;
    youtubeUrl?: string;
    note?: string;
    kind?: Suggestion['kind'];
    targetDate?: string;
    occasion?: DayOccasion;
  }): Promise<Suggestion>;
  vote(id: string, direction: 'up' | 'down'): Promise<Suggestion>;
  decide(id: string, status: 'accepted' | 'rejected'): Promise<Suggestion>;
}

export interface GroceryService {
  listGrocery(): Promise<GroceryItem[]>;
  addGrocery(name: string, meta?: Partial<GroceryItem>): Promise<GroceryItem>;
  updateGrocery(id: string, patch: Pick<GroceryItem, 'name' | 'quantity'>): Promise<GroceryItem>;
  removeGrocery(id: string): Promise<void>;
  toggleGrocery(id: string): Promise<GroceryItem>;
  decideGrocery(id: string, status: 'accepted' | 'rejected'): Promise<GroceryItem[]>;
  syncFromPlan(): Promise<GroceryItem[]>;
  listPantry(): Promise<PantryItem[]>;
  addPantry(name: string, quantity?: string): Promise<PantryItem>;
  updatePantry(id: string, patch: {name: string; quantity?: string}): Promise<PantryItem>;
  removePantry(id: string): Promise<void>;
  completeShopping(): Promise<void>;
  usePantryItemTonight(itemId: string): Promise<WeeklyPlan | null>;
}

export interface YouTubeMetadataService {
  fetch(url: string): Promise<YouTubeMeta>;
}

export interface RandomizerService {
  spin(input: SpinInput): Promise<SpinResult>;
}

export type FamFeastServices = {
  household: HouseholdService;
  mealPlan: MealPlanService;
  recipes: RecipeService;
  suggestions: SuggestionService;
  grocery: GroceryService;
  youtube: YouTubeMetadataService;
  randomizer: RandomizerService;
};
