import { memo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  BowlFood,
  Cake,
  Camera,
  CaretRight,
  CookingPot,
  Fire,
  ForkKnife,
  PencilSimple,
  PlusCircle,
  SignOut,
  UserPlus,
} from 'phosphor-react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { colors, fonts, radii, spacing } from '../theme/tokens';
import { WEEKLY_THEMES } from '../theme/weeklyThemes';
import {
  AppText,
  Avatar,
  Card,
  EmptyState,
  ErrorState,
  ScreenHeader,
  Shimmer,
} from '../components/ui';
import {useHouseholdMutations, useMembers, usePlanMutations} from '../hooks/useFamFeast';
import { useAppStore } from '../store/useAppStore';
import { getShareLink } from '../services';
import type {HouseholdRole, Member} from '../domain/types';
import { PLAN_PRICE, PLAN_SEATS } from '../domain/types';
import { pickProfilePhoto } from '../utils/photo';
import type { RootProps } from '../app/navigation/types';

const ROLE_SHORT: Record<HouseholdRole, string> = {
  Mother: 'Mom',
  Father: 'Dad',
  Son: 'Son',
  Daughter: 'Daughter',
  Grandma: 'Grandma',
  Grandpa: 'Grandpa',
  Custom: 'Chef',
};

const MILLER_FALLBACK = {
  vibe: 'Rustic Comfort & Fresh Bakes',
};

const TOUCH = Platform.OS === 'ios' ? 44 : 48;

function crewBadge(isAdmin: boolean, isChef: boolean) {
  if (isAdmin && isChef) {
    return {label: 'Admin · Chef', bg: colors.primaryFixed, fg: colors.onPrimaryFixed};
  }
  if (isAdmin) {
    return {label: 'Admin', bg: colors.primaryFixed, fg: colors.onPrimaryFixed};
  }
  if (isChef) {
    return {label: 'Chef', bg: colors.secondaryFixed, fg: colors.onSecondaryFixed};
  }
  return {label: 'Household', bg: colors.surfaceHigh, fg: colors.onSurfaceVariant};
}

function MemberGlyph({ member, size = 18 }: { member: Member; size?: number }) {
  const tint = colors.onSurfaceVariant;
  if (member.role === 'Father') {
    return <Fire size={size} color={tint} />;
  }
  if (member.role === 'Son') {
    return <BowlFood size={size} color={tint} />;
  }
  if (member.role === 'Daughter') {
    return <Cake size={size} color={tint} />;
  }
  return <CookingPot size={size} color={tint} />;
}

