import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recurrenceService } from '../services/recurrence.service';
import { queryKeys } from '../constants/queryKeys';
import { RecurrenceRule } from '../types/recurrence';

export function useRecurrence(taskId?: string | null) {
  const queryClient = useQueryClient();

  const saveRecurrenceMutation = useMutation({
    mutationFn: ({ taskId, rule }: { taskId: string; rule: Omit<RecurrenceRule, 'taskId'> }) =>
      recurrenceService.saveRecurrence(taskId, rule),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurrence(data.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.task(data.taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });

  const deleteRecurrenceMutation = useMutation({
    mutationFn: (taskId: string) => recurrenceService.deleteRecurrence(taskId),
    onSuccess: () => {
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.recurrence(taskId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.task(taskId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });

  return {
    saveRecurrence: saveRecurrenceMutation.mutateAsync,
    deleteRecurrence: deleteRecurrenceMutation.mutateAsync,
    isSaving: saveRecurrenceMutation.isPending,
    isDeleting: deleteRecurrenceMutation.isPending,
  };
}
