import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {services} from '../services';
import {useAppStore} from '../store/useAppStore';
import type {MealSlot, MealType, MoodId} from '../domain/types';
import type {WeeklyThemeId} from '../theme/weeklyThemes';
import type {SpinInput} from '../services/interfaces';

const keys = {
  bootstrap: ['bootstrap'] as const,
  plan: ['plan'] as const,
  recipes: ['recipes'] as const,
  members: ['members'] as const,
  suggestions: ['suggestions'] as const,
  grocery: ['grocery'] as const,
  pantry: ['pantry'] as const,
};

export function useBootstrap() {
  return useQuery({
    queryKey: keys.bootstrap,
    queryFn: () => services.household.bootstrap(),
  });
}

export function useWeeklyPlan() {
  return useQuery({
    queryKey: keys.plan,
    queryFn: () => services.mealPlan.getWeeklyPlan(),
    placeholderData: () => useAppStore.getState().snapshot.plan,
  });
}

export function useRecipes() {
  return useQuery({
    queryKey: keys.recipes,
    queryFn: () => services.recipes.listRecipes(),
    placeholderData: () => useAppStore.getState().snapshot.recipes,
  });
}

export function useMembers() {
  return useQuery({
    queryKey: keys.members,
    queryFn: () => services.household.listMembers(),
    placeholderData: () => useAppStore.getState().snapshot.members,
  });
}

export function useSuggestions() {
  return useQuery({
    queryKey: keys.suggestions,
    queryFn: () => services.suggestions.list(),
    placeholderData: () => useAppStore.getState().snapshot.suggestions,
  });
}

export function useGrocery() {
  return useQuery({
    queryKey: keys.grocery,
    queryFn: () => services.grocery.listGrocery(),
    placeholderData: () => useAppStore.getState().snapshot.grocery,
  });
}

export function usePantry() {
  return useQuery({
    queryKey: keys.pantry,
    queryFn: () => services.grocery.listPantry(),
    placeholderData: () => useAppStore.getState().snapshot.pantry,
  });
}

function useInvalidateAll() {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({queryKey: keys.plan}),
      client.invalidateQueries({queryKey: keys.recipes}),
      client.invalidateQueries({queryKey: keys.members}),
      client.invalidateQueries({queryKey: keys.suggestions}),
      client.invalidateQueries({queryKey: keys.grocery}),
      client.invalidateQueries({queryKey: keys.pantry}),
      client.invalidateQueries({queryKey: keys.bootstrap}),
    ]);
}

export function usePlanMutations() {
  const invalidate = useInvalidateAll();
  const toast = useAppStore(state => state.showToast);

  const wrap = <T,>(fn: () => Promise<T>, success?: string) =>
    fn()
      .then(async result => {
        await invalidate();
        if (success) {
          toast(success, 'success');
        }
        return result;
      })
      .catch((error: Error) => {
        toast(error.message, 'error');
        throw error;
      });

  return {
    updateSlot: (slotId: string, patch: Partial<MealSlot>) =>
      wrap(() => services.mealPlan.updateSlot(slotId, patch), 'Meal updated'),
    assignChef: (date: string, chefId: string) =>
      wrap(() => services.mealPlan.assignChef(date, chefId), 'Chef assigned'),
    balanceRoster: () => wrap(() => services.mealPlan.balanceRoster(), 'Roster balanced across the week'),
    setTheme: (theme: WeeklyThemeId) => wrap(() => services.mealPlan.setTheme(theme), 'Weekly vibe updated'),
    setMood: (moodId: MoodId, energyLabel: string) => wrap(() => services.mealPlan.setMood(moodId, energyLabel)),
    markEatingOut: (date: string, moveDinnerTo?: string) =>
      wrap(() => services.mealPlan.markEatingOut(date, moveDinnerTo), 'Tonight switched to eating out'),
    restoreHomeCook: (date: string) =>
      wrap(() => services.mealPlan.restoreHomeCook(date), 'Home cooking restored'),
    togglePrep: (taskId: string) => wrap(() => services.mealPlan.togglePrepTask(taskId)),
    lockRecipe: (input: {date: string; mealType: MealType; recipeId: string; chefId?: string}) =>
      wrap(() => services.mealPlan.lockRecipeToSlot(input), 'Locked into the weekly plan'),
    setOccasion: (date: string, occasion?: import('../domain/types').DayOccasion) =>
      wrap(() => services.mealPlan.setOccasion(date, occasion), occasion ? 'Day marked' : 'Day cleared'),
    setCalendarSpan: (span: import('../domain/types').CalendarSpan) =>
      wrap(() => services.mealPlan.setCalendarSpan(span)),
  };
}

