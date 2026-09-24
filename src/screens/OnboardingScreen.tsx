import {useState} from 'react';
import {Image, Pressable, StyleSheet, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {SlideInLeft, SlideInRight} from 'react-native-reanimated';
import {Camera} from 'phosphor-react-native';
import {colors, radii} from '../theme/tokens';
import {AppButton, AppText, Chip, FamFeastLogo, Screen} from '../components/ui';
import {useHouseholdMutations} from '../hooks/useFamFeast';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {useAppStore} from '../store/useAppStore';
import {PLAN_PRICE, PLAN_SEATS, type HouseholdPlanId, type HouseholdRole} from '../domain/types';
import {pickProfilePhoto} from '../utils/photo';

const ROLES: HouseholdRole[] = ['Mother', 'Father', 'Son', 'Daughter', 'Grandma', 'Grandpa', 'Custom'];

export function OnboardingScreen() {
  const snapshot = useAppStore(state => state.snapshot);
  if (!snapshot.signedIn) {
    return <AccountStep />;
  }
  if (!snapshot.photoStepComplete) {
    return <PhotoStep />;
  }
  if (!snapshot.planChosen) {
    return <PaywallStep />;
  }
  return <HouseholdStep />;
}

function AccountStep() {
  const reduced = useReducedMotion();
  const [page, setPage] = useState<'signup' | 'signin'>('signup');
  if (page === 'signin') {
    return <SignInPage animate={!reduced} onCreateAccount={() => setPage('signup')} />;
  }
  return <SignUpPage animate={!reduced} onSignIn={() => setPage('signin')} />;
}

function SignUpPage({animate, onSignIn}: {animate: boolean; onSignIn: () => void}) {
  const insets = useSafeAreaInsets();
  const showToast = useAppStore(state => state.showToast);
  const {signUp, completeOnboarding} = useHouseholdMutations();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await signUp({name, email, password});
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Animated.View style={styles.fill} entering={animate ? SlideInRight.duration(240) : undefined}>
      <Screen keyboard contentContainerStyle={[styles.page, {paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32}]}>
        <View style={styles.heroMark}>
          <FamFeastLogo size={96} />
        </View>
        <AppText variant="headlineXl">Create your account</AppText>
        <AppText variant="bodyMd" color={colors.onSurfaceVariant}>
          Next you’ll add a photo, then pick a plan.
        </AppText>
        <TextInput
          accessibilityLabel="Your name"
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.outline}
          autoCapitalize="words"
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.outline}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.outline}
          secureTextEntry
          style={styles.input}
        />
        <AppButton label="Create account" loading={busy} onPress={submit} />
        <Pressable onPress={onSignIn} accessibilityRole="button" style={styles.switchLine}>
          <AppText variant="bodySm" color={colors.onSurfaceVariant}>
            Already have an account?{' '}
          </AppText>
          <AppText variant="labelLg" color={colors.primary}>
            Sign in
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => completeOnboarding({householdName: 'The Miller Feast', members: [], theme: 'party', useDemo: true})}
          disabled={busy}
          accessibilityRole="button"
          style={styles.demo}>
          <AppText variant="labelMd" color={colors.primary} align="center">
            Preview the Miller Feast demo
          </AppText>
        </Pressable>
      </Screen>
    </Animated.View>
  );
}

function SignInPage({animate, onCreateAccount}: {animate: boolean; onCreateAccount: () => void}) {
  const insets = useSafeAreaInsets();
  const showToast = useAppStore(state => state.showToast);
  const {signIn} = useHouseholdMutations();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await signIn({email, password});
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Animated.View style={styles.fill} entering={animate ? SlideInLeft.duration(240) : undefined}>
      <Screen keyboard contentContainerStyle={[styles.page, {paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32}]}>
        <View style={styles.heroMark}>
          <FamFeastLogo size={96} />
        </View>
        <AppText variant="headlineXl">Sign in</AppText>
        <AppText variant="bodyMd" color={colors.onSurfaceVariant}>
          Open the household you already created.
        </AppText>
        <TextInput
          accessibilityLabel="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.outline}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
        />
        <TextInput
          accessibilityLabel="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={colors.outline}
          secureTextEntry
          style={styles.input}
        />
        <AppButton label="Sign in" loading={busy} onPress={submit} />
        <Pressable onPress={onCreateAccount} accessibilityRole="button" style={styles.switchLine}>
          <AppText variant="bodySm" color={colors.onSurfaceVariant}>
            New to FamFeast?{' '}
          </AppText>
          <AppText variant="labelLg" color={colors.primary}>
            Create an account
          </AppText>
        </Pressable>
      </Screen>
    </Animated.View>
  );
}

