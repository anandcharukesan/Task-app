import { supabase, isSupabaseConfigured } from './supabase';
import { TaskOccurrence } from '../types/recurrence';

const STORAGE_OCCURRENCES_KEY = 'cleartasks_occurrences_v1';

export const occurrenceService = {
  async getOccurrences(taskId: string): Promise<TaskOccurrence[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('task_occurrences')
        .select('*')
        .eq('task_id', taskId)
        .order('occurrence_date', { ascending: false });

      if (error) throw error;
      return (data || []).map((row) => ({
        id: row.id,
        taskId: row.task_id,
        recurrenceId: row.recurrence_id,
        occurrenceDate: row.occurrence_date,
        occurrenceTime: row.occurrence_time,
        status: row.status,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }

    try {
      const raw = localStorage.getItem(STORAGE_OCCURRENCES_KEY);
      if (!raw) return [];
      const occs: TaskOccurrence[] = JSON.parse(raw);
      return occs.filter((o) => o.taskId === taskId);
    } catch {
      return [];
    }
  },
};
