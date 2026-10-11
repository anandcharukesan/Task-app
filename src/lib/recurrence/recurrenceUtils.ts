import { RecurrenceRule, WeekPosition } from '../../types/recurrence';
import { format, parseISO } from 'date-fns';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatRecurrenceRule(rule?: RecurrenceRule | null): string {
  if (!rule) return 'Does not repeat';

  const freq = (rule.frequency || 'day').toLowerCase();
  const interval = rule.interval || 1;
  const weekdays = rule.weekdays;
  const monthlyMode = rule.monthlyMode;
  const dayOfMonth = rule.dayOfMonth;
  const weekPosition = rule.weekPosition;
  const weekday = rule.weekday;
  const endType = rule.endType;
  const endDate = rule.endDate;
  const occurrenceLimit = rule.occurrenceLimit;
  const isSingular = interval === 1;

  let freqStr = '';
  switch (freq) {
    case 'minute':
      freqStr = isSingular ? 'minute' : `${interval} minutes`;
      break;
    case 'hour':
      freqStr = isSingular ? 'hour' : `${interval} hours`;
      break;
    case 'day':
    case 'daily':
      freqStr = isSingular ? 'day' : `${interval} days`;
      break;
    case 'week':
    case 'weekly':
      freqStr = isSingular ? 'week' : `${interval} weeks`;
      break;
    case 'month':
    case 'monthly':
      freqStr = isSingular ? 'month' : `${interval} months`;
      break;
    case 'year':
    case 'yearly':
    case 'annually':
      freqStr = isSingular ? 'year' : `${interval} years`;
      break;
    default:
      freqStr = `${interval} ${freq}`;
  }

  let base = isSingular && (freq === 'day' || freq === 'daily') ? 'Daily' :
             isSingular && (freq === 'week' || freq === 'weekly') && (!weekdays || weekdays.length <= 1) ? 'Weekly' :
             isSingular && (freq === 'month' || freq === 'monthly') ? 'Monthly' :
             isSingular && (freq === 'year' || freq === 'yearly' || freq === 'annually') ? 'Annually' :
             `Every ${freqStr}`;

  if ((freq === 'week' || freq === 'weekly') && weekdays && weekdays.length > 0) {
    const days = [...weekdays].sort().map((d) => WEEKDAY_SHORT[d]).join(', ');
    base = isSingular ? `Weekly on ${days}` : `Every ${interval} weeks on ${days}`;
  }

  if (freq === 'month' || freq === 'monthly') {
    if (monthlyMode === 'weekday_position' && weekPosition && weekday !== undefined) {
      base = `${base} on the ${weekPosition} ${WEEKDAY_NAMES[weekday]}`;
    } else if (dayOfMonth) {
      base = `${base} on day ${dayOfMonth}`;
    }
  }

  if (endType === 'on' && endDate) {
    try {
      base += `, until ${format(parseISO(endDate), 'MMM d, yyyy')}`;
    } catch {
      base += `, until ${endDate}`;
    }
  } else if (endType === 'after' && occurrenceLimit) {
    base += `, ${occurrenceLimit} times`;
  }

  return base;
}

export function getNthWeekdayOfMonth(year: number, monthIndex: number, weekday: number, position: WeekPosition): Date {
  const dates: Date[] = [];
  const date = new Date(year, monthIndex, 1);
  while (date.getMonth() === monthIndex) {
    if (date.getDay() === weekday) {
      dates.push(new Date(date));
    }
    date.setDate(date.getDate() + 1);
  }

  switch (position) {
    case 'first':
      return dates[0];
    case 'second':
      return dates[1] || dates[0];
    case 'third':
      return dates[2] || dates[dates.length - 1];
    case 'fourth':
      return dates[3] || dates[dates.length - 1];
    case 'last':
      return dates[dates.length - 1];
    default:
      return dates[0];
  }
}
