import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Task } from '../../types/task';
import { RecurrenceRule } from '../../types/recurrence';
import { TaskItem } from '../tasks/TaskItem';
import { TaskSortMenu } from '../tasks/TaskSortMenu';
import { TaskSortOption } from '../../store/uiStore';
import { WebEmptyIllustration } from './WebEmptyIllustration';
import { EmptyStarred } from '../common/EmptyStarred';
import { GoogleDatePickerModal } from '../common/GoogleDatePickerModal';
import { RepeatModal } from '../recurrence/RepeatModal';
import { formatRecurrenceRule } from '../../lib/recurrence/recurrenceUtils';
import {
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Check,
  Clock,
  ArrowLeftRight,
  Repeat,
  X,
} from 'lucide-react';

export interface InlineTaskData {
  title: string;
  notes?: string;
  dueDate?: string;
  dueTime?: string;
  isRecurring?: boolean;
  recurrence?: RecurrenceRule;
}

interface WebTaskCardProps {
  listId: string;
  listName: string;
  tasks: Task[];
  lists?: import('../../types/list').TaskList[];
  selectedTaskId: string | null;
  searchQuery: string;
  sortBy: TaskSortOption;
  onChangeSort: (sort: TaskSortOption) => void;
  onOpenNewTask: () => void;
  onInlineAddTask?: (data: InlineTaskData) => Promise<void>;
  onSelectTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onToggleStar: (taskId: string, isStarred: boolean) => void;
  onDeleteTask?: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onReorderTasks?: (tasks: { id: string; position: number }[]) => Promise<void>;
  onCreateSubtask?: (taskId: string, title: string) => void;
  onToggleSubtaskComplete?: (subtaskId: string, completed: boolean) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  onOpenCreateList?: () => void;
  onRenameList?: () => void;
  onDeleteList?: () => void;
  onDeleteCompleted?: () => void;
  isDefaultList?: boolean;
  isAddingTask?: boolean;
  onToggleAddingTask?: (adding: boolean) => void;
}

