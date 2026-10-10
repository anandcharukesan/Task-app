import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listService } from '../services/list.service';
import { queryKeys } from '../constants/queryKeys';
import { CreateTaskListInput, UpdateTaskListInput } from '../types/list';

export function useTaskLists(userId: string) {
  const queryClient = useQueryClient();

  const listsQuery = useQuery({
    queryKey: queryKeys.taskLists,
    queryFn: () => listService.getLists(userId),
    staleTime: 1000 * 60 * 5,
  });

  const createListMutation = useMutation({
    mutationFn: (input: CreateTaskListInput) => listService.createList(userId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskLists });
    },
  });

  const updateListMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskListInput }) =>
      listService.updateList(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskLists });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: (id: string) => listService.deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.taskLists });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
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
