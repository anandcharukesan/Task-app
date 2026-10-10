import { RecurrenceRule, WeekPosition } from '../../types/recurrence';
import { format, parseISO } from 'date-fns';

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatRecurrenceRule(rule?: RecurrenceRule | null): string {
  if (!rule) return 'Does not repeat';

  const { frequency, interval, weekdays, monthlyMode, dayOfMonth, weekPosition, weekday, endType, endDate, occurrenceLimit } = rule;
  const isSingular = interval === 1;

  let freqStr = '';
  switch (frequency) {
    case 'minute':
      freqStr = isSingular ? 'minute' : `${interval} minutes`;
      break;
    case 'hour':
      freqStr = isSingular ? 'hour' : `${interval} hours`;
      break;
    case 'day':
      freqStr = isSingular ? 'day' : `${interval} days`;
      break;
    case 'week':
      freqStr = isSingular ? 'week' : `${interval} weeks`;
      break;
    case 'month':
      freqStr = isSingular ? 'month' : `${interval} months`;
      break;
    case 'year':
      freqStr = isSingular ? 'year' : `${interval} years`;
      break;
  }

  let base = isSingular && frequency === 'day' ? 'Daily' :
             isSingular && frequency === 'week' && (!weekdays || weekdays.length === 1) ? 'Weekly' :
             isSingular && frequency === 'month' ? 'Monthly' :
             isSingular && frequency === 'year' ? 'Annually' :
             `Every ${freqStr}`;

  if (frequency === 'week' && weekdays && weekdays.length > 0) {
    const days = [...weekdays].sort().map((d) => WEEKDAY_SHORT[d]).join(', ');
    base = isSingular ? `Weekly on ${days}` : `Every ${interval} weeks on ${days}`;
  }

  if (frequency === 'month') {
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
