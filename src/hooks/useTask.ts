import { useQuery } from '@tanstack/react-query';
import { taskService } from '../services/task.service';
import { recurrenceService } from '../services/recurrence.service';
import { occurrenceService } from '../services/occurrence.service';
import { queryKeys } from '../constants/queryKeys';

export function useTask(taskId?: string | null) {
  const taskQuery = useQuery({
    queryKey: queryKeys.task(taskId || ''),
    queryFn: () => (taskId ? taskService.getTask(taskId) : null),
    enabled: Boolean(taskId),
  });

  const subtasksQuery = useQuery({
    queryKey: queryKeys.subtasks(taskId || ''),
    queryFn: () => (taskId ? taskService.getSubtasks(taskId) : []),
    enabled: Boolean(taskId),
  });

  const recurrenceQuery = useQuery({
    queryKey: queryKeys.recurrence(taskId || ''),
    queryFn: () => (taskId ? recurrenceService.getRecurrence(taskId) : null),
    enabled: Boolean(taskId),
  });

  const occurrencesQuery = useQuery({
    queryKey: queryKeys.occurrences(taskId || ''),
    queryFn: () => (taskId ? occurrenceService.getOccurrences(taskId) : []),
    enabled: Boolean(taskId),
  });

  return {
    task: taskQuery.data,
    subtasks: subtasksQuery.data || [],
    recurrence: recurrenceQuery.data,
    occurrences: occurrencesQuery.data || [],
    isLoading: taskQuery.isLoading,
  };
}
