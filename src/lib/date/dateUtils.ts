import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  startOfDay,
  addDays,
} from 'date-fns';

export function formatDueDate(dateString?: string | null, timeString?: string | null): string {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    let datePart = '';

    if (isToday(date)) {
      datePart = 'Today';
    } else if (isTomorrow(date)) {
      datePart = 'Tomorrow';
    } else if (isYesterday(date)) {
      datePart = 'Yesterday';
    } else {
      const now = new Date();
      if (date.getFullYear() === now.getFullYear()) {
        datePart = format(date, 'EEE, MMM d');
      } else {
        datePart = format(date, 'MMM d, yyyy');
      }
    }

    if (timeString) {
      const [hours, minutes] = timeString.split(':');
      if (hours && minutes) {
        const timeDate = new Date();
        timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        const formattedTime = format(timeDate, 'h:mm a');
        return `${datePart}, ${formattedTime}`;
      }
    }

    return datePart;
  } catch {
    return dateString;
  }
}

export function isOverdue(dateString?: string | null, timeString?: string | null): boolean {
  if (!dateString) return false;
  try {
    const today = startOfDay(new Date());
    const date = startOfDay(parseISO(dateString));
    if (date < today) return true;
    if (date.getTime() === today.getTime() && timeString) {
      const [h, m] = timeString.split(':').map(Number);
      const now = new Date();
      const dueTimeDate = new Date();
      dueTimeDate.setHours(h, m, 0, 0);
      return now > dueTimeDate;
    }
    return false;
  } catch {
    return false;
  }
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getTomorrowDateString(): string {
  return format(addDays(new Date(), 1), 'yyyy-MM-dd');
}
