import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GroceryScreen} from '../../screens/GroceryScreen';
import {colors} from '../../theme/tokens';
import type {GroceryStackParamList} from './types';

const Stack = createNativeStackNavigator<GroceryStackParamList>();

export function GroceryStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {backgroundColor: colors.surface},
      }}>
      <Stack.Screen name="GroceryHome" component={GroceryScreen} />
    </Stack.Navigator>
  );
}
