import { RecurrenceRule } from '../../types/recurrence';
import { getNthWeekdayOfMonth } from './recurrenceUtils';
import { validateRecurrence } from './recurrenceValidation';
import {
  parseISO,
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  startOfDay,
  lastDayOfMonth,
  setDate,
} from 'date-fns';

export { validateRecurrence };

function normalizeToDate(input: string | Date): Date {
  if (typeof input === 'string') {
    return parseISO(input);
  }
  return new Date(input);
}

function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Checks if a recurrence series has ended based on end conditions.
 */
export function isRecurrenceEnded(
  rule: RecurrenceRule,
  completedOccurrencesCount: number,
  targetDateStr?: string
): boolean {
  if (rule.endType === 'never') {
    return false;
  }

  if (rule.endType === 'after') {
    const limit = rule.occurrenceLimit ?? 1;
    return completedOccurrencesCount >= limit;
  }

  if (rule.endType === 'on' && rule.endDate) {
    if (!targetDateStr) return false;
    const target = startOfDay(normalizeToDate(targetDateStr));
    const end = startOfDay(normalizeToDate(rule.endDate));
    return isAfter(target, end);
  }

  return false;
}

/**
 * Calculates the next occurrence date after the provided reference date.
 */
export function getNextOccurrence(
  rule: RecurrenceRule,
  afterDateInput: string | Date
): string | null {
  const afterDate = startOfDay(normalizeToDate(afterDateInput));
  const startDate = startOfDay(normalizeToDate(rule.startDate));
  const interval = Math.max(1, rule.interval || 1);

  // If afterDate is before the start date, the first occurrence is >= start date
  let candidate: Date | null = null;

  switch (rule.frequency) {
    case 'day':
    case 'minute':
    case 'hour': {
      // For day level (and minute/hour when stepping daily)
      if (isBefore(afterDate, startDate)) {
        candidate = startDate;
      } else {
        candidate = addDays(afterDate, interval);
      }
      break;
    }

    case 'week': {
      const weekdays = rule.weekdays && rule.weekdays.length > 0 ? [...rule.weekdays].sort((a, b) => a - b) : [startDate.getDay()];
      
      let searchDate = isBefore(afterDate, startDate) ? startDate : addDays(afterDate, 1);
      let found = false;
      let safetyCounter = 0;

      while (!found && safetyCounter < 1000) {
        safetyCounter++;
        const currentWeekday = searchDate.getDay();
        if (weekdays.includes(currentWeekday)) {
          // Verify week interval from start week if interval > 1
          if (interval === 1) {
            candidate = searchDate;
            found = true;
          } else {
            const diffTime = searchDate.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            const diffWeeks = Math.floor(diffDays / 7);
            if (diffWeeks % interval === 0) {
              candidate = searchDate;
              found = true;
            } else {
              searchDate = addDays(searchDate, 1);
            }
          }
        } else {
          searchDate = addDays(searchDate, 1);
        }
      }
      break;
    }

    case 'month': {
      let baseMonthDate = isBefore(afterDate, startDate) ? startDate : afterDate;
      let targetMonthDate = isBefore(afterDate, startDate) ? startDate : addMonths(baseMonthDate, interval);

      if (rule.monthlyMode === 'weekday_position' && rule.weekPosition && rule.weekday !== undefined) {
        let calcDate = getNthWeekdayOfMonth(
          targetMonthDate.getFullYear(),
          targetMonthDate.getMonth(),
          rule.weekday,
          rule.weekPosition
        );

        if (isBefore(calcDate, afterDate) || calcDate.getTime() === afterDate.getTime()) {
          targetMonthDate = addMonths(targetMonthDate, interval);
          calcDate = getNthWeekdayOfMonth(
            targetMonthDate.getFullYear(),
            targetMonthDate.getMonth(),
            rule.weekday,
            rule.weekPosition
          );
        }
        candidate = calcDate;
      } else {
        // Mode: day_of_month
        const targetDay = rule.dayOfMonth || startDate.getDate();
        const maxDaysInTargetMonth = lastDayOfMonth(targetMonthDate).getDate();
        const clampedDay = Math.min(targetDay, maxDaysInTargetMonth);
        let calcDate = setDate(targetMonthDate, clampedDay);

        if (isBefore(calcDate, afterDate) || calcDate.getTime() === afterDate.getTime()) {
          targetMonthDate = addMonths(targetMonthDate, interval);
          const maxNext = lastDayOfMonth(targetMonthDate).getDate();
          calcDate = setDate(targetMonthDate, Math.min(targetDay, maxNext));
        }
        candidate = calcDate;
      }
      break;
    }

    case 'year': {
      let baseYearDate = isBefore(afterDate, startDate) ? startDate : afterDate;
      let targetYear = isBefore(afterDate, startDate) ? startDate.getFullYear() : baseYearDate.getFullYear() + interval;
      
      const targetMonth = startDate.getMonth();
      const targetDay = startDate.getDate();

      // Handle leap year (Feb 29 -> Feb 28 on non-leap year)
      const isFeb29 = targetMonth === 1 && targetDay === 29;
      const daysInFeb = lastDayOfMonth(new Date(targetYear, 1, 1)).getDate();
      const clampedDay = isFeb29 ? Math.min(29, daysInFeb) : targetDay;

      const calcDate = new Date(targetYear, targetMonth, clampedDay);
      candidate = calcDate;
      break;
    }

    default:
      candidate = addDays(afterDate, 1);
  }

  if (!candidate) return null;

  const candidateStr = formatDateString(candidate);

  // Check end condition 'on'
  if (rule.endType === 'on' && rule.endDate) {
    const end = startOfDay(normalizeToDate(rule.endDate));
    if (isAfter(candidate, end)) {
      return null;
    }
  }

  return candidateStr;
}

