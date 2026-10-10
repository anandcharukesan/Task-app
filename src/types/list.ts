export interface TaskList {
  id: string;
  userId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskListInput {
  name: string;
  position?: number;
}

export interface UpdateTaskListInput {
  name?: string;
  position?: number;
}
