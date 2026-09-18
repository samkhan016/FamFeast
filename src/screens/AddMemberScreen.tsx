import {useState} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';
import {colors, radii} from '../theme/tokens';
import {AppButton, AppText, Chip, Screen, ScreenHeader} from '../components/ui';
import {useAppStore} from '../store/useAppStore';
import {useHouseholdMutations} from '../hooks/useFamFeast';
import type {HouseholdRole, Permission} from '../domain/types';
import type {RootProps} from '../app/navigation/types';

const ROLES: HouseholdRole[] = ['Mother', 'Father', 'Son', 'Daughter', 'Grandma', 'Grandpa', 'Custom'];
const PERMS: Permission[] = ['editor', 'suggester', 'viewer'];

export function AddMemberScreen({navigation, route}: RootProps<'AddMember'>) {
  const existing = useAppStore(state => state.snapshot.members.find(member => member.id === route.params?.memberId));
  const [name, setName] = useState(existing?.name ?? '');
  const [role, setRole] = useState<HouseholdRole>(existing?.role ?? 'Custom');
  const [permission, setPermission] = useState<Permission>(existing?.permission ?? 'suggester');
  const [specialty, setSpecialty] = useState(existing?.specialty ?? 'Kitchen helper');
  const {addMember, updateMember} = useHouseholdMutations();

  return (
    <Screen
      keyboard
      header={<ScreenHeader subtitle={existing ? 'Edit member' : 'Add helper'} onBack={() => navigation.goBack()} onProfile={() => navigation.navigate('HouseholdShare')} />}>
      <TextInput accessibilityLabel="Name" value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.outline} style={styles.input} />
      <TextInput accessibilityLabel="Specialty" value={specialty} onChangeText={setSpecialty} placeholder="Specialty" placeholderTextColor={colors.outline} style={styles.input} />
      <AppText variant="labelLg">Role</AppText>
      <View style={styles.row}>
        {ROLES.map(item => (
          <Chip key={item} label={item} selected={role === item} onPress={() => setRole(item)} />
        ))}
      </View>
      <AppText variant="labelLg">Permission</AppText>
      <View style={styles.row}>
        {PERMS.map(item => (
          <Chip key={item} label={item} selected={permission === item} onPress={() => setPermission(item)} />
        ))}
      </View>
      <AppButton
        label={existing ? 'Save member' : 'Add to household'}
        onPress={async () => {
          if (!name.trim()) {
            return;
          }
          if (existing) {
            await updateMember(existing.id, {name: name.trim(), role, permission, specialty});
          } else {
            await addMember({
              name: name.trim(),
              role,
              permission,
              specialty,
              badge: role,
              helper: permission !== 'editor',
            });
          }
          navigation.goBack();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.onSurface,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
});
