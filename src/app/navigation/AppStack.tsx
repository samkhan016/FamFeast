import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {colors} from '../../theme/tokens';
import {TabNavigator} from './TabNavigator';
import {OnboardingScreen} from '../../screens/OnboardingScreen';
import {RecipeDetailScreen} from '../../screens/RecipeDetailScreen';
import {MealEditorScreen} from '../../screens/MealEditorScreen';
import {AddRecipeScreen} from '../../screens/AddRecipeScreen';
import {AddMemberScreen} from '../../screens/AddMemberScreen';
import {ProfileScreen} from '../../screens/ProfileScreen';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppStack({onboarded}: {onboarded: boolean}) {
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: colors.primary,
          background: colors.surface,
          card: colors.surface,
          text: colors.onSurface,
          border: colors.outlineVariant,
          notification: colors.primary,
        },
        fonts: {
          regular: {fontFamily: 'PlusJakartaSans-Regular', fontWeight: '400'},
          medium: {fontFamily: 'PlusJakartaSans-Medium', fontWeight: '500'},
          bold: {fontFamily: 'PlusJakartaSans-Bold', fontWeight: '700'},
          heavy: {fontFamily: 'PlusJakartaSans-ExtraBold', fontWeight: '800'},
        },
      }}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {backgroundColor: colors.surface},
        }}>
        {onboarded ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
            <Stack.Screen name="MealEditor" component={MealEditorScreen} />
            <Stack.Screen name="AddRecipe" component={AddRecipeScreen} />
            <Stack.Screen name="AddMember" component={AddMemberScreen} />
            <Stack.Screen name="HouseholdShare" component={ProfileScreen} />
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
