/**
 * Comprehensive Recurrence Engine Test Suite
 * Validates day, week, month, year, leap-year, end conditions, and occurrence counting.
 */
import {
  getNextOccurrence,
  getPreviousOccurrence,
  getOccurrencesBetween,
  isRecurrenceEnded,
  getOccurrenceNumber,
  validateRecurrence,
} from '../recurrenceEngine';
import { RecurrenceRule } from '../../../types/recurrence';

export function runRecurrenceEngineTests(): { passed: number; failed: number; errors: string[] } {
  const errors: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(message);
      console.error(`❌ Recurrence Test Failed: ${message}`);
    }
  }

  // Test 1: Every 1 day
  {
    const rule: RecurrenceRule = {
      taskId: 'test-1',
      frequency: 'day',
      interval: 1,
      startDate: '2026-10-10',
      endType: 'never',
      timezone: 'UTC',
    };
    const next = getNextOccurrence(rule, '2026-10-10');
    assert(next === '2026-10-11', `Every 1 day: expected 2026-10-11, got ${next}`);
  }

  // Test 2: Every 2 days
  {
    const rule: RecurrenceRule = {
      taskId: 'test-2',
      frequency: 'day',
      interval: 2,
      startDate: '2026-10-10',
      endType: 'never',
      timezone: 'UTC',
    };
    const next = getNextOccurrence(rule, '2026-10-10');
    assert(next === '2026-10-12', `Every 2 days: expected 2026-10-12, got ${next}`);
  }

  // Test 3: Every week (single weekday, e.g. Friday: 5)
  {
    const rule: RecurrenceRule = {
      taskId: 'test-3',
      frequency: 'week',
      interval: 1,
      weekdays: [5], // Friday
      startDate: '2026-10-09', // Friday Oct 9, 2026
      endType: 'never',
      timezone: 'UTC',
    };
    const next = getNextOccurrence(rule, '2026-10-09');
    assert(next === '2026-10-16', `Every week on Friday: expected 2026-10-16, got ${next}`);
  }

  // Test 4: Every 2 weeks on Friday
  {
    const rule: RecurrenceRule = {
      taskId: 'test-4',
      frequency: 'week',
      interval: 2,
      weekdays: [5],
      startDate: '2026-10-09',
      endType: 'never',
      timezone: 'UTC',
    };
    const next = getNextOccurrence(rule, '2026-10-09');
    assert(next === '2026-10-23', `Every 2 weeks on Friday: expected 2026-10-23, got ${next}`);
  }

  // Test 5: Multiple weekdays (Monday = 1, Wednesday = 3, Friday = 5)
  {
    const rule: RecurrenceRule = {
      taskId: 'test-5',
      frequency: 'week',
      interval: 1,
      weekdays: [1, 3, 5],
      startDate: '2026-10-12', // Monday
      endType: 'never',
      timezone: 'UTC',
    };
    const nextAfterMon = getNextOccurrence(rule, '2026-10-12');
    assert(nextAfterMon === '2026-10-14', `Multiple weekdays (Mon->Wed): expected 2026-10-14, got ${nextAfterMon}`);

    const nextAfterWed = getNextOccurrence(rule, '2026-10-14');
    assert(nextAfterWed === '2026-10-16', `Multiple weekdays (Wed->Fri): expected 2026-10-16, got ${nextAfterWed}`);

    const nextAfterFri = getNextOccurrence(rule, '2026-10-16');
    assert(nextAfterFri === '2026-10-19', `Multiple weekdays (Fri->next Mon): expected 2026-10-19, got ${nextAfterFri}`);
  }

  // Test 6: Every month on day of month (e.g. 15th)
  {
    const rule: RecurrenceRule = {
      taskId: 'test-6',
      frequency: 'month',
      interval: 1,
      monthlyMode: 'day_of_month',
      dayOfMonth: 15,
      startDate: '2026-10-15',
      endType: 'never',
      timezone: 'UTC',
    };
    const next = getNextOccurrence(rule, '2026-10-15');
    assert(next === '2026-11-15', `Every month: expected 2026-11-15, got ${next}`);
  }

  // Test 7: Every 3 months
  {
    const rule: RecurrenceRule = {
      taskId: 'test-7',
      frequency: 'month',
      interval: 3,
      monthlyMode: 'day_of_month',
      dayOfMonth: 15,
      startDate: '2026-10-15',
      endType: 'never',
      timezone: 'UTC',
    };
    const next = getNextOccurrence(rule, '2026-10-15');
    assert(next === '2027-01-15', `Every 3 months: expected 2027-01-15, got ${next}`);
  }

  // Test 8: Month-end clamping (Jan 31 -> Feb 28)
  {
    const rule: RecurrenceRule = {
      taskId: 'test-8',
      frequency: 'month',
      interval: 1,
      monthlyMode: 'day_of_month',
      dayOfMonth: 31,
      startDate: '2026-01-31',
      endType: 'never',
      timezone: 'UTC',
    };
    const next = getNextOccurrence(rule, '2026-01-31');
    assert(next === '2026-02-28', `Month end clamping Jan 31 -> Feb 28: expected 2026-02-28, got ${next}`);
  }

  // Test 9: Every year & Leap year handling (Feb 29, 2028 -> Feb 28, 2029)
  {
    const rule: RecurrenceRule = {
      taskId: 'test-9',
      frequency: 'year',
      interval: 1,
      startDate: '2028-02-29', // 2028 is leap year
      endType: 'never',
      timezone: 'UTC',
    };
    const next = getNextOccurrence(rule, '2028-02-29');
    assert(next === '2029-02-28', `Yearly recurrence Feb 29 to non-leap: expected 2029-02-28, got ${next}`);
  }

  // Test 10: End condition 'on' date
  {
    const rule: RecurrenceRule = {
      taskId: 'test-10',
      frequency: 'day',
      interval: 1,
      startDate: '2026-10-10',
      endType: 'on',
      endDate: '2026-10-12',
      timezone: 'UTC',
    };
    const occ1 = getNextOccurrence(rule, '2026-10-10'); // 2026-10-11
    assert(occ1 === '2026-10-11', `End condition on: occ1 expected 2026-10-11, got ${occ1}`);

    const occ2 = getNextOccurrence(rule, '2026-10-11'); // 2026-10-12
    assert(occ2 === '2026-10-12', `End condition on: occ2 expected 2026-10-12, got ${occ2}`);

    const occ3 = getNextOccurrence(rule, '2026-10-12'); // past endDate
    assert(occ3 === null, `End condition on: occ3 expected null past endDate, got ${occ3}`);
  }

  // Test 11: End condition 'after' occurrences
  {
    const rule: RecurrenceRule = {
      taskId: 'test-11',
      frequency: 'day',
      interval: 1,
      startDate: '2026-10-10',
      endType: 'after',
      occurrenceLimit: 3,
      timezone: 'UTC',
    };
    assert(!isRecurrenceEnded(rule, 1), 'After 3: completed 1 should not end');
    assert(!isRecurrenceEnded(rule, 2), 'After 3: completed 2 should not end');
    assert(isRecurrenceEnded(rule, 3), 'After 3: completed 3 should end');
  }

  // Test 12: getOccurrencesBetween
  {
    const rule: RecurrenceRule = {
      taskId: 'test-12',
      frequency: 'day',
      interval: 1,
      startDate: '2026-10-01',
      endType: 'never',
      timezone: 'UTC',
    };
    const list = getOccurrencesBetween(rule, '2026-10-01', '2026-10-05');
    assert(list.length === 5, `Occurrences between: expected 5 days, got ${list.length}`);
  }

  // Test 13: Recurrence validation
  {
    const valid = validateRecurrence({
      frequency: 'week',
      interval: 1,
      startDate: '2026-10-10',
      weekdays: [1],
      endType: 'never',
    });
    assert(valid.valid, 'Validation should pass for valid weekly rule');

    const invalid = validateRecurrence({
      frequency: 'week',
      interval: 0,
      startDate: '',
      weekdays: [],
      endType: 'on',
    });
    assert(!invalid.valid && invalid.errors.length > 0, 'Validation should fail for invalid rule');
  }

  return { passed, failed, errors };
}
