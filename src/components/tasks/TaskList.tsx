import React, { useState, useMemo } from 'react';
import { Task } from '../../types/task';
import { TaskItem } from './TaskItem';
import { EmptyStarred } from '../common/EmptyStarred';
import { TaskSortMenu } from './TaskSortMenu';
import { TaskSortOption } from '../../store/uiStore';
import { ChevronDown, ChevronRight, MoreVertical, Plus, Check } from 'lucide-react';

interface TaskListProps {
  listId: string;
  listName: string;
  tasks: Task[];
  lists?: import('../../types/list').TaskList[];
  selectedTaskId: string | null;
  searchQuery: string;
  sortBy: TaskSortOption;
  onChangeSort: (sort: TaskSortOption) => void;
  onOpenListActions?: () => void;
  onOpenNewTask: () => void;
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onToggleStar: (taskId: string, isStarred: boolean) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onReorderTasks?: (tasks: { id: string; position: number }[]) => Promise<void>;
}

export const TaskList: React.FC<TaskListProps> = ({
  listId,
  listName,
  tasks,
  lists = [],
  selectedTaskId,
  searchQuery,
  sortBy,
  onChangeSort,
  onOpenListActions,
  onOpenNewTask,
  onSelectTask,
  onToggleComplete,
  onToggleStar,
  onDeleteTask,
  onUpdateTask,
  onReorderTasks,
}) => {
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const isStarredList = listId === 'starred';

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTaskId && draggedTaskId !== taskId) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const position = e.clientY < midY ? 'above' : 'below';
      setDragOverTaskId(taskId);
      setDropPosition(position);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDropPosition(null);
  };

  const handleDrop = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId || !onReorderTasks) {
      handleDragEnd();
      return;
    }

    const currentList = [...activeTasks];
    const sourceIdx = currentList.findIndex((t) => t.id === draggedTaskId);
    if (sourceIdx === -1) {
      handleDragEnd();
      return;
    }

    const [removed] = currentList.splice(sourceIdx, 1);
    const targetIdx = currentList.findIndex((t) => t.id === targetTaskId);
    if (targetIdx === -1) {
      handleDragEnd();
      return;
    }

    const insertIdx = dropPosition === 'above' ? targetIdx : targetIdx + 1;
    currentList.splice(insertIdx, 0, removed);

    const reorderedPayload = currentList.map((t, idx) => ({
      id: t.id,
      position: idx,
    }));

    handleDragEnd();
    if (sortBy !== 'my_order') {
      onChangeSort('my_order');
    }
    await onReorderTasks(reorderedPayload);
  };

  const handleContainerDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedTaskId || !onReorderTasks) {
      handleDragEnd();
      return;
    }
    const currentList = [...activeTasks];
    const sourceIdx = currentList.findIndex((t) => t.id === draggedTaskId);
    if (sourceIdx === -1) {
      handleDragEnd();
      return;
    }
    const [removed] = currentList.splice(sourceIdx, 1);
    currentList.push(removed);

    const reorderedPayload = currentList.map((t, idx) => ({
      id: t.id,
      position: idx,
    }));

    handleDragEnd();
    if (sortBy !== 'my_order') {
      onChangeSort('my_order');
    }
    await onReorderTasks(reorderedPayload);
  };

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
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-3 sm:px-4 pb-24">
      {/* Google Tasks White Card Container */}
      <div className="bg-white dark:bg-[#1E1F20] rounded-[22px] p-4 sm:p-5 shadow-xs flex-1 flex flex-col min-h-[460px]">
        {/* Card Header: List Name on Left, Sort & 3-Dots on Right */}
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[19px] font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
            {isStarredList ? 'Starred' : listName}
          </h2>

          <div className="flex items-center gap-1">
            {/* Sort Menu Button (↕) */}
            <TaskSortMenu currentSort={sortBy} onChangeSort={onChangeSort} />

            {/* Three Dots Button (⋮) */}
            {!isStarredList && onOpenListActions && (
              <button
                type="button"
                onClick={onOpenListActions}
                className="p-1.5 rounded-full text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F0F4F9] dark:hover:bg-[#2B2C2F] transition-colors cursor-pointer"
                title="List options"
                aria-label="List options"
              >
                <MoreVertical size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Add a Task Button on mobile */}
        <div className="mb-2 px-1">
          <button
            type="button"
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-2.5 text-[#0B57D0] dark:text-[#8AB4F8] hover:opacity-80 transition-opacity cursor-pointer font-medium text-sm py-1 select-none"
          >
            <div className="w-5 h-5 rounded-full border-2 border-[#0B57D0] dark:border-[#8AB4F8] flex items-center justify-center relative shrink-0">
              <Check size={11} strokeWidth={2.8} className="text-[#0B57D0] dark:text-[#8AB4F8]" />
              <span className="absolute -top-1 -right-1 text-[9px] font-bold text-[#0B57D0] dark:text-[#8AB4F8] leading-none">+</span>
            </div>
            <span>{isStarredList ? 'Add a starred task' : 'Add a task'}</span>
          </button>
        </div>

        {/* Empty States */}
        {hasNoTasks && (
          <div className="flex-1 flex items-center justify-center">
            {isStarredList ? (
              <EmptyStarred />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center select-none">
                <div className="w-12 h-12 rounded-full bg-[#E8F0FE] dark:bg-[#28364D] text-[#1A73E8] dark:text-[#8AB4F8] flex items-center justify-center mb-3">
                  <span className="text-xl">✓</span>
                </div>
                <h3 className="text-base font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                  A fresh start
                </h3>
                <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] mt-1">
                  Add a task using the + button below
                </p>
              </div>
            )}
          </div>
        )}

        {/* Active Tasks List */}
        <div className="flex flex-col gap-1">
          {activeTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              lists={lists}
              onSelect={() => onSelectTask(task.id)}
              onToggleComplete={(checked) => onToggleComplete(task.id, checked)}
              onToggleStar={(starred) => onToggleStar(task.id, starred)}
              onDeleteTask={onDeleteTask}
              onUpdateTask={onUpdateTask}
              isDraggable={true}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              dropIndicator={dragOverTaskId === task.id ? dropPosition : null}
            />
          ))}

          {/* Bottom drop zone when dragging */}
          {draggedTaskId && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={handleContainerDrop}
              className="py-3 my-1 border-2 border-dashed border-[#1A73E8]/40 dark:border-[#8AB4F8]/40 rounded-xl text-center text-xs text-[#1A73E8] dark:text-[#8AB4F8] select-none"
            >
              Drop here to move to bottom
            </div>
          )}
        </div>

        {/* Completed Tasks Accordion */}
        {completedTasks.length > 0 && (
          <div className="mt-6 border-t border-[#F0F4F9] dark:border-[#2B2C2F] pt-3">
            <button
              type="button"
              onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#202124] dark:hover:text-[#E8EAED] py-2 transition-colors select-none cursor-pointer"
            >
              {isCompletedExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <span>Completed ({completedTasks.length})</span>
            </button>

            {isCompletedExpanded && (
              <div className="flex flex-col gap-1 mt-1 transition-all">
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    lists={lists}
                    onSelect={() => onSelectTask(task.id)}
                    onToggleComplete={(checked) => onToggleComplete(task.id, checked)}
                    onToggleStar={(starred) => onToggleStar(task.id, starred)}
                    onDeleteTask={onDeleteTask}
                    onUpdateTask={onUpdateTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button (+ FAB) */}
      <button
        type="button"
        onClick={onOpenNewTask}
        className="fixed right-5 bottom-6 z-40 w-14 h-14 bg-[#1E1F20] dark:bg-[#E3E3E3] text-white dark:text-[#1E1F20] rounded-2xl shadow-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        aria-label="Add a task"
        title="Add a task"
      >
        <Plus size={26} strokeWidth={2.2} />
      </button>
    </div>
  );
};
