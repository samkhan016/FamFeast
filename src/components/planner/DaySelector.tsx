import {memo} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {colors, radii} from '../../theme/tokens';
import {AppText} from '../ui/AppText';
import {formatDayLabel, formatDayNumber, isToday} from '../../utils/dates';
import type {MealSlot, Member} from '../../domain/types';

const DOTS = [
  colors.secondary,
  colors.tertiary,
  colors.primary,
  colors.primary,
  colors.secondaryFixedDim,
  colors.surfaceDim,
  colors.surfaceDim,
];

type Props = {
  dates: string[];
  selected: string;
  onSelect: (date: string) => void;
};

function DaySelectorComponent({dates, selected, onSelect}: Props) {
  return (
    <View style={styles.grid}>
      {dates.map((date, index) => {
        const active = date === selected;
        const today = isToday(date);
        return (
          <Pressable
            key={date}
            accessibilityRole="button"
            accessibilityState={{selected: active}}
            accessibilityLabel={`${formatDayLabel(date)} ${formatDayNumber(date)}${today ? ', today' : ''}`}
            onPress={() => onSelect(date)}
            style={[styles.day, active && styles.active]}>
            <AppText
              variant="labelSm"
              color={active ? colors.primaryFixed : colors.onSurfaceVariant}
              style={styles.weekday}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}>
              {today ? 'TODAY' : formatDayLabel(date).charAt(0)}
            </AppText>
            <AppText
              variant="labelSm"
              color={active ? colors.onPrimary : colors.onSurface}
              style={styles.dateNum}
              numberOfLines={1}>
              {formatDayNumber(date)}
            </AppText>
            {today && active ? (
              <View style={styles.todayMark} />
            ) : (
              <View style={[styles.dot, {backgroundColor: DOTS[index % DOTS.length]}]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export const DaySelector = memo(DaySelectorComponent);

function MonthSelectorComponent({dates, selected, onSelect}: Props) {
  return (
    <View style={styles.month}>
      {dates.map(date => {
        const active = date === selected;
        const today = isToday(date);
        return (
          <Pressable
            key={date}
            accessibilityRole="button"
            accessibilityState={{selected: active}}
            onPress={() => onSelect(date)}
            style={[styles.monthDay, active && styles.active]}>
            <AppText
              variant="labelSm"
              color={active ? colors.onPrimary : colors.onSurface}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}>
              {formatDayNumber(date)}
            </AppText>
            {today ? <View style={[styles.todayMark, active && styles.todayOn]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export const MonthSelector = memo(MonthSelectorComponent);

type ShiftProps = Props & {
  dinners: MealSlot[];
  members: Member[];
};

function ChefShiftSelectorComponent({dates, selected, onSelect, dinners, members}: ShiftProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shiftRow}>
      {dates.map(date => {
        const active = date === selected;
        const today = isToday(date);
        const dinner = dinners.find(slot => slot.date === date);
        const chef = members.find(member => member.id === dinner?.chefId);
        return (
          <Pressable
            key={date}
            accessibilityRole="button"
            accessibilityState={{selected: active}}
            onPress={() => onSelect(date)}
            style={[styles.shift, active && styles.shiftActive]}>
            <AppText variant="labelSm" color={active ? colors.primaryFixed : colors.onSurfaceVariant} numberOfLines={1}>
              {today ? 'Today' : formatDayLabel(date)}
            </AppText>
            <AppText variant="headlineMd" color={active ? colors.onPrimary : colors.onSurface} style={styles.shiftNum}>
              {formatDayNumber(date)}
            </AppText>
            <View style={[styles.shiftAvatar, active && styles.shiftAvatarOn]}>
              <AppText variant="labelSm">{chef?.avatarInitial ?? ''}</AppText>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export const ChefShiftSelector = memo(ChefShiftSelectorComponent);

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: 4,
  },
  day: {
    flex: 1,
    minWidth: 0,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceLow,
  },
  active: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  weekday: {
    fontFamily: 'PlusJakartaSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  dateNum: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  todayMark: {
    marginTop: 6,
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.onPrimary,
  },
  month: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthDay: {
    width: '14.28%',
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingVertical: 4,
  },
  todayOn: {
    backgroundColor: colors.primaryFixed,
  },
  shiftRow: {
    gap: 10,
    paddingVertical: 4,
    paddingLeft: 20,
    paddingRight: 20,
  },
  shift: {
    width: 68,
    minHeight: 88,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceLowest,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  shiftActive: {
    backgroundColor: colors.primary,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  shiftNum: {
    marginVertical: 2,
  },
  shiftAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  shiftAvatarOn: {
    backgroundColor: colors.surfaceLowest,
  },
});
