-- ==============================================================================
-- ClearTasks Database Schema Migration
-- Designed for Supabase PostgreSQL with Row Level Security (RLS)
-- ==============================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_profiles_user_id UNIQUE (user_id)
);

-- 2. Task Lists Table
CREATE TABLE IF NOT EXISTS public.task_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES public.task_lists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  due_time TIME,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Subtasks Table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Task Recurrences Table
CREATE TABLE IF NOT EXISTS public.task_recurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('minute', 'hour', 'day', 'week', 'month', 'year')),
  interval INTEGER NOT NULL DEFAULT 1,
  weekdays INTEGER[], -- Array of weekdays [0..6] or [1..7]
  monthly_mode TEXT CHECK (monthly_mode IN ('day_of_month', 'weekday_position')),
  day_of_month INTEGER,
  week_position TEXT CHECK (week_position IN ('first', 'second', 'third', 'fourth', 'last')),
  weekday INTEGER,
  time TIME,
  start_date DATE NOT NULL,
  end_type TEXT NOT NULL CHECK (end_type IN ('never', 'on', 'after')),
  end_date DATE,
  occurrence_limit INTEGER,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraint to tasks for recurrence_id
ALTER TABLE public.tasks 
  DROP CONSTRAINT IF EXISTS fk_tasks_recurrence;
ALTER TABLE public.tasks 
  ADD CONSTRAINT fk_tasks_recurrence 
  FOREIGN KEY (recurrence_id) 
  REFERENCES public.task_recurrences(id) 
  ON DELETE SET NULL;

-- 6. Task Occurrences Table
CREATE TABLE IF NOT EXISTS public.task_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  recurrence_id UUID NOT NULL REFERENCES public.task_recurrences(id) ON DELETE CASCADE,
  occurrence_date DATE NOT NULL,
  occurrence_time TIME,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_occurrence_per_date UNIQUE (task_id, occurrence_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_lists_user_id ON public.task_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_list_id ON public.tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_id ON public.tasks(recurrence_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_recurrences_task_id ON public.task_recurrences(task_id);
CREATE INDEX IF NOT EXISTS idx_task_occurrences_task_id ON public.task_occurrences(task_id);
CREATE INDEX IF NOT EXISTS idx_task_occurrences_recurrence_id ON public.task_occurrences(recurrence_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_recurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_occurrences ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Task Lists Policies
CREATE POLICY "Users can view their own task lists"
  ON public.task_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task lists"
  ON public.task_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task lists"
  ON public.task_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own task lists"
  ON public.task_lists FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Tasks Policies
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Subtasks Policies (via task ownership)
CREATE POLICY "Users can view their subtasks"
  ON public.subtasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE public.tasks.id = public.subtasks.task_id 
    AND public.tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert subtasks for their tasks"
  ON public.subtasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE public.tasks.id = public.subtasks.task_id 
    AND public.tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their subtasks"
  ON public.subtasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE public.tasks.id = public.subtasks.task_id 
    AND public.tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their subtasks"
  ON public.subtasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE public.tasks.id = public.subtasks.task_id 
    AND public.tasks.user_id = auth.uid()
  ));

-- 5. Task Recurrences Policies
CREATE POLICY "Users can view their recurrences"
  ON public.task_recurrences FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE public.tasks.id = public.task_recurrences.task_id 
    AND public.tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their recurrences"
  ON public.task_recurrences FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE public.tasks.id = public.task_recurrences.task_id 
    AND public.tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their recurrences"
  ON public.task_recurrences FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE public.tasks.id = public.task_recurrences.task_id 
    AND public.tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their recurrences"
  ON public.task_recurrences FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE public.tasks.id = public.task_recurrences.task_id 
    AND public.tasks.user_id = auth.uid()
  ));

-- 6. Task Occurrences Policies
CREATE POLICY "Users can view their occurrences"
  ON public.task_occurrences FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE public.tasks.id = public.task_occurrences.task_id 
    AND public.tasks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert/update their occurrences"
  ON public.task_occurrences FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE public.tasks.id = public.task_occurrences.task_id 
    AND public.tasks.user_id = auth.uid()
  ));
