import {useState} from 'react';
import {Pressable, StyleSheet, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, radii} from '../theme/tokens';
import {THEME_LIST, type WeeklyThemeId} from '../theme/weeklyThemes';
import {AppButton, AppText, Chip, FamFeastLogo, Screen} from '../components/ui';
import {useHouseholdMutations} from '../hooks/useFamFeast';
import type {HouseholdRole, Permission} from '../domain/types';

const ROLES: HouseholdRole[] = ['Mother', 'Father', 'Son', 'Daughter', 'Grandma', 'Grandpa', 'Custom'];

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const {completeOnboarding} = useHouseholdMutations();
  const [name, setName] = useState('The Miller Feast');
  const [memberName, setMemberName] = useState('Sarah');
  const [role, setRole] = useState<HouseholdRole>('Mother');
  const [theme, setTheme] = useState<WeeklyThemeId>('party');
  const [busy, setBusy] = useState(false);

  const start = async (useDemo: boolean) => {
    setBusy(true);
    try {
      await completeOnboarding({
        householdName: name,
        theme,
        useDemo,
        members: useDemo
          ? []
          : [
              {
                name: memberName || 'Chef',
                role,
                permission: 'editor' as Permission,
                specialty: 'Weeknight dinners',
              },
            ],
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard contentContainerStyle={[styles.page, {paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32}]}>
      <View style={styles.heroMark}>
        <FamFeastLogo size={128} />
      </View>
      <AppText variant="headlineXl">Welcome to FamFeast</AppText>
      <AppText variant="bodyMd" color={colors.onSurfaceVariant}>
        Plan the week, share the apron, and keep dinner feeling like a family ritual — not another chore.
      </AppText>

      <AppText variant="labelLg">Household name</AppText>
      <TextInput
        accessibilityLabel="Household name"
        value={name}
        onChangeText={setName}
        placeholder="The Miller Feast"
        placeholderTextColor={colors.outline}
        style={styles.input}
      />

      <AppText variant="labelLg">First chef</AppText>
      <TextInput
        accessibilityLabel="First family member name"
        value={memberName}
        onChangeText={setMemberName}
        placeholder="Name"
        placeholderTextColor={colors.outline}
        style={styles.input}
      />
      <View style={styles.wrap}>
        {ROLES.map(item => (
          <Chip key={item} label={item} selected={role === item} onPress={() => setRole(item)} />
        ))}
      </View>

      <AppText variant="labelLg">Starting weekly vibe</AppText>
      <View style={styles.wrap}>
        {THEME_LIST.map(item => (
          <Chip key={item.id} label={item.label} selected={theme === item.id} onPress={() => setTheme(item.id)} />
        ))}
      </View>

      <AppButton label="Start our household" loading={busy} onPress={() => start(false)} />
      <Pressable onPress={() => start(true)} disabled={busy} accessibilityRole="button" style={styles.demo}>
        <AppText variant="labelMd" color={colors.primary} align="center">
          Preview the Miller Feast demo
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {},
  heroMark: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  input: {
    minHeight: 50,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceLowest,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.onSurface,
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 16,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demo: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