export const WebTaskCard: React.FC<WebTaskCardProps> = ({
  listId,
  listName,
  tasks,
  lists = [],
  selectedTaskId,
  searchQuery,
  sortBy,
  onChangeSort,
  onInlineAddTask,
  onSelectTask,
  onToggleComplete,
  onToggleStar,
  onDeleteTask,
  onUpdateTask,
  onReorderTasks,
  onCreateSubtask,
  onToggleSubtaskComplete,
  onDeleteSubtask,
  onOpenCreateList,
  onRenameList,
  onDeleteList,
  onDeleteCompleted,
  isDefaultList = false,
  isAddingTask: externalIsAdding,
  onToggleAddingTask,
}) => {
  const [internalIsAdding, setInternalIsAdding] = useState(false);
  const isInlineAdding = externalIsAdding !== undefined ? externalIsAdding : internalIsAdding;

  const setIsInlineAdding = (val: boolean) => {
    if (onToggleAddingTask) {
      onToggleAddingTask(val);
    } else {
      setInternalIsAdding(val);
    }
  };

  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineNotes, setInlineNotes] = useState('');
  const [inlineDueDate, setInlineDueDate] = useState<string>('');
  const [inlineDueTime, setInlineDueTime] = useState<string>('');
  const [inlineRecurrence, setInlineRecurrence] = useState<RecurrenceRule | null>(null);

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [isInlineRepeatMenuOpen, setIsInlineRepeatMenuOpen] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const inlineRepeatRef = useRef<HTMLDivElement>(null);
  const inlineTitleInputRef = useRef<HTMLInputElement>(null);
  const inlineFormRef = useRef<HTMLFormElement>(null);

  const inlineTitleRef = useRef(inlineTitle);
  inlineTitleRef.current = inlineTitle;
  const inlineNotesRef = useRef(inlineNotes);
  inlineNotesRef.current = inlineNotes;
  const inlineDueDateRef = useRef(inlineDueDate);
  inlineDueDateRef.current = inlineDueDate;
  const inlineDueTimeRef = useRef(inlineDueTime);
  inlineDueTimeRef.current = inlineDueTime;
  const inlineRecurrenceRef = useRef(inlineRecurrence);
  inlineRecurrenceRef.current = inlineRecurrence;

  const isStarredList = listId === 'starred';
  const isAllTasks = listId === 'all';

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const tomorrowStr = useMemo(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'), []);

  // Click outside to close three-dots menu or auto-save inline task
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
      if (inlineRepeatRef.current && !inlineRepeatRef.current.contains(e.target as Node)) {
        setIsInlineRepeatMenuOpen(false);
      }

      // If date picker modal or repeat modal is currently open, don't auto-save yet
      if (isDatePickerOpen || isRepeatModalOpen) {
        return;
      }

      // Clicking outside the inline form -> Auto save if title is present, just like Google Tasks!
      if (inlineFormRef.current && !inlineFormRef.current.contains(e.target as Node)) {
        const titleToSave = inlineTitleRef.current.trim();
        if (titleToSave && onInlineAddTask) {
          onInlineAddTask({
            title: titleToSave,
            notes: inlineNotesRef.current.trim() || undefined,
            dueDate: inlineDueDateRef.current || undefined,
            dueTime: inlineDueTimeRef.current || undefined,
            isRecurring: Boolean(inlineRecurrenceRef.current),
            recurrence: inlineRecurrenceRef.current || undefined,
          });
          setInlineTitle('');
          setInlineNotes('');
          setInlineDueDate('');
          setInlineDueTime('');
          setInlineRecurrence(null);
          setIsInlineAdding(false);
        } else {
          setIsInlineAdding(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDatePickerOpen, isRepeatModalOpen, onInlineAddTask]);

  // Auto focus Title input when inline adding is triggered
  useEffect(() => {
    if (isInlineAdding) {
      setTimeout(() => {
        inlineTitleInputRef.current?.focus();
      }, 50);
    }
  }, [isInlineAdding]);

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

  const handleInlineSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineTitle.trim()) {
      setIsInlineAdding(false);
      return;
    }

    if (onInlineAddTask) {
      await onInlineAddTask({
        title: inlineTitle.trim(),
        notes: inlineNotes.trim() || undefined,
        dueDate: inlineDueDate || undefined,
        dueTime: inlineDueTime || undefined,
        isRecurring: Boolean(inlineRecurrence),
        recurrence: inlineRecurrence || undefined,
      });

      // Reset form fields and maintain focus for rapid entry
      setInlineTitle('');
      setInlineNotes('');
      setInlineDueDate('');
      setInlineDueTime('');
      setInlineRecurrence(null);
      inlineTitleInputRef.current?.focus();
    }
  };

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

  return (
    <div className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#DADCE0] dark:border-[#3C4043] w-full max-w-[720px] h-auto min-h-[380px] max-h-[calc(100vh-100px)] flex flex-col pt-3 pb-3 transition-all relative overflow-hidden">
      {/* Top subtle grab handle pill matching screenshot */}
      <div className="shrink-0 w-9 h-1 bg-[#DADCE0] dark:bg-[#3C4043] rounded-full mx-auto mb-2.5" />

      {/* 1. Header: List Title + Sort & Three Dots (⋮) Menu */}
      <div className="shrink-0 flex items-center justify-between px-6 mb-3 pb-1">
        <h2 className="text-lg font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
          {isStarredList ? 'Starred tasks' : isAllTasks ? 'All tasks' : listName}
        </h2>

        <div className="flex items-center gap-1">
          {/* Sort Menu Button (↕) */}
          <TaskSortMenu currentSort={sortBy} onChangeSort={onChangeSort} />

          {/* Three Dots Button (⋮) with Dropdown */}
          {!isStarredList && !isAllTasks && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 rounded-full text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F1F3F4] dark:hover:bg-[#282A2C] transition-colors cursor-pointer"
                title="List options"
                aria-label="List options"
              >
                <MoreVertical size={18} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-[#282A2C] rounded-2xl shadow-xl border border-[#DADCE0] dark:border-[#3C4043] py-2 z-50 animate-in fade-in zoom-in-95">
                  {onRenameList && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onRenameList();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#3C4043] dark:text-[#E8EAED] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                    >
                      Rename list
                    </button>
                  )}

                  {!isDefaultList && onDeleteList && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDeleteList();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#D93025] hover:bg-[#FCE8E6] dark:hover:bg-[#3C1E1E] transition-colors cursor-pointer"
                    >
                      Delete list
                    </button>
                  )}

                  {completedTasks.length > 0 && onDeleteCompleted && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDeleteCompleted();
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[#3C4043] dark:text-[#E8EAED] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer border-t border-[#F1F3F4] dark:border-[#3C4043]"
                    >
                      Delete all completed tasks
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. "Add a task" / "Add a starred task" Button: Blue text and icon only, NO background pill (Matching user screenshot) */}
      <div className="shrink-0 mb-3 px-6">
        <button
          type="button"
          onClick={() => setIsInlineAdding(!isInlineAdding)}
          className="inline-flex items-center gap-2.5 px-0 py-1 bg-transparent text-[#0B57D0] dark:text-[#8AB4F8] hover:opacity-80 transition-opacity cursor-pointer select-none font-medium text-sm text-left"
        >
          {/* Blue circle checkmark with plus icon */}
          <div className="w-5 h-5 rounded-full border-2 border-[#0B57D0] dark:border-[#8AB4F8] flex items-center justify-center relative shrink-0">
            <Check size={11} strokeWidth={2.8} className="text-[#0B57D0] dark:text-[#8AB4F8]" />
            <span className="absolute -top-1 -right-1 text-[9px] font-bold text-[#0B57D0] dark:text-[#8AB4F8] leading-none">+</span>
          </div>
          <span>{isStarredList ? 'Add a starred task' : 'Add a task'}</span>
        </button>
      </div>

      {/* 3. Inline Task Creation: Full rectangle spanning edge-to-edge with NO border-radius (Matching user screenshot) */}
      {isInlineAdding && (
        <form
          ref={inlineFormRef}
          onSubmit={handleInlineSubmit}
          className="shrink-0 px-6 py-3.5 bg-[#F0F4F9] dark:bg-[#282A2C] rounded-none flex flex-col gap-2.5 mb-2 transition-all"
        >
          {/* Row 1: Radio outline circle + Title input */}
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#5F6368] dark:border-[#9AA0A6] shrink-0" />
            <input
              ref={inlineTitleInputRef}
              type="text"
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInlineSubmit();
                } else if (e.key === 'Escape') {
                  setIsInlineAdding(false);
                }
              }}
              placeholder="Title"
              className="flex-1 bg-transparent border-none outline-none text-sm font-normal text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#5F6368] dark:placeholder-[#9AA0A6]"
            />
          </div>

          {/* Row 2: 3-lines icon + Details input */}
          <div className="flex items-center gap-2.5 pl-8">
            <div className="flex flex-col gap-0.5 justify-center w-3.5 text-[#5F6368] dark:text-[#9AA0A6] shrink-0">
              <div className="h-0.5 bg-current rounded-full w-3.5" />
              <div className="h-0.5 bg-current rounded-full w-2.5" />
              <div className="h-0.5 bg-current rounded-full w-3" />
            </div>
            <input
              type="text"
              value={inlineNotes}
              onChange={(e) => setInlineNotes(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInlineSubmit();
                }
              }}
              placeholder="Details"
              className="flex-1 bg-transparent border-none outline-none text-xs font-normal text-[#444746] dark:text-[#C4C7C5] placeholder-[#5F6368] dark:placeholder-[#9AA0A6]"
            />
          </div>

          {/* Row 3: Quick chips & Repeat icon */}
          <div className="flex items-center justify-between pl-8 pt-0.5">
            {/* Left Chips: Today, Tomorrow, Clock */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Today Chip */}
              <button
                type="button"
                onClick={() => setInlineDueDate(inlineDueDate === todayStr ? '' : todayStr)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none ${
                  inlineDueDate === todayStr
                    ? 'bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] dark:bg-[#1A3A60] dark:border-[#8AB4F8] dark:text-[#8AB4F8]'
                    : 'bg-white dark:bg-[#1E1F20] border-[#DADCE0] dark:border-[#3C4043] text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F8FAFD] dark:hover:bg-[#282A2C]'
                }`}
              >
                Today
              </button>

              {/* Tomorrow Chip */}
              <button
                type="button"
                onClick={() => setInlineDueDate(inlineDueDate === tomorrowStr ? '' : tomorrowStr)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer select-none ${
                  inlineDueDate === tomorrowStr
                    ? 'bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] dark:bg-[#1A3A60] dark:border-[#8AB4F8] dark:text-[#8AB4F8]'
                    : 'bg-white dark:bg-[#1E1F20] border-[#DADCE0] dark:border-[#3C4043] text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F8FAFD] dark:hover:bg-[#282A2C]'
                }`}
              >
                Tomorrow
              </button>

              {/* Clock Button for Custom Date/Time */}
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className={`p-1.5 rounded-full border transition-colors cursor-pointer flex items-center justify-center ${
                  inlineDueDate && inlineDueDate !== todayStr && inlineDueDate !== tomorrowStr
                    ? 'bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] dark:bg-[#1A3A60] dark:border-[#8AB4F8] dark:text-[#8AB4F8]'
                    : 'bg-white dark:bg-[#1E1F20] border-[#DADCE0] dark:border-[#3C4043] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F8FAFD] dark:hover:bg-[#282A2C]'
                }`}
                title="Set date and time"
                aria-label="Set date and time"
              >
                <Clock size={13} />
              </button>
            </div>

            {/* Right Side: Repeat icon + Dropdown / Badge */}
            <div className="relative flex items-center gap-2" ref={inlineRepeatRef}>
              {inlineRecurrence ? (
                <div className="flex items-center gap-1.5 bg-[#E8F0FE] dark:bg-[#1A3A60] border border-[#1A73E8] dark:border-[#8AB4F8] text-[#1A73E8] dark:text-[#8AB4F8] px-2.5 py-0.5 rounded-full text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setIsInlineRepeatMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <Repeat size={12} />
                    <span>{formatRecurrenceRule(inlineRecurrence)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInlineRecurrence(null)}
                    className="p-0.5 hover:bg-[#1A73E8]/20 rounded-full cursor-pointer ml-0.5"
                    title="Remove repeat"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsInlineRepeatMenuOpen((prev) => !prev)}
                  className="p-1.5 rounded-full hover:bg-white/70 dark:hover:bg-[#3C4043] text-[#5F6368] dark:text-[#9AA0A6] transition-colors cursor-pointer"
                  title="Repeat rule"
                  aria-label="Repeat rule"
                >
                  <Repeat size={15} />
                </button>
              )}

              {/* Quick Repeat Dropdown: Daily, Weekly, Monthly, Custom */}
              {isInlineRepeatMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#282A2C] rounded-2xl shadow-xl border border-[#DADCE0] dark:border-[#3C4043] py-1.5 z-50 text-sm animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      const curDate = inlineDueDate ? new Date(inlineDueDate) : new Date();
                      setInlineRecurrence({
                        frequency: 'day',
                        interval: 1,
                        startDate: inlineDueDate || todayStr,
                        endType: 'never',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                      });
                      setIsInlineRepeatMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const curDate = inlineDueDate ? new Date(inlineDueDate) : new Date();
                      setInlineRecurrence({
                        frequency: 'week',
                        interval: 1,
                        weekdays: [curDate.getDay()],
                        startDate: inlineDueDate || todayStr,
                        endType: 'never',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                      });
                      setIsInlineRepeatMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const curDate = inlineDueDate ? new Date(inlineDueDate) : new Date();
                      setInlineRecurrence({
                        frequency: 'month',
                        interval: 1,
                        monthlyMode: 'day_of_month',
                        dayOfMonth: curDate.getDate(),
                        startDate: inlineDueDate || todayStr,
                        endType: 'never',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                      });
                      setIsInlineRepeatMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                  >
                    Monthly
                  </button>
                  <div className="my-1 border-t border-[#F1F3F4] dark:border-[#3C4043]" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsInlineRepeatMenuOpen(false);
                      setIsRepeatModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                  >
                    Custom...
                  </button>
                  {inlineRecurrence && (
                    <button
                      type="button"
                      onClick={() => {
                        setInlineRecurrence(null);
                        setIsInlineRepeatMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[#D93025] hover:bg-[#FCE8E6] dark:hover:bg-[#3C1E1E] transition-colors cursor-pointer"
                    >
                      Does not repeat
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>
      )}

      {/* Date & Time Picker Modal */}
      {isDatePickerOpen && (
        <GoogleDatePickerModal
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          initialDate={inlineDueDate || todayStr}
          initialTime={inlineDueTime}
          initialRecurrence={inlineRecurrence}
          onSave={({ date, time, recurrence }) => {
            setInlineDueDate(date);
            setInlineDueTime(time);
            if (recurrence) setInlineRecurrence(recurrence);
            setIsDatePickerOpen(false);
          }}
        />
      )}

      {/* Repeat Rule Modal */}
      {isRepeatModalOpen && (
        <RepeatModal
          isOpen={isRepeatModalOpen}
          onClose={() => setIsRepeatModalOpen(false)}
          currentRule={inlineRecurrence}
          onSave={(rule) => {
            setInlineRecurrence(rule as any);
            setIsRepeatModalOpen(false);
          }}
        />
      )}

      {/* 4. Empty State (Matching user screenshot) */}
      {hasNoTasks ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 px-6 text-center select-none">
          {isStarredList ? (
            <EmptyStarred />
          ) : (
            <>
              {/* Pastel illustration */}
              <div className="mb-6 flex justify-center">
                <WebEmptyIllustration className="w-48 h-32" />
              </div>
              <h3 className="text-base font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] mb-1.5">
                No tasks yet
              </h3>
              <p className="text-xs text-[#444746] dark:text-[#9AA0A6] max-w-xs leading-relaxed">
                Add your to-dos and keep track of them across Google Workspace
              </p>
            </>
          )}
        </div>
      ) : (
        /* 5. Scrollable Active Tasks List - Flush scrollbar on the right edge */
        <div className="flex-1 overflow-y-auto pl-3 pr-1 min-h-0 flex flex-col gap-1 tasks-scrollbar">
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
                onCreateSubtask={onCreateSubtask}
                onToggleSubtaskComplete={onToggleSubtaskComplete}
                onDeleteSubtask={onDeleteSubtask}
                onMoveToList={(taskId, targetListId) => {
                  if (onUpdateTask) onUpdateTask(taskId, { listId: targetListId });
                }}
                onOpenCreateList={onOpenCreateList}
                isDraggable={true}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                dropIndicator={dragOverTaskId === task.id ? dropPosition : null}
              />
            ))}

            {/* Drop at bottom drop zone when dragging */}
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

          {/* 6. Completed Tasks Accordion */}
          {completedTasks.length > 0 && (
            <div className="mt-4 border-t border-[#F1F3F4] dark:border-[#2B2C2F] pt-2">
              <button
                type="button"
                onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                className="flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#202124] dark:hover:text-[#E8EAED] py-2 transition-colors select-none cursor-pointer"
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
                      onCreateSubtask={onCreateSubtask}
                      onToggleSubtaskComplete={onToggleSubtaskComplete}
                      onDeleteSubtask={onDeleteSubtask}
                      onMoveToList={(taskId, targetListId) => {
                        if (onUpdateTask) onUpdateTask(taskId, { listId: targetListId });
                      }}
                      onOpenCreateList={onOpenCreateList}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
