import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/task.service';
import { isSupabaseConfigured } from '../services/supabase';
import { queryKeys } from '../constants/queryKeys';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';

export function useTasks(userId: string, listId?: string) {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks(userId, listId),
    queryFn: () => taskService.getTasks(userId, listId),
    enabled: isSupabaseConfigured() ? Boolean(userId) : true,
    staleTime: 1000 * 30,
  });

  const createTaskMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.createTask(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      taskService.updateTask(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(userId, listId));
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          queryKeys.tasks(userId, listId),
          previousTasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...input,
                  isRecurring:
                    input.isRecurring !== undefined
                      ? input.isRecurring
                      : input.recurrence === null
                      ? false
                      : Boolean(input.recurrence ?? t.isRecurring),
                  recurrence:
                    input.recurrence === null
                      ? null
                      : input.recurrence
                      ? (input.recurrence as any)
                      : input.isRecurring === false
                      ? null
                      : t.recurrence,
                  recurrenceId:
                    input.isRecurring === false || input.recurrence === null
                      ? null
                      : t.recurrenceId,
                }
              : t
          )
        );
      }
      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks(userId, listId), context.previousTasks);
      }
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.task(updatedTask.id) });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Optimistic completion mutation
  const completeTaskMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      taskService.completeTask(id, completed),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks(userId, listId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.task(id) });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(userId, listId));
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          queryKeys.tasks(userId, listId),
          previousTasks.map((t) => (t.id === id ? { ...t, completed } : t))
        );
      }

      const previousSingleTask = queryClient.getQueryData<Task>(queryKeys.task(id));
      if (previousSingleTask) {
        queryClient.setQueryData<Task>(queryKeys.task(id), {
          ...previousSingleTask,
          completed,
        });
      }

      return { previousTasks, previousSingleTask };
    },
    onError: (_err, vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks(userId, listId), context.previousTasks);
      }
      if (context?.previousSingleTask) {
        queryClient.setQueryData(queryKeys.task(vars.id), context.previousSingleTask);
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (vars?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.task(vars.id) });
      }
    },
  });

  const skipOccurrenceMutation = useMutation({
    mutationFn: (id: string) => taskService.skipOccurrence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: ({ id, isStarred }: { id: string; isStarred: boolean }) =>
      taskService.toggleStar(id, isStarred),
    onMutate: async ({ id, isStarred }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks(userId, listId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.task(id) });

      const previousTasks = queryClient.getQueryData<Task[]>(queryKeys.tasks(userId, listId));
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(
          queryKeys.tasks(userId, listId),
          previousTasks.map((t) => (t.id === id ? { ...t, isStarred } : t))
        );
      }

      const previousSingleTask = queryClient.getQueryData<Task>(queryKeys.task(id));
      if (previousSingleTask) {
        queryClient.setQueryData<Task>(queryKeys.task(id), {
          ...previousSingleTask,
          isStarred,
        });
      }

      return { previousTasks, previousSingleTask };
    },
    onError: (_err, vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks(userId, listId), context.previousTasks);
      }
      if (context?.previousSingleTask) {
        queryClient.setQueryData(queryKeys.task(vars.id), context.previousSingleTask);
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (vars?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.task(vars.id) });
      }
    },
  });

  const deleteCompletedMutation = useMutation({
    mutationFn: () => taskService.deleteCompletedTasks(userId, listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const reorderTasksMutation = useMutation({
    mutationFn: (reordered: { id: string; position: number }[]) =>
      taskService.reorderTasks(reordered),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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
    toggleStar: (id: string, isStarred: boolean) =>
      toggleStarMutation.mutateAsync({ id, isStarred }),
    deleteCompletedTasks: deleteCompletedMutation.mutateAsync,
    skipOccurrence: (id: string) => skipOccurrenceMutation.mutateAsync(id),
    reorderTasks: reorderTasksMutation.mutateAsync,
  };
}
