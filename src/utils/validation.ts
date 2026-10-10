import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(500, 'Title too long'),
  notes: z.string().max(4000, 'Notes too long').optional().nullable(),
  dueDate: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  listId: z.string().min(1, 'List ID is required'),
});

export const listSchema = z.object({
  name: z.string().min(1, 'List name cannot be empty').max(100, 'List name too long'),
});

export const recurrenceFormSchema = z.object({
  frequency: z.enum(['minute', 'hour', 'day', 'week', 'month', 'year']),
  interval: z.number().min(1, 'Interval must be at least 1').max(999),
  weekdays: z.array(z.number()).default([]),
  monthlyMode: z.enum(['day_of_month', 'weekday_position']).default('day_of_month'),
  dayOfMonth: z.number().min(1).max(31).optional(),
  weekPosition: z.enum(['first', 'second', 'third', 'fourth', 'last']).optional(),
  weekday: z.number().min(0).max(6).optional(),
  time: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endType: z.enum(['never', 'on', 'after']),
  endDate: z.string().optional(),
  occurrenceLimit: z.number().min(1).optional(),
  timezone: z.string().default('UTC'),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
export type ListFormValues = z.infer<typeof listSchema>;
export type RecurrenceFormValues = z.infer<typeof recurrenceFormSchema>;
