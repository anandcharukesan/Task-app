import React from 'react';
import { Task } from '../../types/task';
import { Checkbox } from '../common/Checkbox';
import { formatDueDate, isOverdue } from '../../lib/date/dateUtils';
import { Repeat, Calendar, CheckSquare, Star } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  onSelect: () => void;
  onToggleComplete: (completed: boolean) => void;
  onToggleStar?: (isStarred: boolean) => void;
}

export const TaskItem: React.FC<TaskItemProps> = React.memo(({
  task,
  isSelected = false,
  onSelect,
  onToggleComplete,
  onToggleStar,
}) => {
  const overdue = !task.completed && isOverdue(task.dueDate, task.dueTime);
  const formattedDate = formatDueDate(task.dueDate, task.dueTime);
  const subtasksCount = task.subtasks?.length || 0;
  const completedSubtasksCount = task.subtasks?.filter((s) => s.completed).length || 0;

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group relative flex items-start gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer border ${
        isSelected
          ? 'bg-[#E8F0FE] dark:bg-[#28364D]/60 border-[#1A73E8]/30 dark:border-[#8AB4F8]/30'
          : 'bg-white dark:bg-[#292A2D] border-transparent hover:border-[#DADCE0] dark:hover:border-[#3C4043] hover:shadow-xs'
      }`}
    >
      {/* Google Tasks circular Checkbox */}
      <div className="pt-0.5">
        <Checkbox
          checked={task.completed}
          onChange={onToggleComplete}
          aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        />
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <h3
          className={`text-sm font-medium leading-snug break-words transition-colors ${
            task.completed
              ? 'line-through text-[#80868B] dark:text-[#9AA0A6]'
              : 'text-[#202124] dark:text-[#E8EAED]'
          }`}
        >
          {task.title}
        </h3>

        {/* Notes preview if present */}
        {task.notes && (
          <p
            className={`text-xs mt-0.5 line-clamp-1 transition-colors ${
              task.completed
                ? 'line-through text-[#9AA0A6] dark:text-[#5F6368]'
                : 'text-[#5F6368] dark:text-[#9AA0A6]'
            }`}
          >
            {task.notes}
          </p>
        )}

        {/* Unboxed Metadata Line (Zero-Pill discipline: pure typographic hierarchy with subtle separators) */}
        {(formattedDate || task.isRecurring || subtasksCount > 0) && (
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
            {formattedDate && (
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  overdue
                    ? 'text-[#D93025] dark:text-[#F28B82]'
                    : task.completed
                    ? 'text-[#80868B] dark:text-[#9AA0A6]'
                    : 'text-[#1A73E8] dark:text-[#8AB4F8]'
                }`}
              >
                <Calendar size={13} className="shrink-0" />
                <span>{formattedDate}</span>
              </span>
            )}

            {task.isRecurring && (
              <>
                {formattedDate && <span className="text-[#80868B] dark:text-[#5F6368] select-none" aria-hidden="true">·</span>}
                <span className="inline-flex items-center gap-1 text-[#5F6368] dark:text-[#9AA0A6]">
                  <Repeat size={12} className="shrink-0" />
                  <span>Repeats</span>
                </span>
              </>
            )}

            {subtasksCount > 0 && (
              <>
                {(formattedDate || task.isRecurring) && (
                  <span className="text-[#80868B] dark:text-[#5F6368] select-none" aria-hidden="true">·</span>
                )}
                <span className="inline-flex items-center gap-1 text-[#5F6368] dark:text-[#9AA0A6]">
                  <CheckSquare size={12} className="shrink-0" />
                  <span>
                    {completedSubtasksCount}/{subtasksCount}
                  </span>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Star Toggle Button */}
      {onToggleStar && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(!task.isStarred);
          }}
          className="p-1 rounded-full text-[#747775] hover:text-[#1F1F1F] dark:hover:text-white transition-colors focus:outline-none shrink-0"
          aria-label={task.isStarred ? 'Unstar task' : 'Star task'}
        >
          <Star
            size={18}
            className={
              task.isStarred
                ? 'text-[#F4B400] fill-[#F4B400]'
                : 'text-[#747775] dark:text-[#8E918F]'
            }
          />
        </button>
      )}
    </div>
  );
});

TaskItem.displayName = 'TaskItem';
