import type {WeeklyThemeId} from '../theme/weeklyThemes';

export type Permission = 'editor' | 'suggester' | 'viewer';

export type HouseholdRole =
  | 'Mother'
  | 'Father'
  | 'Son'
  | 'Daughter'
  | 'Grandma'
  | 'Grandpa'
  | 'Custom';

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type MealStatus = 'planned' | 'prepped' | 'served' | 'eatingOut';

export type RecipeCategory =
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'snack'
  | 'dessert';

export type MoodId =
  | 'exhausted'
  | 'celebrate'
  | 'sweet'
  | 'comfort'
  | 'busy'
  | 'outside';

export type SuggestionStatus = 'open' | 'accepted' | 'rejected';

export type PantryLocation = 'fridge' | 'freezer' | 'pantry' | 'spice' | 'counter';

export type DietaryAlert = {
  id: string;
  label: string;
  danger?: boolean;
};

export type Household = {
  id: string;
  name: string;
  slug: string;
  inviteCode: string;
  houseRule: string;
  autoRotate: boolean;
  theme: WeeklyThemeId;
  vibe?: string;
  startedOn?: string;
  takeoutSafeguard?: boolean;
  groceryBudgetSync?: boolean;
  kidsCookFriday?: boolean;
  dietaryAlerts?: DietaryAlert[];
  favoritePlates?: string[];
  marketLabel?: string;
};

export type Member = {
  id: string;
  name: string;
  displayName: string;
  role: HouseholdRole;
  customRole?: string;
  permission: Permission;
  avatarColor: string;
  avatarInitial: string;
  photoUrl?: string;
  specialty: string;
  badge: string;
  helper: boolean;
  emoji?: string;
};

export type YouTubeMeta = {
  videoId: string;
  title: string;
  channel: string;
  durationLabel: string;
  durationSeconds: number;
  thumbnail: string;
  url: string;
};

export type Ingredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  note?: string;
  location: PantryLocation | 'other';
  assigneeId?: string;
};

export type RecipeStep = {
  id: string;
  title: string;
  body: string;
  minutes?: number;
  timestampLabel?: string;
  timestampPercent?: number;
  assigneeId?: string;
};

export type Recipe = {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail: string;
  category: RecipeCategory;
  tags: string[];
  themes: WeeklyThemeId[];
  moods: MoodId[];
  cookMinutes: number;
  prepMinutes: number;
  calories?: number;
  flavor?: string;
  favorite: boolean;
  youtube?: YouTubeMeta;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  chefIds: string[];
  familyRating?: number;
  voteCount?: number;
};

export type MealSlot = {
  id: string;
  date: string;
  mealType: MealType;
  recipeId?: string;
  chefId?: string;
  helperId?: string;
  status: MealStatus;
  eatingOutNote?: string;
};

export type PrepTask = {
  id: string;
  slotId: string;
  label: string;
  minutes?: number;
  done: boolean;
};

export type WeeklyPlan = {
  weekId: string;
  startDate: string;
  endDate: string;
  theme: WeeklyThemeId;
  moodId?: MoodId;
  energyLabel: string;
  slots: MealSlot[];
  prepTasks: PrepTask[];
};

export type Suggestion = {
  id: string;
  title: string;
  authorId: string;
  recipeId?: string;
  youtubeUrl?: string;
  thumbnail?: string;
  note?: string;
  upVoterIds: string[];
  downVoterIds: string[];
  status: SuggestionStatus;
  targetDate?: string;
  createdAt: string;
};

export type ChefNote = {
  id: string;
  recipeId: string;
  authorId: string;
  body: string;
  createdAt: string;
};

export type GroceryCategory = 'produce' | 'meat' | 'aisle' | 'other';

export type GroceryItem = {
  id: string;
  name: string;
  aisle: string;
  category?: GroceryCategory;
  quantity?: string;
  checked: boolean;
  fromRecipeId?: string;
  recipeLabel?: string;
  requestedBy?: string;
  helperLabel?: string;
  urgent?: boolean;
  kidsTask?: boolean;
  tonight?: boolean;
  locationHint?: string;
  priceLabel?: string;
  pickedBy?: string;
  desk?: boolean;
  voteLabel?: string;
  deskHint?: string;
  deskAction?: string;
};

export type PantryItem = {
  id: string;
  name: string;
  location: PantryLocation;
  quantityLabel: string;
  expiresOn?: string;
  lowStock: boolean;
  thumbnail?: string;
  matchRecipeId?: string;
  percentLeft?: number;
  statusLabel?: string;
  zone?: 'dairy' | 'grains' | 'spices' | 'produce';
  neededFor?: string;
  listed?: boolean;
  unitLabel?: string;
};

export type MoodOption = {
  id: MoodId;
  label: string;
  hint: string;
  energyLabel: string;
  emoji?: string;
  maxCookMinutes?: number;
};

export type AppSnapshot = {
  onboardingComplete: boolean;
  household: Household;
  members: Member[];
  currentMemberId: string;
  recipes: Recipe[];
  plan: WeeklyPlan;
  suggestions: Suggestion[];
  chefNotes: ChefNote[];
  grocery: GroceryItem[];
  pantry: PantryItem[];
  spinsLeft: number;
  lastSpinDate: string;
  spinHistory: string[];
};
