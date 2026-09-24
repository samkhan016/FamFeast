import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {ArrowsClockwise, CookingPot, Plus, Shuffle, CaretRight} from 'phosphor-react-native';
import {colors, radii, spacing} from '../theme/tokens';
import {AppSwitch, AppText, Avatar, Card, EmptyState, ErrorState, ScreenHeader, Shimmer} from '../components/ui';
import {ChefShiftSelector} from '../components/planner/DaySelector';
import {useHouseholdMutations, useMembers, usePlanMutations, useWeeklyPlan} from '../hooks/useFamFeast';
import {useAppStore} from '../store/useAppStore';
import {formatWeekRangeShort, weekdayName} from '../utils/dates';
import type {TabProps} from '../app/navigation/types';

export function ChefsScreen({navigation}: TabProps<'Chefs'>) {
  const planQuery = useWeeklyPlan();
  const membersQuery = useMembers();
  const selectedDate = useAppStore(state => state.selectedDate);
  const setSelectedDate = useAppStore(state => state.setSelectedDate);
  const snapshot = useAppStore(state => state.snapshot);
  const canEdit = useAppStore(state => state.canEdit());
  const showToast = useAppStore(state => state.showToast);
  const planMutations = usePlanMutations();
  const householdMutations = useHouseholdMutations();

  const plan = planQuery.data ?? snapshot.plan;
  const members = membersQuery.data ?? snapshot.members;
  const dates = [...new Set(plan.slots.map(slot => slot.date))];
  const dinners = plan.slots.filter(slot => slot.mealType === 'dinner');
  const dinner = dinners.find(slot => slot.date === selectedDate);
  const tonightChef = members.find(member => member.id === dinner?.chefId);
  const weekNum = plan.weekId.split('-W')[1] ?? '';

  if (planQuery.isLoading && membersQuery.isLoading && !members.length) {
    return (
      <View style={styles.screen}>
        <ScreenHeader subtitle="Chefs" onProfile={() => navigation.navigate('HouseholdShare')} />
        <View style={styles.content} accessibilityState={{busy: true}}>
          <Shimmer height={110} radius={12} />
          <Shimmer height={72} radius={12} />
          <Shimmer height={160} radius={12} />
        </View>
      </View>
    );
  }

  if (membersQuery.isError) {
    return (
      <View style={styles.screen}>
        <ScreenHeader subtitle="Chefs" onProfile={() => navigation.navigate('HouseholdShare')} />
        <ErrorState onRetry={() => membersQuery.refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader subtitle="Chefs" onProfile={() => navigation.navigate('HouseholdShare')} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.rosterBanner}>
          <CookingPot size={130} color={colors.onPrimaryFixed} style={styles.watermark} />
          <View style={[styles.bannerTop, styles.wrap]}>
            <View style={styles.weekPill}>
              <AppText variant="labelSm" color={colors.primary} style={styles.weekCaps} numberOfLines={1}>
                Kitchen Roster • Week {weekNum}
              </AppText>
            </View>
          </View>
          <AppText variant="bodySm" color={colors.onPrimaryFixed} style={styles.rule}>
            Active House Rule:{' '}
            <AppText variant="labelMd" color={colors.onPrimaryFixed}>
              {snapshot.household.houseRule || 'Assign who cooks each day.'}
            </AppText>
          </AppText>
        </View>

        <View>
          <View style={[styles.rowBetween, styles.wrap]}>
            <AppText variant="headlineMd" numberOfLines={1} style={styles.flex}>
              Weekly Cooking Shift
            </AppText>
            <View style={styles.rangePill}>
              <AppText variant="labelSm" color={colors.tertiary} style={styles.rangeCopy}>
                {formatWeekRangeShort(plan.startDate, plan.endDate)}
              </AppText>
            </View>
          </View>
          <View style={styles.shiftWrap}>
            <ChefShiftSelector
              dates={dates}
              selected={selectedDate}
              onSelect={setSelectedDate}
              dinners={dinners}
              members={members}
            />
          </View>
        </View>

        <View style={styles.autoCard}>
          <View style={[styles.row, styles.flex, styles.nowrap]}>
            <View style={styles.autoIcon}>
              <ArrowsClockwise size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="labelMd" numberOfLines={1}>
                Auto-Rotation
              </AppText>
              <AppText variant="labelSm" color={colors.onSurfaceVariant} style={styles.autoHint} numberOfLines={2}>
                Swaps load automatically
              </AppText>
            </View>
          </View>
          <View style={[styles.row, styles.shrink, styles.wrap]}>
            <AppSwitch
              size="sm"
              value={snapshot.household.autoRotate}
              label="Auto-rotate chef assignments"
              disabled={!canEdit}
              onValueChange={value => {
                if (!canEdit) {
                  showToast('Only editors can change roster rules.', 'info');
                  return;
                }
                householdMutations.updateHousehold({autoRotate: value});
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Balance roster"
              onPress={() => (canEdit ? planMutations.balanceRoster() : showToast('Editors balance the roster.', 'info'))}
              style={styles.balance}>
              <Shuffle size={16} color={colors.onPrimary} />
              <AppText variant="labelSm" color={colors.onPrimary} numberOfLines={1}>
                Balance
              </AppText>
            </Pressable>
          </View>
        </View>

        <View style={[styles.rowBetween, styles.wrap]}>
          <AppText variant="headlineMd" numberOfLines={1} style={styles.flex}>
            Family Chef Profiles
          </AppText>
          <Pressable onPress={() => navigation.navigate('AddMember')} accessibilityRole="button" style={styles.addHelper}>
            <Plus size={18} color={colors.primary} />
            <AppText variant="labelMd" color={colors.primary} numberOfLines={1}>
              Add Helper
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
          members.map(member => {
            const nextDinner = dinners.find(slot => slot.chefId === member.id && slot.date >= selectedDate);
            const lastDinner = [...dinners].reverse().find(slot => slot.chefId === member.id);
            const badge =
              member.id === tonightChef?.id
                ? 'Next: Today'
                : nextDinner
                  ? `Next: ${weekdayName(nextDinner.date)}`
                  : member.helper
                    ? 'Helper Duty'
                    : lastDinner
                      ? `Cooked: ${weekdayName(lastDinner.date).slice(0, 3)}`
                      : 'Cooked';
            return (
              <Card key={member.id} radius="xl" style={styles.chefCard}>
                <View style={styles.chefTop}>
                  <View>
                    <Avatar member={member} size={64} />
                  </View>
                  <View style={styles.flex}>
                    <View style={[styles.rowBetween, styles.wrap]}>
                      <AppText variant="headlineMd" numberOfLines={1} style={styles.flex}>
                        {member.displayName}
                      </AppText>
                      <View style={[styles.nextPill, member.id === tonightChef?.id ? styles.nextToday : member.helper ? styles.nextHelper : styles.nextLater]}>
                        <AppText
                          variant="labelSm"
                          numberOfLines={1}
                          color={member.id === tonightChef?.id ? colors.onPrimaryFixed : member.helper ? colors.onSecondaryContainer : colors.onSurfaceVariant}>
                          {badge}
                        </AppText>
                      </View>
                    </View>
                    <AppText variant="labelMd" color={colors.onSurfaceVariant} style={styles.badgeCopy} numberOfLines={1}>
                      {member.specialty}
                    </AppText>
                  </View>
                </View>
                <View style={styles.footer}>
                  <Pressable
                    onPress={() =>
                      canEdit
                        ? planMutations.assignChef(selectedDate, member.id)
                        : showToast('Editors assign cooking days.', 'info')
                    }
                    style={styles.assign}>
                    <AppText variant="labelSm" color={colors.primary}>
                      Assign Dish
                    </AppText>
                    <CaretRight size={16} color={colors.primary} />
                  </Pressable>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.surface},
  content: {padding: spacing.margin, gap: spacing.md, paddingBottom: 120},
  rosterBanner: {
    backgroundColor: colors.primaryFixed,
    borderRadius: radii.md,
    padding: spacing.md,
    overflow: 'hidden',
  },
  watermark: {position: 'absolute', right: -16, bottom: -24, opacity: 0.15},
  bannerTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4},
  weekPill: {
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '86%',
    flexShrink: 1,
  },
  weekCaps: {textTransform: 'uppercase', letterSpacing: 0.6},
  tune: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rule: {marginTop: 4, lineHeight: 20},
  balanceRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8},
  liveDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.secondary},
  flex: {flex: 1, minWidth: 0},
  shrink: {flexShrink: 0},
  nowrap: {flexWrap: 'nowrap'},
  wrap: {flexWrap: 'wrap'},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0},
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minWidth: 0},
  rangePill: {backgroundColor: colors.tertiaryFixed, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999},
  rangeCopy: {fontFamily: 'PlusJakartaSans-Bold'},
  shiftWrap: {marginHorizontal: -spacing.margin, marginTop: 8},
  autoCard: {
    backgroundColor: colors.surfaceLow,
    borderRadius: radii.md,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  autoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoHint: {fontSize: 12, lineHeight: 16},
  balance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    borderRadius: radii.sm,
  },
  prepCopy: {marginBottom: 8, marginTop: 4},
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceLow,
    marginTop: 8,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: colors.surfaceHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {backgroundColor: colors.secondary},
  taskLabel: {flex: 1, minWidth: 0},
  addHelper: {flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, flexShrink: 0},
  strike: {textDecorationLine: 'line-through', color: colors.onSurfaceVariant},
  doneCopy: {fontFamily: 'PlusJakartaSans-Bold'},
  chefCard: {overflow: 'hidden', paddingBottom: 0},
  chefTop: {flexDirection: 'row', alignItems: 'flex-start', gap: 8},
  emojiBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextPill: {paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, flexShrink: 0, maxWidth: '100%'},
  nextToday: {backgroundColor: colors.primaryFixed},
  nextHelper: {backgroundColor: colors.secondaryContainer},
  nextLater: {backgroundColor: colors.surfaceHigh},
  badgeCopy: {fontFamily: 'PlusJakartaSans-Bold', marginTop: 2},
  metaPill: {backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, maxWidth: '100%'},
  metaBold: {fontFamily: 'PlusJakartaSans-SemiBold'},
  footer: {
    marginTop: 8,
    marginHorizontal: -spacing.md,
    backgroundColor: colors.surfaceLow,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  footerCopy: {fontSize: 13, flex: 1, minWidth: 0},
  assign: {flexDirection: 'row', alignItems: 'center', gap: 2, flexShrink: 0, minHeight: 36},
  cookoff: {
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  cookoffIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cookoffTitle: {fontFamily: 'PlusJakartaSans-Bold'},
  scheduleBtn: {
    backgroundColor: colors.surfaceLowest,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
    borderRadius: radii.sm,
    flexShrink: 0,
    justifyContent: 'center',
  },
});
