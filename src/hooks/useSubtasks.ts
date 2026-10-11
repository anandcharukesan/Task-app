import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/task.service';
import { queryKeys } from '../constants/queryKeys';
import { CreateSubtaskInput, UpdateSubtaskInput } from '../types/task';

export function useSubtasks(taskId?: string | null) {
  const queryClient = useQueryClient();

  const createSubtaskMutation = useMutation({
    mutationFn: (input: CreateSubtaskInput) => taskService.createSubtask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.subtasks(taskId) });
      }
    },
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubtaskInput }) =>
      taskService.updateSubtask(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.subtasks(taskId) });
      }
    },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteSubtask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.subtasks(taskId) });
      }
    },
  });

  return {
    createSubtask: createSubtaskMutation.mutateAsync,
    updateSubtask: updateSubtaskMutation.mutateAsync,
    deleteSubtask: deleteSubtaskMutation.mutateAsync,
    isCreating: createSubtaskMutation.isPending,
  };
}
