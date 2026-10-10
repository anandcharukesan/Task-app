import { supabase, isSupabaseConfigured } from './supabase';
import { RecurrenceRule } from '../types/recurrence';

const STORAGE_RECURRENCES_KEY = 'cleartasks_recurrences_v1';

export const recurrenceService = {
  async getRecurrence(taskId: string): Promise<RecurrenceRule | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('task_recurrences')
        .select('*')
        .eq('task_id', taskId)
        .maybeSingle();

      if (error || !data) return null;

      return {
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

    try {
      const raw = localStorage.getItem(STORAGE_RECURRENCES_KEY);
      if (!raw) return null;
      const recurrences: RecurrenceRule[] = JSON.parse(raw);
      return recurrences.find((r) => r.taskId === taskId) || null;
    } catch {
      return null;
    }
  },

  async saveRecurrence(taskId: string, rule: Omit<RecurrenceRule, 'taskId'>): Promise<RecurrenceRule> {
    if (isSupabaseConfigured() && supabase) {
      const existing = await this.getRecurrence(taskId);

      if (existing) {
        const { data, error } = await supabase
          .from('task_recurrences')
          .update({
            frequency: rule.frequency,
            interval: rule.interval,
            weekdays: rule.weekdays,
            monthly_mode: rule.monthlyMode,
            day_of_month: rule.dayOfMonth,
            week_position: rule.weekPosition,
            weekday: rule.weekday,
            time: rule.time,
            start_date: rule.startDate,
            end_type: rule.endType,
            end_date: rule.endDate,
            occurrence_limit: rule.occurrenceLimit,
            timezone: rule.timezone,
            updated_at: new Date().toISOString(),
          })
          .eq('task_id', taskId)
          .select('*')
          .single();

        if (error) throw error;
        return {
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

      const { data, error } = await supabase
        .from('task_recurrences')
        .insert({
          task_id: taskId,
          frequency: rule.frequency,
          interval: rule.interval,
          weekdays: rule.weekdays,
          monthly_mode: rule.monthlyMode,
          day_of_month: rule.dayOfMonth,
          week_position: rule.weekPosition,
          weekday: rule.weekday,
          time: rule.time,
          start_date: rule.startDate,
          end_type: rule.endType,
          end_date: rule.endDate,
          occurrence_limit: rule.occurrenceLimit,
          timezone: rule.timezone,
        })
        .select('*')
        .single();

      if (error) throw error;
      await supabase.from('tasks').update({ is_recurring: true, recurrence_id: data.id }).eq('id', taskId);

      return {
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

    let recurrences: RecurrenceRule[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_RECURRENCES_KEY);
      if (raw) recurrences = JSON.parse(raw);
    } catch {
      // ignore
    }

    const index = recurrences.findIndex((r) => r.taskId === taskId);
    const recId = index >= 0 ? recurrences[index].id || `rec-${Date.now()}` : `rec-${Date.now()}`;
    const newRule: RecurrenceRule = {
      ...rule,
      id: recId,
      taskId,
      createdAt: index >= 0 ? recurrences[index].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      recurrences[index] = newRule;
    } else {
      recurrences.push(newRule);
    }
    localStorage.setItem(STORAGE_RECURRENCES_KEY, JSON.stringify(recurrences));
    return newRule;
  },

  async deleteRecurrence(taskId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('task_recurrences').delete().eq('task_id', taskId);
      await supabase.from('tasks').update({ is_recurring: false, recurrence_id: null }).eq('id', taskId);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_RECURRENCES_KEY);
      if (raw) {
        const recurrences: RecurrenceRule[] = JSON.parse(raw);
        localStorage.setItem(
          STORAGE_RECURRENCES_KEY,
          JSON.stringify(recurrences.filter((r) => r.taskId !== taskId))
        );
      }
    } catch {
      // ignore
    }
  },
};
