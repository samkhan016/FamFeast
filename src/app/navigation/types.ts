import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps, NavigatorScreenParams} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {MealType} from '../../domain/types';

export type GroceryStackParamList = {
  GroceryHome: undefined;
};

export type TabParamList = {
  Schedule: undefined;
  Chefs: undefined;
  Spin: {date?: string} | undefined;
  Voting: undefined;
  Grocery: NavigatorScreenParams<GroceryStackParamList> | undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<TabParamList>;
  RecipeDetail: {recipeId: string; slotId?: string};
  MealEditor: {slotId?: string; date: string; mealType?: MealType};
  AddRecipe: undefined;
  AddMember: {memberId?: string} | undefined;
  HouseholdShare: undefined;
};

export type RootProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type GroceryStackProps<T extends keyof GroceryStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<GroceryStackParamList, T>,
  TabProps<'Grocery'>
>;
