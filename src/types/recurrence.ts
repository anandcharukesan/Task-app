export type RecurrenceFrequency =
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year';

export type EndCondition = 'never' | 'on' | 'after';

export type MonthlyMode = 'day_of_month' | 'weekday_position';

export type WeekPosition = 'first' | 'second' | 'third' | 'fourth' | 'last';

export type TaskOccurrenceStatus = 'pending' | 'completed' | 'skipped';

export interface RecurrenceRule {
  id?: string;
  taskId: string;
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday (or standard ISO mapping)
  monthlyMode?: MonthlyMode;
  dayOfMonth?: number;
  weekPosition?: WeekPosition;
  weekday?: number; // 0..6
  time?: string; // "HH:mm"
  startDate: string; // "YYYY-MM-DD"
  endType: EndCondition;
  endDate?: string; // "YYYY-MM-DD"
  occurrenceLimit?: number;
  timezone: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskOccurrence {
  id: string;
  taskId: string;
  recurrenceId: string;
  occurrenceDate: string; // "YYYY-MM-DD"
  occurrenceTime?: string; // "HH:mm"
  status: TaskOccurrenceStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceFormData {
  frequency: RecurrenceFrequency;
  interval: number;
  weekdays: number[];
  monthlyMode: MonthlyMode;
  dayOfMonth?: number;
  weekPosition?: WeekPosition;
  weekday?: number;
  time?: string;
  startDate: string;
  endType: EndCondition;
  endDate?: string;
  occurrenceLimit?: number;
  timezone: string;
}
