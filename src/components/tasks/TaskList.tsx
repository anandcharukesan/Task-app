import React, { useState, useMemo } from 'react';
import { Task } from '../../types/task';
import { TaskItem } from './TaskItem';
import { QuickTaskInput } from './QuickTaskInput';
import { EmptyState } from '../common/EmptyState';
import { TaskSortOption } from '../../store/uiStore';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { RecurrenceRule } from '../../types/recurrence';

interface TaskListProps {
  listId: string;
  listName: string;
  tasks: Task[];
  selectedTaskId: string | null;
  searchQuery: string;
  sortBy: TaskSortOption;
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onAddTask: (data: {
    title: string;
    notes?: string;
    dueDate?: string;
    dueTime?: string;
    isRecurring?: boolean;
    recurrence?: Omit<RecurrenceRule, 'taskId'>;
  }) => Promise<unknown>;
}

export const TaskList: React.FC<TaskListProps> = ({
  listId,
  listName: _listName,
  tasks,
  selectedTaskId,
  searchQuery,
  sortBy,
  onSelectTask,
  onToggleComplete,
  onAddTask,
}) => {
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  // Filter and sort tasks
  const { activeTasks, completedTasks } = useMemo(() => {
    let filtered = tasks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    const sortFn = (a: Task, b: Task) => {
      if (sortBy === 'date') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return a.position - b.position;
    };

    const active = filtered.filter((t) => !t.completed).sort(sortFn);
    const completed = filtered.filter((t) => t.completed).sort(sortFn);

    return { activeTasks: active, completedTasks: completed };
  }, [tasks, searchQuery, sortBy]);

  const hasNoTasks = activeTasks.length === 0 && completedTasks.length === 0;

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-4">
      {/* Quick Add Bar */}
      <div className="mb-4">
        <QuickTaskInput listId={listId} onAddTask={onAddTask} />
      </div>

      {/* Empty State */}
      {hasNoTasks && (
        <EmptyState
          type={searchQuery ? 'search' : 'tasks'}
          description={
            searchQuery
              ? `No tasks matching "${searchQuery}"`
              : 'Add a task above to get started'
          }
        />
      )}

      {/* Active Tasks List */}
      <div className="flex flex-col gap-1.5">
        {activeTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isSelected={selectedTaskId === task.id}
            onSelect={() => onSelectTask(task.id)}
            onToggleComplete={(checked) => onToggleComplete(task.id, checked)}
          />
        ))}
      </div>

      {/* Completed Tasks Accordion */}
      {completedTasks.length > 0 && (
        <div className="mt-8 border-t border-[#DADCE0] dark:border-[#3C4043] pt-4">
          <button
            type="button"
            onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#202124] dark:hover:text-[#E8EAED] py-2 transition-colors select-none"
          >
            {isCompletedExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            <span>Completed ({completedTasks.length})</span>
          </button>

          {isCompletedExpanded && (
            <div className="flex flex-col gap-1.5 mt-2 transition-all">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  onSelect={() => onSelectTask(task.id)}
                  onToggleComplete={(checked) => onToggleComplete(task.id, checked)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
