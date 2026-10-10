import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/task.service';
import { queryKeys } from '../constants/queryKeys';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';

export function useTasks(userId: string, listId?: string) {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks(listId),
    queryFn: () => taskService.getTasks(userId, listId),
    staleTime: 1000 * 30,
  });

  const createTaskMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.createTask(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      taskService.updateTask(id, input),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.task(updatedTask.id) });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });

  // Optimistic completion mutation
  const completeTaskMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      taskService.completeTask(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks(listId) });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(listId));

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          queryKeys.tasks(listId),
          previousTasks.map((t) => (t.id === id ? { ...t, completed } : t))
        );
      }
      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks(listId), context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });

  const skipOccurrenceMutation = useMutation({
    mutationFn: (id: string) => taskService.skipOccurrence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks(listId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });

  return {
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    createTask: createTaskMutation.mutateAsync,
    isCreating: createTaskMutation.isPending,
    updateTask: updateTaskMutation.mutateAsync,
    isUpdating: updateTaskMutation.isPending,
    deleteTask: deleteTaskMutation.mutateAsync,
    isDeleting: deleteTaskMutation.isPending,
    toggleComplete: (id: string, completed: boolean) =>
      completeTaskMutation.mutateAsync({ id, completed }),
    isCompleting: completeTaskMutation.isPending,
    skipOccurrence: (id: string) => skipOccurrenceMutation.mutateAsync(id),
  };
}
