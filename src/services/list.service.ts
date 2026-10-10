import { supabase, isSupabaseConfigured } from './supabase';
import { TaskList, CreateTaskListInput, UpdateTaskListInput } from '../types/list';

const STORAGE_LISTS_KEY = 'cleartasks_task_lists_v1';

const INITIAL_DEFAULT_LIST: TaskList[] = [
  {
    id: 'list-1',
    userId: 'default',
    name: 'My Tasks',
    position: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function getLocalLists(): TaskList[] {
  try {
    const raw = localStorage.getItem(STORAGE_LISTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_LISTS_KEY, JSON.stringify(INITIAL_DEFAULT_LIST));
      return INITIAL_DEFAULT_LIST;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEFAULT_LIST;
  }
}

function saveLocalLists(lists: TaskList[]): void {
  try {
    localStorage.setItem(STORAGE_LISTS_KEY, JSON.stringify(lists));
  } catch {
    // ignore
  }
}

export const listService = {
  async getLists(userId: string): Promise<TaskList[]> {
    if (isSupabaseConfigured() && supabase) {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('task_lists')
        .select('id, user_id, name, position, created_at, updated_at')
        .eq('user_id', userId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase getLists error:', error);
        return [];
      }

      const lists: TaskList[] = (data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        position: row.position,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      // Automatically create a default "My Tasks" list for newly logged in users
      if (lists.length === 0 && userId) {
        try {
          const defaultList = await listService.createList(userId, { name: 'My Tasks' });
          return [defaultList];
        } catch {
          // ignore
        }
      }

      return lists;
    }

    return getLocalLists();
  },

  async createList(userId: string, input: CreateTaskListInput): Promise<TaskList> {
    if (isSupabaseConfigured() && supabase) {
      let activeUserId = userId;
      if (!activeUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeUserId = sessionData.session?.user?.id || '';
      }

      if (!activeUserId) {
        throw new Error('Please sign in to create and sync lists.');
      }

      const { data, error } = await supabase
        .from('task_lists')
        .insert({
          user_id: activeUserId,
          name: input.name,
          position: input.position ?? 0,
        })
        .select('id, user_id, name, position, created_at, updated_at')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        position: data.position,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const lists = getLocalLists();
    const newList: TaskList = {
      id: `list-${Date.now()}`,
      userId,
      name: input.name,
      position: input.position ?? lists.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    lists.push(newList);
    saveLocalLists(lists);
    return newList;
  },

  async updateList(id: string, input: UpdateTaskListInput): Promise<TaskList> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('task_lists')
        .update({
          ...(input.name !== undefined && { name: input.name }),
          ...(input.position !== undefined && { position: input.position }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, user_id, name, position, created_at, updated_at')
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        position: data.position,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const lists = getLocalLists();
    const index = lists.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('List not found');

    const updated: TaskList = {
      ...lists[index],
      ...(input.name !== undefined && { name: input.name }),
      ...(input.position !== undefined && { position: input.position }),
      updatedAt: new Date().toISOString(),
    };
    lists[index] = updated;
    saveLocalLists(lists);
    return updated;
  },

  async deleteList(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('task_lists').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    const lists = getLocalLists();
    const filtered = lists.filter((l) => l.id !== id);
    saveLocalLists(filtered);
  },
};