/**
 * Calculates previous occurrence.
 */
export function getPreviousOccurrence(
  rule: RecurrenceRule,
  beforeDateInput: string | Date
): string | null {
  const beforeDate = startOfDay(normalizeToDate(beforeDateInput));
  const startDate = startOfDay(normalizeToDate(rule.startDate));

  if (!isAfter(beforeDate, startDate)) {
    return null;
  }

  // Iterate forward from startDate to find the occurrence right before beforeDate
  let current: string | null = formatDateString(startDate);
  let previous: string | null = null;
  let safetyCounter = 0;

  while (current && safetyCounter < 500) {
    safetyCounter++;
    const currDate = startOfDay(normalizeToDate(current));
    if (currDate.getTime() >= beforeDate.getTime()) {
      break;
    }
    previous = current;
    current = getNextOccurrence(rule, currDate);
  }

  return previous;
}

/**
 * Returns an array of occurrence date strings between two dates.
 */
export function getOccurrencesBetween(
  rule: RecurrenceRule,
  startRangeInput: string | Date,
  endRangeInput: string | Date,
  maxCount: number = 60
): string[] {
  const startRange = startOfDay(normalizeToDate(startRangeInput));
  const endRange = startOfDay(normalizeToDate(endRangeInput));
  const occurrences: string[] = [];

  let current = rule.startDate;
  let currDate = startOfDay(normalizeToDate(current));
  let count = 0;

  // If start is after rule start, advance
  let safetyCounter = 0;
  while (current && isBefore(currDate, startRange) && safetyCounter < 1000) {
    safetyCounter++;
    count++;
    if (rule.endType === 'after' && rule.occurrenceLimit && count >= rule.occurrenceLimit) {
      return occurrences;
    }
    current = getNextOccurrence(rule, currDate) || '';
    if (!current) break;
    currDate = startOfDay(normalizeToDate(current));
  }

  safetyCounter = 0;
  while (current && !isAfter(currDate, endRange) && occurrences.length < maxCount && safetyCounter < 1000) {
    safetyCounter++;
    count++;
    if (rule.endType === 'after' && rule.occurrenceLimit && count > rule.occurrenceLimit) {
      break;
    }
    if (!isBefore(currDate, startRange)) {
      occurrences.push(current);
    }
    current = getNextOccurrence(rule, currDate) || '';
    if (!current) break;
    currDate = startOfDay(normalizeToDate(current));
  }

  return occurrences;
}

/**
 * Calculates ordinal occurrence number (1-indexed) of a given date.
 */
export function getOccurrenceNumber(rule: RecurrenceRule, targetDateStr: string): number {
  const targetDate = startOfDay(normalizeToDate(targetDateStr));
  let current: string | null = rule.startDate;
  let index = 1;

  while (current) {
    const currDate = startOfDay(normalizeToDate(current));
    if (currDate.getTime() === targetDate.getTime()) {
      return index;
    }
    if (isAfter(currDate, targetDate)) {
      return -1;
    }
    current = getNextOccurrence(rule, currDate);
    index++;
    if (index > 1000) break;
  }

  return -1;
}