function PhotoStep() {
  const insets = useSafeAreaInsets();
  const showToast = useAppStore(state => state.showToast);
  const {setAccountPhoto, skipPhotoStep} = useHouseholdMutations();
  const [photoUri, setPhotoUri] = useState<string>();
  const [busy, setBusy] = useState(false);

  const choosePhoto = async () => {
    try {
      const uri = await pickProfilePhoto();
      if (uri) {
        setPhotoUri(uri);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not open your photos.', 'error');
    }
  };

  const continueWithPhoto = async () => {
    if (!photoUri) {
      return;
    }
    setBusy(true);
    try {
      await setAccountPhoto(photoUri);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard contentContainerStyle={[styles.page, {paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32}]}>
      <View style={styles.heroMark}>
        <FamFeastLogo size={96} />
      </View>
      <AppText variant="headlineXl">Add a photo</AppText>
      <AppText variant="bodyMd" color={colors.onSurfaceVariant}>
        This is the picture your household will see.
      </AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="Add a profile photo" onPress={choosePhoto} style={styles.photo}>
        {photoUri ? <Image source={{uri: photoUri}} style={styles.photoImage} /> : <Camera size={28} color={colors.primary} />}
      </Pressable>
      <AppText variant="labelMd" color={colors.onSurfaceVariant} align="center">
        {photoUri ? 'Change photo' : 'Choose a photo'}
      </AppText>
      <AppButton label="Continue" loading={busy} disabled={!photoUri} onPress={continueWithPhoto} />
      <Pressable
        onPress={() => skipPhotoStep()}
        disabled={busy}
        accessibilityRole="button"
        style={styles.demo}>
        <AppText variant="labelMd" color={colors.onSurfaceVariant} align="center">
          Skip for now
        </AppText>
      </Pressable>
    </Screen>
  );
}

function PaywallStep() {
  const insets = useSafeAreaInsets();
  const showToast = useAppStore(state => state.showToast);
  const {choosePlan, signOut} = useHouseholdMutations();
  const [plan, setPlan] = useState<HouseholdPlanId>('family');
  const [busy, setBusy] = useState(false);

  const continuePlan = async () => {
    setBusy(true);
    try {
      await choosePlan(plan);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen contentContainerStyle={[styles.page, {paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32}]}>
      <AppText variant="headlineXl">Choose a plan</AppText>
      <AppText variant="bodyMd" color={colors.onSurfaceVariant}>
        One subscription covers the household. People you invite don’t pay again.
      </AppText>
      <PlanCard
        title="Just me"
        price={PLAN_PRICE.solo}
        detail="One person. Plan meals for yourself."
        selected={plan === 'solo'}
        onPress={() => setPlan('solo')}
      />
      <PlanCard
        title="Family"
        price={PLAN_PRICE.family}
        detail={`Up to ${PLAN_SEATS.family} people. Invite them with a link or code.`}
        selected={plan === 'family'}
        onPress={() => setPlan('family')}
      />
      <AppButton label="Continue" loading={busy} onPress={continuePlan} />
      <Pressable onPress={() => signOut()} accessibilityRole="button" style={styles.demo}>
        <AppText variant="labelMd" color={colors.onSurfaceVariant} align="center">
          Back to account
        </AppText>
      </Pressable>
    </Screen>
  );
}

function PlanCard({
  title,
  price,
  detail,
  selected,
  onPress,
}: {
  title: string;
  price: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{selected}}
      onPress={onPress}
      style={[styles.plan, selected && styles.planOn]}>
      <View style={styles.planTop}>
        <AppText variant="headlineMd" style={styles.flex} numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="labelLg" color={colors.primary} numberOfLines={1}>
          {price}
        </AppText>
      </View>
      <AppText variant="bodySm" color={colors.onSurfaceVariant}>
        {detail}
      </AppText>
    </Pressable>
  );
}

function HouseholdStep() {
  const insets = useSafeAreaInsets();
  const accountName = useAppStore(state => state.snapshot.account?.name ?? '');
  const showToast = useAppStore(state => state.showToast);
  const {createHousehold, reopenPaywall} = useHouseholdMutations();
  const [householdName, setHouseholdName] = useState('');
  const [memberName, setMemberName] = useState(accountName);
  const [role, setRole] = useState<HouseholdRole>('Custom');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      await createHousehold({householdName, memberName, role});
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Try again.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard contentContainerStyle={[styles.page, {paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32}]}>
      <AppText variant="headlineXl">Create your household</AppText>
      <AppText variant="bodyMd" color={colors.onSurfaceVariant}>
        This is the kitchen everyone in your plan will share.
      </AppText>
      <AppText variant="labelLg">Household name</AppText>
      <TextInput
        accessibilityLabel="Household name"
        value={householdName}
        onChangeText={setHouseholdName}
        placeholder="The Miller Feast"
        placeholderTextColor={colors.outline}
        style={styles.input}
      />
      <AppText variant="labelLg">Your name</AppText>
      <TextInput
        accessibilityLabel="Your name"
        value={memberName}
        onChangeText={setMemberName}
        placeholder="Your name"
        placeholderTextColor={colors.outline}
        style={styles.input}
      />
      <AppText variant="labelLg">Your role</AppText>
      <View style={styles.wrap}>
        {ROLES.map(item => (
          <Chip key={item} label={item} selected={role === item} onPress={() => setRole(item)} />
        ))}
      </View>
      <AppButton label="Create household" loading={busy} onPress={create} />
      <Pressable onPress={() => reopenPaywall()} accessibilityRole="button" style={styles.demo}>
        <AppText variant="labelMd" color={colors.onSurfaceVariant} align="center">
          Back to plans
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {},
  fill: {flex: 1},
  heroMark: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  photo: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: 96,
    height: 96,
  },
  flex: {flex: 1, minWidth: 0},
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
  switchLine: {
    minHeight: 44,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plan: {
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceLowest,
    padding: 16,
    gap: 6,
  },
  planOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryFixed,
  },
  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  demo: {
    minHeight: 44,
    justifyContent: 'center',
  },
});
