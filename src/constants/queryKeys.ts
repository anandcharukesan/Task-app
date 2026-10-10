export const queryKeys = {
  profile: ['profile'] as const,
  taskLists: ['task-lists'] as const,
  taskList: (id: string) => ['task-list', id] as const,
  tasks: (listId?: string) => (listId ? ['tasks', listId] as const : ['tasks'] as const),
  task: (id: string) => ['task', id] as const,
  subtasks: (taskId: string) => ['subtasks', taskId] as const,
  recurrence: (taskId: string) => ['recurrence', taskId] as const,
  occurrences: (taskId: string) => ['occurrences', taskId] as const,
};
