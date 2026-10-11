import { supabase, isSupabaseConfigured } from './supabase';
import { Task, CreateTaskInput, UpdateTaskInput, Subtask, CreateSubtaskInput, UpdateSubtaskInput } from '../types/task';
import { RecurrenceRule, TaskOccurrence } from '../types/recurrence';
import { getNextOccurrence, isRecurrenceEnded } from '../lib/recurrence/recurrenceEngine';
import { getTodayDateString, getTomorrowDateString } from '../lib/date/dateUtils';
import { addDays, format } from 'date-fns';

const STORAGE_TASKS_KEY = 'cleartasks_tasks_v1';
const STORAGE_SUBTASKS_KEY = 'cleartasks_subtasks_v1';
const STORAGE_RECURRENCES_KEY = 'cleartasks_recurrences_v1';
const STORAGE_OCCURRENCES_KEY = 'cleartasks_occurrences_v1';

const INITIAL_DEMO_TASKS: Task[] = [];
const INITIAL_DEMO_SUBTASKS: Subtask[] = [];
const INITIAL_DEMO_RECURRENCES: RecurrenceRule[] = [];

const STORAGE_STARRED_KEY = 'cleartasks_starred_tasks_v1';
const STORAGE_DEADLINES_KEY = 'cleartasks_deadlines_v1';

function getDeadlineMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_DEADLINES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setDeadlineMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_DEADLINES_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function getStarredMap(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_STARRED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStarredMap(map: Record<string, boolean>): void {
  try {
    localStorage.setItem(STORAGE_STARRED_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

function getStored<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return initial;
  }
}

function setStored<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export const taskService = {
  async getTasks(userId: string, listId?: string): Promise<Task[]> {
    if (!userId) return [];

    const isStarredList = listId === 'starred';
    const starredMap = getStarredMap();
    const deadlineMap = getDeadlineMap();

    if (isSupabaseConfigured() && supabase) {
      let query = supabase
        .from('tasks')
        .select(`
          id, user_id, list_id, title, notes, completed, position,
          due_date, due_time, is_recurring, recurrence_id, created_at, updated_at
        `)
        .eq('user_id', userId);

      if (listId && !isStarredList) {
        query = query.eq('list_id', listId);
      }

      const { data, error } = await query
        .order('completed', { ascending: true })
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tasks: Task[] = (data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        listId: row.list_id,
        title: row.title,
        notes: row.notes,
        completed: row.completed,
        position: row.position,
        dueDate: row.due_date,
        dueTime: row.due_time,
        isRecurring: row.is_recurring,
        recurrenceId: row.recurrence_id,
        isStarred: Boolean(starredMap[row.id]),
        deadline: deadlineMap[row.id] || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      if (isStarredList) {
        return tasks.filter((t) => t.isStarred);
      }

      return tasks;
    }

    const tasks = getStored<Task[]>(STORAGE_TASKS_KEY, INITIAL_DEMO_TASKS).map((t) => ({
      ...t,
      isStarred: Boolean(starredMap[t.id] ?? t.isStarred),
      deadline: deadlineMap[t.id] || t.deadline || null,
    }));

    if (isStarredList) {
      return tasks.filter((t) => t.isStarred);
    }

    if (listId) {
      return tasks.filter((t) => t.listId === listId);
    }
    return tasks;
  },

  async toggleStar(id: string, isStarred: boolean): Promise<void> {
    const map = getStarredMap();
    if (isStarred) {
      map[id] = true;
    } else {
      delete map[id];
    }
    setStarredMap(map);

    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('tasks').update({ is_starred: isStarred }).eq('id', id);
      } catch {
        // ignore if database column does not exist
      }
    }
  },

  async deleteCompletedTasks(userId: string, listId?: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('tasks').delete().eq('user_id', userId).eq('completed', true);
      if (listId && listId !== 'starred') {
        query = query.eq('list_id', listId);
      }
      const { error } = await query;
      if (error) console.error('Error deleting completed tasks:', error);
      return;
    }

    const tasks = getStored<Task[]>(STORAGE_TASKS_KEY, []);
    const remaining = tasks.filter(
      (t) => !(t.completed && (!listId || listId === 'starred' || t.listId === listId))
    );
    setStored(STORAGE_TASKS_KEY, remaining);
  },

  async getTask(id: string): Promise<Task | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id, user_id, list_id, title, notes, completed, position,
          due_date, due_time, is_recurring, recurrence_id, created_at, updated_at
        `)
        .eq('id', id)
        .single();

      if (error) return null;

      return {
        id: data.id,
        userId: data.user_id,
        listId: data.list_id,
        title: data.title,
        notes: data.notes,
        completed: data.completed,
        position: data.position,
        dueDate: data.due_date,
        dueTime: data.due_time,
        isRecurring: data.is_recurring,
        recurrenceId: data.recurrence_id,
        isStarred: Boolean(getStarredMap()[data.id]),
        deadline: getDeadlineMap()[data.id] || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const tasks = getStored<Task[]>(STORAGE_TASKS_KEY, INITIAL_DEMO_TASKS);
    const found = tasks.find((t) => t.id === id);
    if (!found) return null;
    return {
      ...found,
      isStarred: Boolean(getStarredMap()[found.id] ?? found.isStarred),
      deadline: getDeadlineMap()[found.id] || found.deadline || null,
    };
  },

  async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
    const taskId = `task-${Date.now()}`;

    if (isSupabaseConfigured() && supabase) {
      let activeUserId = userId;
      if (!activeUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        activeUserId = sessionData.session?.user?.id || '';
      }

      if (!activeUserId) {
        throw new Error('Please sign in to add and sync tasks.');
      }

      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let targetListId = input.listId;

      if (!targetListId || !UUID_REGEX.test(targetListId)) {
        // Query user's existing list from Supabase
        const { data: existingLists } = await supabase
          .from('task_lists')
          .select('id')
          .eq('user_id', activeUserId)
          .order('position', { ascending: true })
          .limit(1);

        if (existingLists && existingLists.length > 0) {
          targetListId = existingLists[0].id;
        } else {
          // Create default "My Tasks" list in Supabase
          const { data: newList, error: listError } = await supabase
            .from('task_lists')
            .insert({
              user_id: activeUserId,
              name: 'My Tasks',
              position: 0,
            })
            .select('id')
            .single();

          if (listError || !newList) {
            throw new Error(listError?.message || 'Failed to initialize task list');
          }
          targetListId = newList.id;
        }
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: activeUserId,
          list_id: targetListId,
          title: input.title,
          notes: input.notes ?? null,
          completed: false,
          position: input.position ?? 0,
          due_date: input.dueDate ?? null,
          due_time: input.dueTime ?? null,
          is_recurring: Boolean(input.isRecurring),
        })
        .select(`
          id, user_id, list_id, title, notes, completed, position,
          due_date, due_time, is_recurring, recurrence_id, created_at, updated_at
        `)
        .single();

      if (error) throw error;

      let createdRecurrenceId: string | null = null;
      if (input.isRecurring && input.recurrence) {
        const { data: recData, error: recError } = await supabase
          .from('task_recurrences')
          .insert({
            task_id: data.id,
            frequency: input.recurrence.frequency,
            interval: input.recurrence.interval,
            weekdays: input.recurrence.weekdays,
            monthly_mode: input.recurrence.monthlyMode,
            day_of_month: input.recurrence.dayOfMonth,
            week_position: input.recurrence.weekPosition,
            weekday: input.recurrence.weekday,
            time: input.recurrence.time || input.dueTime || null,
            start_date: input.recurrence.startDate || input.dueDate || getTodayDateString(),
            end_type: input.recurrence.endType,
            end_date: input.recurrence.endDate || null,
            occurrence_limit: input.recurrence.occurrenceLimit || null,
            timezone: input.recurrence.timezone,
          })
          .select('id')
          .single();

        if (!recError && recData) {
          createdRecurrenceId = recData.id;
          await supabase.from('tasks').update({ recurrence_id: createdRecurrenceId }).eq('id', data.id);
        }
      }

      if (input.isStarred) {
        const map = getStarredMap();
        map[data.id] = true;
        setStarredMap(map);
      }

      if (input.deadline) {
        const dMap = getDeadlineMap();
        dMap[data.id] = input.deadline;
        setDeadlineMap(dMap);
      }

      return {
        id: data.id,
        userId: data.user_id,
        listId: data.list_id,
        title: data.title,
        notes: data.notes,
        completed: data.completed,
        position: data.position,
        dueDate: data.due_date,
        dueTime: data.due_time,
        isRecurring: Boolean(input.isRecurring),
        recurrenceId: createdRecurrenceId,
        isStarred: Boolean(input.isStarred),
        deadline: input.deadline || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const tasks = getStored<Task[]>(STORAGE_TASKS_KEY, INITIAL_DEMO_TASKS);
    let recId: string | null = null;

    if (input.isStarred) {
      const map = getStarredMap();
      map[taskId] = true;
      setStarredMap(map);
    }

    if (input.deadline) {
      const dMap = getDeadlineMap();
      dMap[taskId] = input.deadline;
      setDeadlineMap(dMap);
    }

    if (input.isRecurring && input.recurrence) {
      recId = `rec-${Date.now()}`;
      const recurrences = getStored<RecurrenceRule[]>(STORAGE_RECURRENCES_KEY, INITIAL_DEMO_RECURRENCES);
      const newRec: RecurrenceRule = {
        id: recId,
        taskId,
        frequency: input.recurrence.frequency,
        interval: input.recurrence.interval,
        weekdays: input.recurrence.weekdays,
        monthlyMode: input.recurrence.monthlyMode,
        dayOfMonth: input.recurrence.dayOfMonth,
        weekPosition: input.recurrence.weekPosition,
        weekday: input.recurrence.weekday,
        time: input.recurrence.time || input.dueTime || undefined,
        startDate: input.recurrence.startDate || input.dueDate || getTodayDateString(),
        endType: input.recurrence.endType,
        endDate: input.recurrence.endDate,
        occurrenceLimit: input.recurrence.occurrenceLimit,
        timezone: input.recurrence.timezone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      recurrences.push(newRec);
      setStored(STORAGE_RECURRENCES_KEY, recurrences);
    }

    const newTask: Task = {
      id: taskId,
      userId,
      listId: input.listId,
      title: input.title,
      notes: input.notes ?? null,
      completed: false,
      position: input.position ?? 0,
      dueDate: input.dueDate ?? null,
      dueTime: input.dueTime ?? null,
      isRecurring: Boolean(input.isRecurring),
      recurrenceId: recId,
      isStarred: Boolean(input.isStarred),
      deadline: input.deadline || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    tasks.unshift(newTask);
    setStored(STORAGE_TASKS_KEY, tasks);
    return newTask;
  },

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    if (input.deadline !== undefined) {
      const dMap = getDeadlineMap();
      if (input.deadline) {
        dMap[id] = input.deadline;
      } else {
        delete dMap[id];
      }
      setDeadlineMap(dMap);
    }

    if (input.isStarred !== undefined) {
      const sMap = getStarredMap();
      if (input.isStarred) {
        sMap[id] = true;
      } else {
        delete sMap[id];
      }
      setStarredMap(sMap);
    }

    if (isSupabaseConfigured() && supabase) {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (input.title !== undefined) updatePayload.title = input.title;
      if (input.notes !== undefined) updatePayload.notes = input.notes;
      if (input.completed !== undefined) updatePayload.completed = input.completed;
      if (input.position !== undefined) updatePayload.position = input.position;
      if (input.dueDate !== undefined) updatePayload.due_date = input.dueDate;
      if (input.dueTime !== undefined) updatePayload.due_time = input.dueTime;
      if (input.listId !== undefined) updatePayload.list_id = input.listId;
      if (input.isRecurring !== undefined) updatePayload.is_recurring = input.isRecurring;
      if (input.recurrenceId !== undefined) updatePayload.recurrence_id = input.recurrenceId;

      const { data, error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', id)
        .select(`
          id, user_id, list_id, title, notes, completed, position,
          due_date, due_time, is_recurring, recurrence_id, created_at, updated_at
        `)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        listId: data.list_id,
        title: data.title,
        notes: data.notes,
        completed: data.completed,
        position: data.position,
        dueDate: data.due_date,
        dueTime: data.due_time,
        isRecurring: data.is_recurring,
        recurrenceId: data.recurrence_id,
        isStarred: Boolean(getStarredMap()[data.id]),
        deadline: getDeadlineMap()[data.id] || null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const tasks = getStored<Task[]>(STORAGE_TASKS_KEY, INITIAL_DEMO_TASKS);
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('Task not found');

    const updated: Task = {
      ...tasks[index],
      ...(input.title !== undefined && { title: input.title }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.completed !== undefined && { completed: input.completed }),
      ...(input.position !== undefined && { position: input.position }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
      ...(input.dueTime !== undefined && { dueTime: input.dueTime }),
      ...(input.listId !== undefined && { listId: input.listId }),
      ...(input.isRecurring !== undefined && { isRecurring: input.isRecurring }),
      ...(input.recurrenceId !== undefined && { recurrenceId: input.recurrenceId }),
      ...(input.deadline !== undefined && { deadline: input.deadline }),
      ...(input.isStarred !== undefined && { isStarred: input.isStarred }),
      updatedAt: new Date().toISOString(),
    };

    tasks[index] = updated;
    setStored(STORAGE_TASKS_KEY, tasks);
    return updated;
  },

  async deleteTask(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    const tasks = getStored<Task[]>(STORAGE_TASKS_KEY, INITIAL_DEMO_TASKS);
    setStored(
      STORAGE_TASKS_KEY,
      tasks.filter((t) => t.id !== id)
    );
  },

  /**
   * Complete task with Google Tasks recurring task advancement logic
   */
  async completeTask(id: string, completed: boolean): Promise<Task> {
    const task = await this.getTask(id);
    if (!task) throw new Error('Task not found');

    // If uncompleting, or non-recurring, perform standard toggle
    if (!completed || !task.isRecurring || !task.recurrenceId) {
      return this.updateTask(id, { completed });
    }

    // Task is recurring and being completed:
    // 1. Fetch recurrence rule
    let rule: RecurrenceRule | null = null;
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase
        .from('task_recurrences')
        .select('*')
        .eq('id', task.recurrenceId)
        .single();
      if (data) {
        rule = {
          id: data.id,
          taskId: data.task_id,
          frequency: data.frequency,
          interval: data.interval,
          weekdays: data.weekdays,
          monthlyMode: data.monthly_mode,
          dayOfMonth: data.day_of_month,
          weekPosition: data.week_position,
          weekday: data.weekday,
          time: data.time,
          startDate: data.start_date,
          endType: data.end_type,
          endDate: data.end_date,
          occurrenceLimit: data.occurrence_limit,
          timezone: data.timezone,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      }
    } else {
      const recurrences = getStored<RecurrenceRule[]>(STORAGE_RECURRENCES_KEY, INITIAL_DEMO_RECURRENCES);
      rule = recurrences.find((r) => r.id === task.recurrenceId) || null;
    }

    if (!rule) {
      return this.updateTask(id, { completed: true });
    }

    // 2. Record completion of current occurrence
    const currentOccurrenceDate = task.dueDate || getTodayDateString();
    const occurrenceRecord: TaskOccurrence = {
      id: `occ-${Date.now()}`,
      taskId: task.id,
      recurrenceId: rule.id || '',
      occurrenceDate: currentOccurrenceDate,
      occurrenceTime: task.dueTime || undefined,
      status: 'completed',
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('task_occurrences').upsert({
        task_id: task.id,
        recurrence_id: rule.id,
        occurrence_date: currentOccurrenceDate,
        occurrence_time: task.dueTime || null,
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
    } else {
      const occurrences = getStored<TaskOccurrence[]>(STORAGE_OCCURRENCES_KEY, []);
      occurrences.push(occurrenceRecord);
      setStored(STORAGE_OCCURRENCES_KEY, occurrences);
    }

    // 3. Check completed occurrences count for "after N occurrences"
    let completedCount = 1;
    if (isSupabaseConfigured() && supabase) {
      const { count } = await supabase
        .from('task_occurrences')
        .select('*', { count: 'exact', head: true })
        .eq('task_id', task.id)
        .eq('status', 'completed');
      completedCount = count || 1;
    } else {
      const occurrences = getStored<TaskOccurrence[]>(STORAGE_OCCURRENCES_KEY, []);
      completedCount = occurrences.filter((o) => o.taskId === task.id && o.status === 'completed').length;
    }

    // 4. Calculate next occurrence
    const nextDate = getNextOccurrence(rule, currentOccurrenceDate);

    // 5. Check if recurrence has reached end condition
    const ended = !nextDate || isRecurrenceEnded(rule, completedCount, nextDate);

    if (ended) {
      // Recurrence reached end -> mark task permanently completed
      return this.updateTask(id, { completed: true });
    }

    // Recurrence continues: advance due date to next occurrence, keep completed = false
    return this.updateTask(id, {
      completed: false,
      dueDate: nextDate,
      dueTime: rule.time || task.dueTime,
    });
  },

  /**
   * Skip an occurrence without breaking the series
   */
  async skipOccurrence(id: string): Promise<Task> {
    const task = await this.getTask(id);
    if (!task || !task.isRecurring || !task.recurrenceId) throw new Error('Task is not recurring');

    const recurrences = getStored<RecurrenceRule[]>(STORAGE_RECURRENCES_KEY, INITIAL_DEMO_RECURRENCES);
    const rule = recurrences.find((r) => r.id === task.recurrenceId);
    if (!rule) return task;

    const currentOccurrenceDate = task.dueDate || getTodayDateString();
    const nextDate = getNextOccurrence(rule, currentOccurrenceDate);
    if (!nextDate) return task;

    // Record skipped occurrence
    const occurrenceRecord: TaskOccurrence = {
      id: `occ-${Date.now()}`,
      taskId: task.id,
      recurrenceId: rule.id || '',
      occurrenceDate: currentOccurrenceDate,
      occurrenceTime: task.dueTime || undefined,
      status: 'skipped',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const occurrences = getStored<TaskOccurrence[]>(STORAGE_OCCURRENCES_KEY, []);
    occurrences.push(occurrenceRecord);
    setStored(STORAGE_OCCURRENCES_KEY, occurrences);

    return this.updateTask(id, {
      dueDate: nextDate,
      dueTime: rule.time || task.dueTime,
    });
  },

  // Subtasks methods
  async getSubtasks(taskId: string): Promise<Subtask[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('subtasks')
        .select('id, task_id, title, completed, position, created_at, updated_at')
        .eq('task_id', taskId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        taskId: row.task_id,
        title: row.title,
        completed: row.completed,
        position: row.position,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }

    const subtasks = getStored<Subtask[]>(STORAGE_SUBTASKS_KEY, INITIAL_DEMO_SUBTASKS);
    return subtasks.filter((s) => s.taskId === taskId);
  },

  async createSubtask(input: CreateSubtaskInput): Promise<Subtask> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          task_id: input.taskId,
          title: input.title,
          position: input.position ?? 0,
        })
        .select('id, task_id, title, completed, position, created_at, updated_at')
        .single();

      if (error) throw error;
      return {
        id: data.id,
        taskId: data.task_id,
        title: data.title,
        completed: data.completed,
        position: data.position,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const subtasks = getStored<Subtask[]>(STORAGE_SUBTASKS_KEY, INITIAL_DEMO_SUBTASKS);
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      taskId: input.taskId,
      title: input.title,
      completed: false,
      position: input.position ?? subtasks.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    subtasks.push(newSub);
    setStored(STORAGE_SUBTASKS_KEY, subtasks);
    return newSub;
  },

  async updateSubtask(id: string, input: UpdateSubtaskInput): Promise<Subtask> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('subtasks')
        .update({
          ...(input.title !== undefined && { title: input.title }),
          ...(input.completed !== undefined && { completed: input.completed }),
          ...(input.position !== undefined && { position: input.position }),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id, task_id, title, completed, position, created_at, updated_at')
        .single();

      if (error) throw error;
      return {
        id: data.id,
        taskId: data.task_id,
        title: data.title,
        completed: data.completed,
        position: data.position,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    }

    const subtasks = getStored<Subtask[]>(STORAGE_SUBTASKS_KEY, INITIAL_DEMO_SUBTASKS);
    const index = subtasks.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Subtask not found');

    const updated: Subtask = {
      ...subtasks[index],
      ...(input.title !== undefined && { title: input.title }),
      ...(input.completed !== undefined && { completed: input.completed }),
      ...(input.position !== undefined && { position: input.position }),
      updatedAt: new Date().toISOString(),
    };
    subtasks[index] = updated;
    setStored(STORAGE_SUBTASKS_KEY, subtasks);
    return updated;
  },

  async deleteSubtask(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('subtasks').delete().eq('id', id);
      if (error) throw error;
      return;
    }

    const subtasks = getStored<Subtask[]>(STORAGE_SUBTASKS_KEY, INITIAL_DEMO_SUBTASKS);
    setStored(
      STORAGE_SUBTASKS_KEY,
      subtasks.filter((s) => s.id !== id)
    );
  },
};
