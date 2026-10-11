import React, { useState, useRef, useEffect } from 'react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { Task, Subtask } from '../../types/task';
import { TaskList } from '../../types/list';
import { Checkbox } from '../common/Checkbox';
import { GoogleDatePickerModal } from '../common/GoogleDatePickerModal';
import { RepeatModal } from '../recurrence/RepeatModal';
import { RecurrenceRule } from '../../types/recurrence';
import { formatRecurrenceRule } from '../../lib/recurrence/recurrenceUtils';
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
  Repeat,
  XCircle,
  GripVertical,
  X,
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
  // Drag and drop props
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent, taskId: string) => void;
  onDragOver?: (e: React.DragEvent, taskId: string) => void;
  onDrop?: (e: React.DragEvent, taskId: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  dropIndicator?: 'above' | 'below' | null;
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
  isDraggable = true,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dropIndicator = null,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeadlinePickerOpen, setIsDeadlinePickerOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCustomRepeatOpen, setIsCustomRepeatOpen] = useState(false);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Inline editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes || '');

  const taskRowRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // Sync edits from props
  useEffect(() => {
    setEditTitle(task.title);
  }, [task.title]);

  useEffect(() => {
    setEditNotes(task.notes || '');
  }, [task.notes]);

  // Activate edit mode when selected
  useEffect(() => {
    if (isSelected && !task.completed) {
      setIsEditing(true);
    }
  }, [isSelected, task.completed]);

  // Auto-save changes on blur or click outside
  const saveChanges = () => {
    const trimmedTitle = editTitle.trim() || task.title;
    const trimmedNotes = editNotes.trim() || null;
    if (trimmedTitle !== task.title || trimmedNotes !== (task.notes || null)) {
      if (onUpdateTask) {
        onUpdateTask(task.id, {
          title: trimmedTitle,
          notes: trimmedNotes,
        });
      }
    }
    setIsEditing(false);
  };

  // Close dropdown on outside click, and auto-save inline edit
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
      if (isDatePickerOpen || isCustomRepeatOpen || isDeadlinePickerOpen) {
        return;
      }
      if (taskRowRef.current && !taskRowRef.current.contains(e.target as Node)) {
        if (isEditing) {
          saveChanges();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, editTitle, editNotes, isDatePickerOpen, isCustomRepeatOpen, isDeadlinePickerOpen, task.title, task.notes]);

  // Focus subtask input when activated
  useEffect(() => {
    if (isAddingSubtask) {
      subtaskInputRef.current?.focus();
    }
  }, [isAddingSubtask]);

  const dueDateChipText = formatChipDate(task.dueDate);
  const isDueToday = dueDateChipText === 'Today';
  const deadlineChipText = formatChipDate(task.deadline);

  const isRecurring = Boolean(task.isRecurring && task.recurrence !== null);
  const recurrenceLabel = task.recurrence
    ? formatRecurrenceRule(task.recurrence)
    : 'Daily';

  const handleRemoveRepeat = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!onUpdateTask) return;
    onUpdateTask(task.id, {
      isRecurring: false,
      recurrence: null,
      recurrenceId: null,
    });
    setIsCustomRepeatOpen(false);
  };

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
      const attachmentNote = `[Attachment: ${file.name}]`;
      const updatedNotes = task.notes ? `${task.notes}\n${attachmentNote}` : attachmentNote;
      onUpdateTask(task.id, { notes: updatedNotes });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="flex flex-col relative">
      {/* Drop indicator above */}
      {dropIndicator === 'above' && (
        <div className="h-0.5 bg-[#1A73E8] dark:bg-[#8AB4F8] rounded-full mx-2 my-0.5 animate-pulse" />
      )}

      {/* Primary Task Row */}
      <div
        ref={taskRowRef}
        onClick={() => {
          onSelect();
          if (!task.completed) {
            setIsEditing(true);
          }
        }}
        role="button"
        tabIndex={0}
        draggable={isDraggable && !task.completed && !isEditing}
        onDragStart={(e) => onDragStart?.(e, task.id)}
        onDragOver={(e) => onDragOver?.(e, task.id)}
        onDrop={(e) => onDrop?.(e, task.id)}
        onDragEnd={onDragEnd}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (!isEditing) {
              e.preventDefault();
              onSelect();
              setIsEditing(true);
            }
          }
        }}
        className={`group relative flex items-start gap-2 sm:gap-2.5 px-2.5 py-2.5 sm:py-2 rounded-xl transition-all cursor-pointer ${
          isSelected || isEditing || isMenuOpen
            ? 'bg-[#F0F4F9] dark:bg-[#282A2C]'
            : 'bg-white dark:bg-[#1E1F20] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]'
        }`}
      >
        {/* 6-dot Drag Handle (Matching Screenshot 2 & 3) */}
        {!task.completed && (
          <div
            className={`pt-1.5 shrink-0 text-[#747775] dark:text-[#8E918F] hover:text-[#1F1F1F] dark:hover:text-white cursor-grab active:cursor-grabbing transition-opacity ${
              isSelected || isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={16} />
          </div>
        )}

        {/* Checkbox (Circle outline matching screenshot) */}
        <div className="pt-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={task.completed}
            onChange={onToggleComplete}
            aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          />
        </div>

        {/* Task Title & Metadata - Click to Edit with Auto-save */}
        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          {isEditing && !task.completed ? (
            /* Inline Editing Mode matching Screenshot 2 */
            <div className="flex flex-col gap-1 w-full">
              <input
                ref={titleInputRef}
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    notesTextareaRef.current?.focus();
                  } else if (e.key === 'Escape') {
                    setEditTitle(task.title);
                    setEditNotes(task.notes || '');
                    setIsEditing(false);
                  }
                }}
                className="w-full text-[16px] font-normal leading-snug tracking-tight text-[#1F1F1F] dark:text-[#E3E3E3] bg-transparent border-none outline-none p-0 focus:ring-0"
                placeholder="Title"
                autoFocus
              />
              <textarea
                ref={notesTextareaRef}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditTitle(task.title);
                    setEditNotes(task.notes || '');
                    setIsEditing(false);
                  }
                }}
                rows={Math.max(1, (editNotes.match(/\n/g) || []).length + 1)}
                className="w-full text-[13.5px] leading-relaxed text-[#444746] dark:text-[#C4C7C5] placeholder-[#747775] dark:placeholder-[#8E918F] bg-transparent border-none outline-none p-0 resize-none focus:ring-0"
                placeholder="Details"
              />
            </div>
          ) : (
            /* View Mode */
            <div
              className="cursor-text"
              onClick={() => {
                setIsEditing(true);
                onSelect();
                setTimeout(() => titleInputRef.current?.focus(), 50);
              }}
            >
              <h3
                className={`text-[16px] font-normal sm:font-medium leading-snug break-words tracking-tight transition-colors ${
                  task.completed
                    ? 'line-through text-[#80868B] dark:text-[#9AA0A6]'
                    : 'text-[#1F1F1F] dark:text-[#E3E3E3]'
                }`}
              >
                {task.title}
              </h3>

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
            </div>
          )}

          {/* Date Chips Row for active tasks or Completed date for completed tasks */}
          {task.completed ? (
            <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] mt-1 select-none">
              Completed: {format(new Date(task.updatedAt || Date.now()), 'EEE d MMM')}
            </p>
          ) : (
            <>
              {(dueDateChipText || deadlineChipText || isRecurring) && (
                <div className="flex flex-wrap items-center gap-2 mt-1.5 select-none">
                  {/* Due Date Chip: Click to edit date directly, with X to remove date (Matching Screenshot 2 & 3) */}
                  {dueDateChipText && (
                    <div className="inline-flex items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDatePickerOpen(true);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border bg-white dark:bg-[#1E1F20] hover:bg-[#F0F4F9] dark:hover:bg-[#2B2C2F] transition-colors cursor-pointer select-none ${
                          isDueToday
                            ? 'border-[#DADCE0] dark:border-[#3C4043] text-[#1A73E8] dark:text-[#8AB4F8]'
                            : 'border-[#DADCE0] dark:border-[#3C4043] text-[#444746] dark:text-[#C4C7C5]'
                        }`}
                        title="Click to edit date and time"
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
                        {isRecurring && (
                          <Repeat
                            size={12}
                            className={
                              isDueToday
                                ? 'text-[#1A73E8] dark:text-[#8AB4F8]'
                                : 'text-[#444746] dark:text-[#C4C7C5]'
                            }
                          />
                        )}
                        {/* Remove Date X button (Matching Screenshot 3) */}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onUpdateTask) {
                              onUpdateTask(task.id, { dueDate: null, dueTime: null });
                            }
                          }}
                          className="ml-0.5 hover:text-[#D93025] dark:hover:text-[#F28B82] p-0.5 cursor-pointer rounded-full"
                          title="Remove date"
                        >
                          <X size={12} />
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Deadline Chip (🎯 Due <Date>) */}
                  {deadlineChipText && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium border border-[#DADCE0] dark:border-[#3C4043] bg-white dark:bg-[#1E1F20] text-[#444746] dark:text-[#C4C7C5]">
                      <Target size={13} className="text-[#444746] dark:text-[#C4C7C5]" />
                      <span>Due {deadlineChipText}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Dedicated Recurrence Row: Click to edit repeat settings, with (X) button to remove repeat (Matching Screenshot 1 & 2) */}
              {isRecurring && (
                <div
                  className="relative mt-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm text-[#444746] dark:text-[#C4C7C5] py-0.5">
                    <button
                      type="button"
                      onClick={() => setIsCustomRepeatOpen(true)}
                      className="flex items-center gap-2 hover:text-[#1A73E8] dark:hover:text-[#8AB4F8] transition-colors cursor-pointer select-none"
                      title="Edit repeat settings"
                    >
                      <Repeat size={15} className="text-[#444746] dark:text-[#C4C7C5] shrink-0" />
                      <span className="font-normal text-[13.5px]">{recurrenceLabel}</span>
                    </button>

                    {/* Remove Repeat Button (⨂ / X) */}
                    <button
                      type="button"
                      onClick={handleRemoveRepeat}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleRemoveRepeat(e);
                      }}
                      className="p-1 rounded-full text-[#747775] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                      title="Remove repeat"
                      aria-label="Remove repeat"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
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

                    {/* 1b. Repeat */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsRepeatMenuOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer text-left"
                    >
                      <Repeat size={16} className="text-[#444746] dark:text-[#C4C7C5] shrink-0" />
                      <span>{isRecurring ? 'Edit repeat' : 'Repeat'}</span>
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

      {/* Drop indicator below */}
      {dropIndicator === 'below' && (
        <div className="h-0.5 bg-[#1A73E8] dark:bg-[#8AB4F8] rounded-full mx-2 my-0.5 animate-pulse" />
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

      {/* Date & Time Picker Modal directly triggered from date chip */}
      {isDatePickerOpen && (
        <GoogleDatePickerModal
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          initialDate={task.dueDate || undefined}
          initialTime={task.dueTime || undefined}
          initialRecurrence={task.recurrence || undefined}
          onSave={({ date, time, recurrence }) => {
            if (onUpdateTask) {
              onUpdateTask(task.id, {
                dueDate: date || null,
                dueTime: time || null,
                isRecurring: Boolean(recurrence),
                recurrence: recurrence || null,
              });
            }
            setIsDatePickerOpen(false);
          }}
        />
      )}

      {/* Custom Repeat Modal */}
      {isCustomRepeatOpen && (
        <RepeatModal
          isOpen={isCustomRepeatOpen}
          onClose={() => setIsCustomRepeatOpen(false)}
          initialRule={task.recurrence || ({ frequency: 'day', interval: 1 } as any)}
          currentRule={task.recurrence || ({ frequency: 'day', interval: 1 } as any)}
          initialDueDate={task.dueDate || undefined}
          initialDueTime={task.dueTime || undefined}
          onSave={(rule) => {
            if (onUpdateTask) {
              onUpdateTask(task.id, {
                isRecurring: true,
                recurrence: rule as any,
              });
            }
            setIsCustomRepeatOpen(false);
          }}
          onRemove={handleRemoveRepeat}
        />
      )}
    </div>
  );
});

TaskItem.displayName = 'TaskItem';