export function ProfileScreen({ navigation }: RootProps<'HouseholdShare'>) {
  const membersQuery = useMembers();
  const snapshot = useAppStore(state => state.snapshot);
  const selectedDate = useAppStore(state => state.selectedDate);
  const canEdit = useAppStore(state => state.canEdit());
  const showToast = useAppStore(state => state.showToast);
  const {updateHousehold, signOut, setAccountPhoto} = useHouseholdMutations();
  const {assignChef} = usePlanMutations();

  const household = snapshot.household;
  const members = membersQuery.data ?? snapshot.members;
  const admin =
    members.find(member => member.id === household.ownerId) ?? members[0];
  const chefId = snapshot.plan.slots.find(
    slot => slot.date === selectedDate && slot.mealType === 'dinner',
  )?.chefId;
  const theme = WEEKLY_THEMES[household.theme];
  const isMiller = household.id === 'hh_miller';
  const vibe =
    household.vibe ||
    (isMiller ? MILLER_FALLBACK.vibe : theme?.tagline || household.houseRule);
  const [nameOpen, setNameOpen] = useState(false);
  const [draftName, setDraftName] = useState(household.name);

  const openNameEditor = () => {
    if (!canEdit) {
      showToast('Only editors can rename the household.', 'info');
      return;
    }
    setDraftName(household.name);
    setNameOpen(true);
  };

  const saveName = async () => {
    const next = draftName.trim();
    if (!next) {
      return;
    }
    await updateHousehold({ name: next });
    setNameOpen(false);
    showToast('Household name updated');
  };

  const invite = () => {
    Clipboard.setString(getShareLink());
    showToast(
      `Invite copied • ${
        household.inviteCode || getShareLink().replace('https://', '')
      }`,
      'success',
    );
  };

  const confirmSignOut = () => {
    Alert.alert(
      `Sign out of ${household.name || 'this kitchen'}?`,
      'You can rejoin later with the household invite code.',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            signOut().catch(() => undefined);
          },
        },
      ],
    );
  };

  if (membersQuery.isLoading && !members.length) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          subtitle="Profile & Household"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.content} accessibilityState={{ busy: true }}>
          <Shimmer height={148} radius={24} />
          <Shimmer height={180} radius={24} />
          <Shimmer height={88} radius={16} />
        </View>
      </View>
    );
  }

  if (membersQuery.isError) {
    return (
      <View style={styles.screen}>
        <ScreenHeader
          subtitle="Profile & Household"
          onBack={() => navigation.goBack()}
        />
        <ErrorState onRetry={() => membersQuery.refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        subtitle="Profile & Household"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.banner}>
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={styles.watermark}
          >
            <Fire size={144} color={colors.primary} />
          </View>
          <View style={styles.bannerTop}>
            <View style={styles.bannerIdentity}>
              <View
                style={styles.hearth}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Fire size={30} color={colors.primary} weight="fill" />
              </View>
              <View style={styles.flex}>
                <View style={styles.titleRow}>
                  <AppText
                    variant="headlineMd"
                    numberOfLines={1}
                    style={styles.flex}
                  >
                    {household.name || 'Your Kitchen'}
                  </AppText>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit household name"
                    onPress={openNameEditor}
                    hitSlop={10}
                    style={({ pressed }) => [
                      styles.editName,
                      pressed && styles.pressed,
                    ]}
                  >
                    <PencilSimple size={15} color={colors.onSurfaceVariant} />
                  </Pressable>
                </View>
                <AppText
                  variant="labelSm"
                  color={colors.onSurfaceVariant}
                  numberOfLines={2}
                  style={styles.meta}
                >
                  {household.plan === 'family' ? 'Family' : 'Just me'} ·{' '}
                  {PLAN_PRICE[household.plan] ?? PLAN_PRICE.solo} ·{' '}
                  {members.length} of {PLAN_SEATS[household.plan] ?? 1}
                </AppText>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Invite household members"
              onPress={invite}
              style={({ pressed }) => [
                styles.invite,
                pressed && styles.pressed,
              ]}
            >
              <UserPlus size={16} color={colors.primary} />
              <AppText variant="labelMd" color={colors.primary}>
                Invite
              </AppText>
            </Pressable>
          </View>
          <View style={styles.vibe}>
            <View style={styles.vibeCopy}>
              <ForkKnife size={20} color={colors.primary} weight="fill" />
              <AppText variant="labelMd" numberOfLines={2} style={styles.flex}>
                Household Vibe: {vibe || 'Set a weekly theme'}
              </AppText>
            </View>
            <View style={styles.sync}>
              <View
                style={[
                  styles.syncDot,
                  !household.autoRotate && styles.syncDotOff,
                ]}
              />
              <AppText
                variant="labelSm"
                color={colors.onSecondaryContainer}
                numberOfLines={1}
              >
                {household.autoRotate ? 'Synchronized' : 'Manual'}
              </AppText>
            </View>
          </View>
        </Card>

        {admin ? (
          <Card style={styles.profileCard}>
            <View style={styles.profileTop}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change account photo"
                onPress={async () => {
                  try {
                    const uri = await pickProfilePhoto();
                    if (uri) {
                      await setAccountPhoto(uri);
                    }
                  } catch (error) {
                    showToast(
                      error instanceof Error
                        ? error.message
                        : 'Could not open your photos.',
                      'error',
                    );
                  }
                }}
                style={styles.avatarButton}
              >
                <Avatar member={admin} size={64} />
                <View style={styles.chefBadge}>
                  <Camera size={13} color={colors.onPrimary} weight="fill" />
                </View>
              </Pressable>
              <View style={styles.flex}>
                <View style={styles.profileNames}>
                  <View style={styles.nameCluster}>
                    <AppText
                      variant="headlineMd"
                      numberOfLines={1}
                      style={styles.flex}
                    >
                      {admin.displayName}
                    </AppText>
                    <View style={styles.adminPill}>
                      <AppText
                        variant="labelSm"
                        color={colors.onPrimaryFixed}
                        numberOfLines={1}
                      >
                        Admin
                      </AppText>
                    </View>
                  </View>
                  <View style={styles.rolePill}>
                    <AppText
                      variant="labelSm"
                      color={colors.primary}
                      style={styles.roleCopy}
                      numberOfLines={1}
                    >
                      {ROLE_SHORT[admin.role]}
                    </AppText>
                  </View>
                </View>
                <AppText
                  variant="bodySm"
                  color={colors.onSurfaceVariant}
                  numberOfLines={2}
                >
                  {admin.specialty}
                </AppText>
              </View>
            </View>
          </Card>
        ) : null}

        <View style={styles.crewHead}>
          <View style={styles.flex}>
            <AppText variant="headlineMd" numberOfLines={1}>
              Household Crew
            </AppText>
            <AppText
              variant="bodySm"
              color={colors.onSurfaceVariant}
              numberOfLines={1}
            >
              Tap a person to change the chef
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add household member"
            onPress={() => {
              const seats = PLAN_SEATS[household.plan] ?? 1;
              if (members.length >= seats) {
                showToast(
                  household.plan === 'family'
                    ? 'This family plan already has 4 people.'
                    : 'Switch to the $20 family plan to add people.',
                  'info',
                );
                return;
              }
              navigation.navigate('AddMember');
            }}
            style={({ pressed }) => [
              styles.addMember,
              pressed && styles.pressed,
            ]}
          >
            <PlusCircle size={18} color={colors.primary} />
            <AppText variant="labelMd" color={colors.primary} numberOfLines={1}>
              Add Member
            </AppText>
          </Pressable>
        </View>

        {members.length === 0 ? (
          <EmptyState
            title="No family members yet"
            body="Add the household so someone can claim the apron."
            actionLabel="Add a member"
            onAction={() => navigation.navigate('AddMember')}
          />
        ) : (
          members.map(member => (
            <CrewRow
              key={member.id}
              member={member}
              isAdmin={member.id === household.ownerId}
              isChef={member.id === chefId}
              onPress={() => {
                if (!canEdit) {
                  showToast('Only the admin can change the chef.', 'info');
                  return;
                }
                assignChef(selectedDate, member.id);
              }}
            />
          ))
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sign out of ${household.name || 'this kitchen'}`}
          onPress={confirmSignOut}
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
        >
          <SignOut size={18} color={colors.error} />
          <AppText variant="labelMd" color={colors.error} numberOfLines={1}>
            Sign Out of {household.name || 'this kitchen'}
          </AppText>
        </Pressable>
      </ScrollView>

      <Modal
        visible={nameOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNameOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.scrim}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={styles.scrimPress}
            onPress={() => setNameOpen(false)}
          >
            <Pressable style={styles.sheet} onPress={() => undefined}>
              <AppText variant="headlineMd">Rename household</AppText>
              <TextInput
                accessibilityLabel="Household name"
                value={draftName}
                onChangeText={setDraftName}
                placeholder="The Miller Kitchen"
                placeholderTextColor={colors.outline}
                style={styles.input}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <View style={styles.sheetActions}>
                <Pressable
                  onPress={() => setNameOpen(false)}
                  style={styles.cancel}
                >
                  <AppText variant="labelMd">Cancel</AppText>
                </Pressable>
                <Pressable onPress={saveName} style={styles.save}>
                  <AppText variant="labelMd" color={colors.onPrimary}>
                    Save
                  </AppText>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const CrewRow = memo(function CrewMemberRow({
  member,
  isAdmin,
  isChef,
  onPress,
}: {
  member: Member;
  isAdmin: boolean;
  isChef: boolean;
  onPress: () => void;
}) {
  const badge = crewBadge(isAdmin, isChef);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isAdmin
          ? `${member.displayName}, admin${isChef ? ', chef' : ''}`
          : `Make ${member.displayName} the chef`
      }
      accessibilityState={{selected: isChef}}
      onPress={onPress}
      style={({ pressed }) => [styles.crewRow, pressed && styles.pressed]}
    >
      <View style={styles.crewLeft}>
        <View>
          <Avatar member={member} size={44} />
          {isChef ? <View style={styles.liveDot} /> : null}
        </View>
        <View style={styles.flex}>
          <View style={styles.crewNameRow}>
            <AppText variant="labelLg" numberOfLines={1} style={styles.flex}>
              {member.displayName}
            </AppText>
            <View style={[styles.crewBadge, { backgroundColor: badge.bg }]}>
              <AppText variant="labelSm" color={badge.fg} numberOfLines={1}>
                {badge.label}
              </AppText>
            </View>
          </View>
          <AppText
            variant="bodySm"
            color={colors.onSurfaceVariant}
            numberOfLines={1}
          >
            {member.badge} • {member.specialty}
          </AppText>
        </View>
      </View>
      <View
        style={styles.crewRight}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <View
          style={styles.glyph}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <MemberGlyph member={member} />
        </View>
        <CaretRight size={20} color={colors.onSurfaceVariant} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.margin, gap: 20, paddingBottom: 48 },
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  banner: { overflow: 'hidden', padding: 20, gap: 16 },
  watermark: { position: 'absolute', right: -24, bottom: -28, opacity: 0.08 },
  bannerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 1,
    flexWrap: 'wrap',
  },
  bannerIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  hearth: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  editName: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  meta: { marginTop: 2 },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: TOUCH,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceHigh,
    flexShrink: 0,
  },
  vibe: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.surfaceLow,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    zIndex: 1,
  },
  vibeCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  sync: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
    maxWidth: '42%',
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },
  syncDotOff: { backgroundColor: colors.onSurfaceVariant },
  profileCard: { padding: 20, gap: 16 },
  profileTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  avatarButton: { flexShrink: 0 },
  chefBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileNames: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  adminPill: {
    backgroundColor: colors.primaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    flexShrink: 0,
  },
  rolePill: {
    backgroundColor: 'rgba(255,219,206,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    flexShrink: 0,
  },
  roleCopy: { fontFamily: fonts.bold },
  streak: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.tertiaryFixed,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '100%',
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLow,
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  stat: { flex: 1, alignItems: 'center', minWidth: 0 },
  statValue: { fontFamily: fonts.bold },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  crewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 4,
  },
  addMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: TOUCH,
    flexShrink: 0,
  },
  crewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.surfaceLowest,
    borderRadius: 16,
    padding: 14,
    ...{
      shadowColor: '#EA580C',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
  },
  crewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  crewNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  crewBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
    maxWidth: '100%',
  },
  liveDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.surfaceLowest,
  },
  crewRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  glyph: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionCard: { padding: 20, gap: 16 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAll: { minHeight: TOUCH, justifyContent: 'center', flexShrink: 0 },
  editAllCopy: { fontFamily: fonts.bold },
  kicker: { textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: colors.surfaceLow,
    borderRadius: 16,
    padding: 14,
  },
  habitCopy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  shortcuts: { padding: 12, gap: 4 },
  shortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    minHeight: TOUCH,
  },
  shortcutPressed: { backgroundColor: colors.surfaceLow },
  switchKitchen: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  signOut: {
    minHeight: TOUCH,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  scrim: { flex: 1 },
  scrimPress: {
    flex: 1,
    backgroundColor: 'rgba(18,28,42,0.45)',
    justifyContent: 'center',
    padding: spacing.margin,
  },
  sheet: {
    backgroundColor: colors.surfaceLowest,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  input: {
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 16,
    color: colors.onSurface,
    fontFamily: fonts.regular,
  },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  cancel: {
    minHeight: TOUCH,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  save: {
    minHeight: TOUCH,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
});
