import { RecurrenceRule } from '../../types/recurrence';
import { parseISO, isBefore } from 'date-fns';

export interface RecurrenceValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRecurrence(rule: Partial<RecurrenceRule>): RecurrenceValidationResult {
  const errors: string[] = [];

  if (!rule.frequency) {
    errors.push('Frequency is required.');
  }

  if (!rule.interval || rule.interval < 1) {
    errors.push('Interval must be at least 1.');
  }

  if (!rule.startDate) {
    errors.push('Start date is required.');
  }

  if (rule.frequency === 'week') {
    if (!rule.weekdays || rule.weekdays.length === 0) {
      errors.push('At least one weekday must be selected for weekly recurrence.');
    }
  }

  if (rule.endType === 'on') {
    if (!rule.endDate) {
      errors.push('End date is required when end condition is "on".');
    } else if (rule.startDate) {
      const start = parseISO(rule.startDate);
      const end = parseISO(rule.endDate);
      if (isBefore(end, start)) {
        errors.push('End date cannot be earlier than start date.');
      }
    }
  }

  if (rule.endType === 'after') {
    if (!rule.occurrenceLimit || rule.occurrenceLimit < 1) {
      errors.push('Occurrence limit must be at least 1 when end condition is "after".');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
