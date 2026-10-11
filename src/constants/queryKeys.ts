export const queryKeys = {
  profile: ['profile'] as const,
  taskLists: (userId?: string) => (userId ? (['task-lists', userId] as const) : (['task-lists'] as const)),
  taskList: (id: string) => ['task-list', id] as const,
  tasks: (userId?: string, listId?: string) =>
    ['tasks', userId || '', listId || ''] as const,
  task: (id: string) => ['task', id] as const,
  subtasks: (taskId: string) => ['subtasks', taskId] as const,
  recurrence: (taskId: string) => ['recurrence', taskId] as const,
  occurrences: (taskId: string) => ['occurrences', taskId] as const,
};