export function useHouseholdMutations() {
  const invalidate = useInvalidateAll();
  const toast = useAppStore(state => state.showToast);
  return {
    setCurrentMember: (id: string) =>
      services.household.setCurrentMember(id).then(async member => {
        await invalidate();
        toast(`Viewing as ${member.displayName}`, 'info');
        return member;
      }),
    removeMember: (id: string) =>
      services.household
        .removeMember(id)
        .then(async () => {
          await invalidate();
          toast('Member removed. Chef assignments were cleared.', 'info');
        })
        .catch((error: Error) => {
          toast(error.message, 'error');
          throw error;
        }),
    addMember: (...args: Parameters<typeof services.household.addMember>) =>
      services.household
        .addMember(...args)
        .then(async member => {
          await invalidate();
          toast(`${member.name} joined the household`, 'success');
          return member;
        })
        .catch((error: Error) => {
          toast(error.message, 'error');
          throw error;
        }),
    updateMember: (id: string, patch: Parameters<typeof services.household.updateMember>[1]) =>
      services.household
        .updateMember(id, patch)
        .then(async member => {
          await invalidate();
          toast(`${member.name} updated`, 'success');
          return member;
        })
        .catch((error: Error) => {
          toast(error.message, 'error');
          throw error;
        }),
    signUp: (input: Parameters<typeof services.household.signUp>[0]) =>
      services.household.signUp(input).then(async snapshot => {
        await invalidate();
        return snapshot;
      }),
    setAccountPhoto: (photoUri: string) =>
      services.household.setAccountPhoto(photoUri).then(async snapshot => {
        await invalidate();
        return snapshot;
      }),
    skipPhotoStep: () =>
      services.household.skipPhotoStep().then(async snapshot => {
        await invalidate();
        return snapshot;
      }),
    signIn: (input: Parameters<typeof services.household.signIn>[0]) =>
      services.household.signIn(input).then(async snapshot => {
        await invalidate();
        return snapshot;
      }),
    choosePlan: (plan: Parameters<typeof services.household.choosePlan>[0]) =>
      services.household.choosePlan(plan).then(async snapshot => {
        await invalidate();
        return snapshot;
      }),
    reopenPaywall: () =>
      services.household.reopenPaywall().then(async snapshot => {
        await invalidate();
        return snapshot;
      }),
    createHousehold: (input: Parameters<typeof services.household.createHousehold>[0]) =>
      services.household.createHousehold(input).then(async snapshot => {
        await invalidate();
        return snapshot;
      }),
    completeOnboarding: (...args: Parameters<typeof services.household.completeOnboarding>) =>
      services.household.completeOnboarding(...args).then(async snapshot => {
        await invalidate();
        return snapshot;
      }),
    updateHousehold: (patch: Parameters<typeof services.household.updateHousehold>[0]) => {
      const prev = useAppStore.getState().snapshot;
      useAppStore.setState({
        snapshot: {
          ...prev,
          household: {...prev.household, ...patch},
          plan: patch.theme ? {...prev.plan, theme: patch.theme} : prev.plan,
        },
      });
      return services.household
        .updateHousehold(patch)
        .then(async household => {
          await invalidate();
          return household;
        })
        .catch((error: Error) => {
          useAppStore.setState({snapshot: prev});
          toast(error.message, 'error');
          throw error;
        });
    },
    signOut: () =>
      services.household.signOut().then(async () => {
        await invalidate();
      }),
  };
}

export function useSpinMutation() {
  const invalidate = useInvalidateAll();
  const toast = useAppStore(state => state.showToast);
  return useMutation({
    mutationFn: (input: SpinInput) => services.randomizer.spin(input),
    onSuccess: () => invalidate(),
    onError: (error: Error) => toast(error.message, 'error'),
  });
}

export function useSuggestionMutations() {
  const invalidate = useInvalidateAll();
  const toast = useAppStore(state => state.showToast);
  return {
    submit: (input: Parameters<typeof services.suggestions.submit>[0]) =>
      services.suggestions
        .submit(input)
        .then(async result => {
          await invalidate();
          toast('Tossed into the family ballot', 'success');
          return result;
        })
        .catch((error: Error) => {
          toast(error.message, 'error');
          throw error;
        }),
    vote: (id: string, direction: 'up' | 'down') =>
      services.suggestions.vote(id, direction).then(async result => {
        await invalidate();
        return result;
      }),
    decide: (id: string, status: 'accepted' | 'rejected') =>
      services.suggestions
        .decide(id, status)
        .then(async result => {
          await invalidate();
          toast(status === 'accepted' ? 'Suggestion locked into the plan' : 'Suggestion archived', 'success');
          return result;
        })
        .catch((error: Error) => {
          toast(error.message, 'error');
          throw error;
        }),
  };
}
