import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Basket,
  CookingPot,
  DiceFive,
  House,
  CheckSquare,
} from 'phosphor-react-native';
import { colors, fonts, shadows } from '../../theme/tokens';
import { ScheduleScreen } from '../../screens/ScheduleScreen';
import { ChefsScreen } from '../../screens/ChefsScreen';
import { SpinScreen } from '../../screens/SpinScreen';
import { VotingScreen } from '../../screens/VotingScreen';
import { GroceryStack } from './GroceryStack';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        lazy: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: fonts.bold,
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.2,
          marginTop: 4,
        },
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          paddingHorizontal: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarStyle: [
          styles.bar,
          {
            height: 56 + bottomPad,
            paddingBottom: bottomPad,
          },
        ],
        tabBarIcon: ({ color, focused }) => {
          const icons = {
            Schedule: House,
            Chefs: CookingPot,
            Spin: DiceFive,
            Voting: CheckSquare,
            Grocery: Basket,
          };
          const Icon = icons[route.name];
          return (
            <View style={styles.iconWrap}>
              <Icon
                color={color}
                size={24}
                weight={focused ? 'fill' : 'regular'}
              />
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ tabBarLabel: 'Schedule' }}
      />
      <Tab.Screen
        name="Chefs"
        component={ChefsScreen}
        options={{ tabBarLabel: 'Chefs' }}
      />
      <Tab.Screen
        name="Spin"
        component={SpinScreen}
        options={{ tabBarLabel: 'Spin' }}
      />
      <Tab.Screen
        name="Voting"
        component={VotingScreen}
        options={{ tabBarLabel: 'Voting' }}
      />
      <Tab.Screen
        name="Grocery"
        component={GroceryStack}
        options={{ tabBarLabel: 'Grocery' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'rgba(248,249,255,0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.outlineVariant,
    paddingTop: 8,
    paddingHorizontal: 4,
    ...shadows.tabBar,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
