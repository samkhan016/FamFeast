import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getISOWeek,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export function weekStart(date = new Date()): Date {
  return startOfWeek(date, {weekStartsOn: 1});
}

export function weekIdFor(date = new Date()): string {
  const start = weekStart(date);
  return `${start.getFullYear()}-W${String(getISOWeek(start)).padStart(2, '0')}`;
}

export function weekDates(date = new Date()): Date[] {
  const start = weekStart(date);
  return Array.from({length: 7}, (_, i) => addDays(start, i));
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromISODate(value: string): Date {
  return parseISO(value);
}

export function formatDayLabel(value: string): string {
  return format(parseISO(value), 'EEE');
}

export function formatDayNumber(value: string): string {
  return format(parseISO(value), 'd');
}

export function formatWeekRange(start: string, end: string): string {
  return `${format(parseISO(start), 'MMMM d')} - ${format(parseISO(end), 'd')}`;
}

export function formatWeekRangeShort(start: string, end: string): string {
  return `${format(parseISO(start), 'MMM d')} - ${format(parseISO(end), 'MMM d')}`;
}

export function isToday(value: string): boolean {
  return isSameDay(parseISO(value), new Date());
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDaysISO(value: string, days: number): string {
  return toISODate(addDays(parseISO(value), days));
}

export function weekdayName(value: string): string {
  return format(parseISO(value), 'EEEE');
}

export function monthDates(anchor: string): string[] {
  const date = parseISO(anchor);
  return eachDayOfInterval({start: startOfMonth(date), end: endOfMonth(date)}).map(toISODate);
}

export function weekDatesISO(anchor: string): string[] {
  return weekDates(parseISO(anchor)).map(toISODate);
}
