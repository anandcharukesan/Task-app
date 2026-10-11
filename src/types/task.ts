import { RecurrenceRule, TaskOccurrence } from './recurrence';

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  userId: string;
  listId: string;
  title: string;
  notes?: string | null;
  completed: boolean;
  position: number;
  dueDate?: string | null; // "YYYY-MM-DD"
  dueTime?: string | null; // "HH:mm"
  deadline?: string | null; // "YYYY-MM-DD"
  isRecurring: boolean;
  recurrenceId?: string | null;
  recurrence?: RecurrenceRule | null;
  subtasks?: Subtask[];
  occurrences?: TaskOccurrence[];
  isStarred?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  listId: string;
  title: string;
  notes?: string | null;
  dueDate?: string | null;
  dueTime?: string | null;
  deadline?: string | null;
  isRecurring?: boolean;
  recurrence?: Omit<RecurrenceRule, 'taskId'> | null;
  position?: number;
  isStarred?: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  completed?: boolean;
  position?: number;
  dueDate?: string | null;
  dueTime?: string | null;
  deadline?: string | null;
  listId?: string;
  isRecurring?: boolean;
  recurrenceId?: string | null;
  recurrence?: Omit<RecurrenceRule, 'taskId'> | null;
  isStarred?: boolean;
}

export interface CreateSubtaskInput {
  taskId: string;
  title: string;
  position?: number;
}

export interface UpdateSubtaskInput {
  title?: string;
  completed?: boolean;
  position?: number;
}
