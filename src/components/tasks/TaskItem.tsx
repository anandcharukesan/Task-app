import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { Task, Subtask } from '../../types/task';
import { TaskList } from '../../types/list';
import { Checkbox } from '../common/Checkbox';
import { GoogleDatePickerModal } from '../common/GoogleDatePickerModal';
import {
  Clock,
  Target,
  Star,
  MoreVertical,
  CornerDownRight,
  Paperclip,
  Trash2,
  Check,
  ListPlus,
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  isSelected?: boolean;
  lists?: TaskList[];
  onSelect: () => void;
  onToggleComplete: (completed: boolean) => void;
  onToggleStar?: (isStarred: boolean) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onCreateSubtask?: (taskId: string, title: string) => void;
  onToggleSubtaskComplete?: (subtaskId: string, completed: boolean) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  onMoveToList?: (taskId: string, listId: string) => void;
  onOpenCreateList?: () => void;
}

function formatChipDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    return format(d, 'EEE d MMM'); // e.g. "Wed 14 Oct"
  } catch {
    return dateStr;
  }
}

export const TaskItem: React.FC<TaskItemProps> = React.memo(({
  task,
  isSelected = false,
  lists = [],
  onSelect,
  onToggleComplete,
  onToggleStar,
  onDeleteTask,
  onUpdateTask,
  onCreateSubtask,
  onToggleSubtaskComplete,
  onDeleteSubtask,
  onMoveToList,
  onOpenCreateList,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeadlinePickerOpen, setIsDeadlinePickerOpen] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus subtask input when activated
  useEffect(() => {
    if (isAddingSubtask) {
      subtaskInputRef.current?.focus();
    }
  }, [isAddingSubtask]);

  const dueDateChipText = formatChipDate(task.dueDate);
  const isDueToday = dueDateChipText === 'Today';
  const deadlineChipText = formatChipDate(task.deadline);

  const currentList = lists.find((l) => l.id === task.listId) || { name: 'My Tasks', id: task.listId };

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !onCreateSubtask) return;
    onCreateSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateTask) {
      // Append attachment notice to task notes
      const attachmentNote = `[Attachment: ${file.name}]`;
      const updatedNotes = task.notes ? `${task.notes}\n${attachmentNote}` : attachmentNote;
      onUpdateTask(task.id, { notes: updatedNotes });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col">
      {/* Primary Task Row */}
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
        className={`group relative flex items-start gap-3.5 px-3.5 py-3 sm:py-2.5 rounded-xl transition-all cursor-pointer ${
          isSelected || isMenuOpen
            ? 'bg-[#F0F4F9] dark:bg-[#282A2C]'
            : 'bg-white dark:bg-[#1E1F20] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]'
        }`}
      >
        {/* Checkbox (Circle outline matching screenshot) */}
        <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={task.completed}
            onChange={onToggleComplete}
            aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          />
        </div>

        {/* Task Title & Metadata */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-[16px] font-normal sm:font-medium leading-snug break-words tracking-tight transition-colors ${
              task.completed
                ? 'line-through text-[#80868B] dark:text-[#9AA0A6]'
                : 'text-[#1F1F1F] dark:text-[#E3E3E3]'
            }`}
          >
            {task.title}
          </h3>

          {/* Details / Notes */}
          {task.notes && (
            <p
              className={`text-[13.5px] mt-1 line-clamp-2 leading-relaxed transition-colors ${
                task.completed
                  ? 'line-through text-[#9AA0A6] dark:text-[#5F6368]'
                  : 'text-[#444746] dark:text-[#C4C7C5]'
              }`}
            >
              {task.notes}
            </p>
          )}

          {/* Date Chips Row for active tasks or Completed date for completed tasks */}
          {task.completed ? (
            <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] mt-1 select-none">
              Completed: {format(new Date(task.updatedAt || Date.now()), 'EEE d MMM')}
            </p>
          ) : (
            (dueDateChipText || deadlineChipText) && (
              <div className="flex flex-wrap items-center gap-2 mt-1.5 select-none">
                {/* Due Date Chip */}
                {dueDateChipText && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border bg-white dark:bg-[#1E1F20] ${
                      isDueToday
                        ? 'border-[#DADCE0] dark:border-[#3C4043] text-[#1A73E8] dark:text-[#8AB4F8]'
                        : 'border-[#DADCE0] dark:border-[#3C4043] text-[#444746] dark:text-[#C4C7C5]'
                    }`}
                  >
                    <Clock
                      size={13}
                      className={
                        isDueToday
                          ? 'text-[#1A73E8] dark:text-[#8AB4F8]'
                          : 'text-[#444746] dark:text-[#C4C7C5]'
                      }
                    />
                    <span>{dueDateChipText}</span>
                  </span>
                )}

                {/* Deadline Chip (🎯 Due <Date>) */}
                {deadlineChipText && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border border-[#DADCE0] dark:border-[#3C4043] bg-white dark:bg-[#1E1F20] text-[#444746] dark:text-[#C4C7C5]">
                    <Target size={13} className="text-[#444746] dark:text-[#C4C7C5]" />
                    <span>Due {deadlineChipText}</span>
                  </span>
                )}
              </div>
            )
          )}
        </div>

        {/* Right Actions: Trash for completed tasks, or Three-dot (⋮) + Star (☆) for active tasks */}
        <div
          className="flex items-center gap-1 shrink-0 pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {task.completed ? (
            onDeleteTask && (
              <button
                type="button"
                onClick={() => onDeleteTask(task.id)}
                className="p-1 rounded-full text-[#5F6368] hover:text-[#1F1F1F] dark:hover:text-white transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 size={16} />
              </button>
            )
          ) : (
            <>
              {/* Three Dots Button (⋮) - show on desktop hover only */}
              <div
                className={`relative transition-opacity hidden sm:block ${
                  isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                ref={menuRef}
              >
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-1 rounded-full text-[#444746] dark:text-[#C4C7C5] hover:bg-[#DADCE0]/50 dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                  title="Task options"
                  aria-label="Task options"
                >
                  <MoreVertical size={16} />
                </button>

                {/* Three Dots Dropdown Menu (Exact match with Image 2) */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#282A2C] rounded-2xl shadow-xl border border-[#DADCE0] dark:border-[#3C4043] py-1.5 z-50 text-sm animate-in fade-in zoom-in-95">
                    {/* 1. Edit deadline */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsDeadlinePickerOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer text-left"
                    >
                      <Target size={16} className="text-[#444746] dark:text-[#C4C7C5] shrink-0" />
                      <span>Edit deadline</span>
                    </button>

                    {/* 2. Add a subtask */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsAddingSubtask(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer text-left"
                    >
                      <CornerDownRight size={16} className="text-[#444746] dark:text-[#C4C7C5] shrink-0" />
                      <span>Add a subtask</span>
                    </button>

                    {/* 3. Add attachment */}
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer text-left"
                    >
                      <Paperclip size={16} className="text-[#444746] dark:text-[#C4C7C5] shrink-0" />
                      <span>Add attachment</span>
                    </button>

                    {/* 4. Delete (Clean dark text, NO RED) */}
                    {onDeleteTask && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onDeleteTask(task.id);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer text-left"
                      >
                        <Trash2 size={16} className="text-[#444746] dark:text-[#C4C7C5] shrink-0" />
                        <span>Delete</span>
                      </button>
                    )}

                    {/* Divider Line */}
                    <div className="my-1 border-t border-[#F1F3F4] dark:border-[#3C4043]" />

                    {/* 5. Lists: Current List with Checkmark + Other Lists */}
                    {lists.length > 0 ? (
                      lists.map((l) => {
                        const isCurrent = l.id === task.listId;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => {
                              setIsMenuOpen(false);
                              if (!isCurrent && onMoveToList) {
                                onMoveToList(task.id, l.id);
                              }
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer text-left"
                          >
                            <div className="w-4 flex items-center justify-center shrink-0">
                              {isCurrent && <Check size={16} className="text-[#444746] dark:text-[#C4C7C5]" />}
                            </div>
                            <span className="truncate">{l.name}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="w-full flex items-center gap-3 px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3]">
                        <Check size={16} className="text-[#444746] dark:text-[#C4C7C5] shrink-0" />
                        <span className="truncate">{currentList.name}</span>
                      </div>
                    )}

                    {/* 6. New list */}
                    {onOpenCreateList && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onOpenCreateList();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer text-left"
                      >
                        <ListPlus size={16} className="text-[#444746] dark:text-[#C4C7C5] shrink-0" />
                        <span>New list</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Star Toggle Button - visible on mobile, hover on desktop */}
              {onToggleStar && (
                <button
                  type="button"
                  onClick={() => onToggleStar(!task.isStarred)}
                  className={`p-1.5 rounded-full transition-opacity cursor-pointer ${
                    task.isStarred
                      ? 'opacity-100 text-[#F4B400]'
                      : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-[#747775] hover:text-[#1F1F1F] dark:hover:text-white'
                  }`}
                  aria-label={task.isStarred ? 'Unstar task' : 'Star task'}
                >
                  <Star
                    size={19}
                    className={
                      task.isStarred
                        ? 'text-[#F4B400] fill-[#F4B400]'
                        : 'text-[#747775] dark:text-[#8E918F]'
                    }
                  />
                </button>
              )}

          {/* Hidden File Input for Add Attachment */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
          />
        </>
      )}
    </div>
      </div>

      {/* Indented Inline Subtask Creator */}
      {isAddingSubtask && (
        <form
          onSubmit={handleSubtaskSubmit}
          className="flex items-center gap-2.5 ml-8 mt-1 px-3 py-1.5 rounded-lg bg-[#F0F4F9] dark:bg-[#282A2C]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-4 h-4 rounded-full border-2 border-[#5F6368] dark:border-[#9AA0A6] shrink-0" />
          <input
            ref={subtaskInputRef}
            type="text"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsAddingSubtask(false);
                setNewSubtaskTitle('');
              }
            }}
            placeholder="Add subtask"
            className="flex-1 bg-transparent border-none outline-none text-xs text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#5F6368]"
          />
          <button
            type="submit"
            className="text-xs font-semibold text-[#1A73E8] px-2 py-0.5 hover:bg-[#E8F0FE] rounded cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAddingSubtask(false);
              setNewSubtaskTitle('');
            }}
            className="text-xs text-[#5F6368] px-2 py-0.5 hover:bg-[#E8EAED] rounded cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Indented Subtasks List (Exact match with Image 1) */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="flex flex-col ml-8 mt-1 gap-1">
          {task.subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-start gap-2.5 px-3 py-1.5 rounded-lg hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] transition-colors group"
            >
              <div className="pt-0.5">
                <Checkbox
                  checked={subtask.completed}
                  onChange={(checked) => {
                    if (onToggleSubtaskComplete) {
                      onToggleSubtaskComplete(subtask.id, checked);
                    }
                  }}
                  size="sm"
                  aria-label={`Mark "${subtask.title}" as complete`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs ${
                    subtask.completed
                      ? 'line-through text-[#80868B] dark:text-[#9AA0A6]'
                      : 'text-[#1F1F1F] dark:text-[#E3E3E3]'
                  }`}
                >
                  {subtask.title}
                </p>
              </div>

              {onDeleteSubtask && (
                <button
                  type="button"
                  onClick={() => onDeleteSubtask(subtask.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#5F6368] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-opacity p-0.5"
                  title="Delete subtask"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Deadline Picker Modal */}
      {isDeadlinePickerOpen && (
        <GoogleDatePickerModal
          isOpen={isDeadlinePickerOpen}
          onClose={() => setIsDeadlinePickerOpen(false)}
          initialDate={task.deadline || undefined}
          onSave={({ date }) => {
            if (onUpdateTask) {
              onUpdateTask(task.id, { deadline: date || null });
            }
            setIsDeadlinePickerOpen(false);
          }}
        />
      )}
    </div>
  );
});

TaskItem.displayName = 'TaskItem';
