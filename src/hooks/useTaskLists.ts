import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listService } from '../services/list.service';
import { isSupabaseConfigured } from '../services/supabase';
import { queryKeys } from '../constants/queryKeys';
import { CreateTaskListInput, UpdateTaskListInput } from '../types/list';

export function useTaskLists(userId: string) {
  const queryClient = useQueryClient();

  const listsQuery = useQuery({
    queryKey: queryKeys.taskLists(userId),
    queryFn: () => listService.getLists(userId),
    enabled: isSupabaseConfigured() ? Boolean(userId) : true,
    staleTime: 1000 * 60 * 5,
  });

  const createListMutation = useMutation({
    mutationFn: (input: CreateTaskListInput) => listService.createList(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-lists'] });
    },
  });

  const updateListMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskListInput }) =>
      listService.updateList(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-lists'] });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: (id: string) => listService.deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-lists'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return {
    lists: listsQuery.data || [],
    isLoading: listsQuery.isLoading,
    error: listsQuery.error,
    createList: createListMutation.mutateAsync,
    isCreating: createListMutation.isPending,
    updateList: updateListMutation.mutateAsync,
    isUpdating: updateListMutation.isPending,
    deleteList: deleteListMutation.mutateAsync,
    isDeleting: deleteListMutation.isPending,
  };
}
