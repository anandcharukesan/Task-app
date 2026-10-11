import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Star,
  MoreVertical,
  AlignLeft,
  Target,
  Clock,
  CornerDownRight,
  ChevronDown,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { Task, Subtask } from '../../types/task';
import { TaskList } from '../../types/list';
import { RecurrenceRule } from '../../types/recurrence';
import { GoogleDatePickerModal } from '../common/GoogleDatePickerModal';
import { formatRecurrenceRule } from '../../lib/recurrence/recurrenceUtils';

interface TaskDetailPageProps {
  task: Task | null;
  lists: TaskList[];
  subtasks: Subtask[];
  recurrence: RecurrenceRule | null;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<unknown>;
  onDeleteTask: (id: string) => Promise<unknown>;
  onToggleComplete: (id: string, completed: boolean) => Promise<unknown>;
  onToggleStar: (id: string, starred: boolean) => Promise<unknown>;
  onSaveRecurrence: (taskId: string, rule: Omit<RecurrenceRule, 'taskId'>) => Promise<unknown>;
  onDeleteRecurrence: (taskId: string) => Promise<unknown>;
  onCreateSubtask: (taskId: string, title: string) => Promise<unknown>;
  onUpdateSubtask: (id: string, updates: Partial<Subtask>) => Promise<unknown>;
  onDeleteSubtask: (id: string) => Promise<unknown>;
}

function formatDateBadge(dateStr: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTimeBadge(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export const TaskDetailPage: React.FC<TaskDetailPageProps> = ({
  task,
  lists,
  subtasks,
  recurrence,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onToggleComplete,
  onToggleStar,
  onSaveRecurrence,
  onDeleteRecurrence,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [deadline, setDeadline] = useState('');
  const [listId, setListId] = useState('');
  const [isListMenuOpen, setIsListMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isDeadlinePickerOpen, setIsDeadlinePickerOpen] = useState(false);

  // Subtask input
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setNotes(task.notes || '');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setDeadline(task.deadline || '');
      setListId(task.listId || '');
      setIsEditingNotes(Boolean(task.notes));
    }
  }, [task]);

  if (!task) return null;

  const currentList = lists.find((l) => l.id === listId) || lists[0] || { name: 'My Tasks', id: '' };

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      onUpdateTask(task.id, { title: title.trim() });
    } else {
      setTitle(task.title);
    }
  };

  const handleNotesBlur = () => {
    if (notes !== (task.notes || '')) {
      onUpdateTask(task.id, { notes: notes.trim() || null });
    }
    if (!notes.trim()) {
      setIsEditingNotes(false);
    }
  };

  const handleDeadlineChange = async (val: string) => {
    setDeadline(val);
    await onUpdateTask(task.id, { deadline: val || null });
  };

  const handleListChange = (newListId: string) => {
    setListId(newListId);
    setIsListMenuOpen(false);
    onUpdateTask(task.id, { listId: newListId });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await onCreateSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const isStarred = Boolean(task.isStarred);

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Top Header App Bar */}
      <div className="flex items-center justify-between px-3 py-3 sm:px-5">
        {/* Left: Back Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#2B2C2F] text-[#1F1F1F] dark:text-[#E3E3E3] transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={24} />
        </button>

        {/* Right: Star & More Menu */}
        <div className="flex items-center gap-1 relative">
          <button
            type="button"
            onClick={() => onToggleStar(task.id, !isStarred)}
            className="p-2.5 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#2B2C2F] text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
            aria-label={isStarred ? 'Unstar task' : 'Star task'}
          >
            <Star
              size={24}
              className={isStarred ? 'fill-[#F4B400] text-[#F4B400]' : ''}
            />
          </button>

          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="p-2.5 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#2B2C2F] text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
            aria-label="More options"
          >
            <MoreVertical size={24} />
          </button>

          {/* More Dropdown Menu */}
          {isMoreMenuOpen && (
            <div className="absolute top-12 right-0 z-30 bg-white dark:bg-[#2B2C2F] rounded-xl shadow-xl border border-[#DADCE0] dark:border-[#3C4043] py-1 min-w-[160px] animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onDeleteTask(task.id);
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <Trash2 size={18} />
                <span>Delete task</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-2 pb-36 max-w-xl mx-auto w-full flex flex-col gap-6">
        {/* List Name Dropdown Selector */}
        <div className="relative inline-block self-start">
          <button
            type="button"
            onClick={() => setIsListMenuOpen(!isListMenuOpen)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#747775] dark:text-[#8E918F] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer"
          >
            <span>{currentList.name}</span>
            <ChevronDown size={16} />
          </button>

          {/* List Selector Dropdown */}
          {isListMenuOpen && (
            <div className="absolute top-7 left-0 z-20 bg-white dark:bg-[#2B2C2F] shadow-xl rounded-xl border border-[#DADCE0] dark:border-[#3C4043] py-1 min-w-[180px] animate-in fade-in duration-150">
              {lists.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleListChange(l.id)}
                  className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    l.id === currentList.id
                      ? 'bg-[#E8F0FE] dark:bg-[#3C4043] text-[#1A73E8] dark:text-[#8AB4F8] font-semibold'
                      : 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#383A3C]'
                  }`}
                >
                  <span>{l.name}</span>
                  {l.id === currentList.id && <Check size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Task Title Input */}
        <div>
          <textarea
            rows={1}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Task title"
            className={`w-full text-[28px] sm:text-[32px] font-normal bg-transparent border-none outline-none resize-none leading-tight ${
              task.completed ? 'line-through text-[#747775] dark:text-[#8E918F]' : 'text-[#1F1F1F] dark:text-[#E3E3E3]'
            }`}
          />
        </div>

        {/* Action Rows */}
        <div className="flex flex-col gap-6 pt-1">
          {/* Row 1: Add Details / Notes */}
          <div className="flex items-start gap-5">
            <AlignLeft size={24} className="shrink-0 text-[#444746] dark:text-[#C4C7C5] mt-0.5" />
            <div className="flex-1">
              {isEditingNotes ? (
                <textarea
                  autoFocus
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Add details"
                  className="w-full text-[17px] text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-[#747775] dark:placeholder:text-[#8E918F] bg-transparent border-none outline-none resize-none leading-relaxed"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingNotes(true)}
                  className="text-[17px] text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer text-left w-full py-0.5"
                >
                  {notes ? (
                    <span className="text-[#1F1F1F] dark:text-[#E3E3E3] whitespace-pre-wrap">{notes}</span>
                  ) : (
                    'Add details'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Add Deadline */}
          <div className="flex items-center gap-5">
            <Target size={24} className="shrink-0 text-[#444746] dark:text-[#C4C7C5]" />
            <div className="flex-1 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsDeadlinePickerOpen(true)}
                className="text-[17px] text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer text-left py-0.5 flex-1"
              >
                {deadline ? (
                  <span className="text-[#1A73E8] dark:text-[#8AB4F8] font-medium">
                    Deadline: {formatDateBadge(deadline)}
                  </span>
                ) : (
                  'Add deadline'
                )}
              </button>

              {deadline && (
                <button
                  type="button"
                  onClick={() => handleDeadlineChange('')}
                  className="p-1 rounded-full text-[#747775] hover:text-[#1F1F1F] dark:hover:text-white cursor-pointer"
                  title="Remove deadline"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Row 3: Add Date / Time & Repeat */}
          <div className="flex items-center gap-5">
            <Clock size={24} className="shrink-0 text-[#444746] dark:text-[#C4C7C5]" />
            <div className="flex-1 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="text-[17px] text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer text-left py-0.5 flex-1"
              >
                {dueDate ? (
                  <span className="text-[#1A73E8] dark:text-[#8AB4F8] font-medium">
                    {formatDateBadge(dueDate)}
                    {dueTime ? `, ${formatTimeBadge(dueTime)}` : ''}
                    {task.isRecurring && recurrence ? ` • ⇄ ${formatRecurrenceRule(recurrence)}` : ''}
                  </span>
                ) : (
                  'Add date/time'
                )}
              </button>

              {(dueDate || dueTime) && (
                <button
                  type="button"
                  onClick={async () => {
                    setDueDate('');
                    setDueTime('');
                    await onUpdateTask(task.id, { dueDate: null, dueTime: null, isRecurring: false });
                    await onDeleteRecurrence(task.id);
                  }}
                  className="p-1 rounded-full text-[#747775] hover:text-[#1F1F1F] dark:hover:text-white cursor-pointer"
                  title="Remove date"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Row 4: Subtasks Section */}
          <div className="flex flex-col gap-3 pt-1">
            {/* Existing Subtasks */}
            {subtasks.map((st) => (
              <div key={st.id} className="flex items-center gap-4 py-1 group">
                <CornerDownRight size={22} className="shrink-0 text-[#444746] dark:text-[#C4C7C5]" />
                <button
                  type="button"
                  onClick={() => onUpdateSubtask(st.id, { completed: !st.completed })}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                    st.completed
                      ? 'border-[#1A73E8] bg-[#1A73E8] text-white'
                      : 'border-[#747775] hover:border-[#1F1F1F] dark:hover:border-white'
                  }`}
                >
                  {st.completed && <Check size={12} strokeWidth={3} />}
                </button>
                <input
                  type="text"
                  value={st.title}
                  onChange={(e) => onUpdateSubtask(st.id, { title: e.target.value })}
                  className={`flex-1 text-[17px] bg-transparent border-none outline-none ${
                    st.completed ? 'line-through text-[#747775] dark:text-[#8E918F]' : 'text-[#1F1F1F] dark:text-[#E3E3E3]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => onDeleteSubtask(st.id)}
                  className="p-1 text-[#747775] hover:text-red-500 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                  title="Delete subtask"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {/* Active Subtask Input */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-4 py-1">
              <CornerDownRight size={22} className="shrink-0 text-[#444746] dark:text-[#C4C7C5]" />
              <div className="w-5 h-5 rounded-full border-2 border-[#747775] shrink-0" />
              <input
                ref={subtaskInputRef}
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Enter title"
                className="flex-1 text-[17px] text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-[#747775] dark:placeholder:text-[#8E918F] bg-transparent border-none outline-none py-0.5"
              />
            </form>

            {/* Add Subtasks Button */}
            <button
              type="button"
              onClick={() => subtaskInputRef.current?.focus()}
              className="text-[17px] font-normal text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-[#E3E3E3] transition-colors cursor-pointer self-start ml-11 py-1"
            >
              Add subtasks
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Floating Mark Completed Pill */}
      <div className="fixed bottom-6 right-5 z-20">
        <button
          type="button"
          onClick={async () => {
            await onToggleComplete(task.id, !task.completed);
          }}
          className="rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] px-6 py-3.5 text-sm font-semibold shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          {task.completed ? 'Mark uncompleted' : 'Mark completed'}
        </button>
      </div>

      {/* Google Tasks Authentic Date, Time & Repeat Picker */}
      <GoogleDatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        initialDate={dueDate}
        initialTime={dueTime}
        initialRecurrence={recurrence}
        onSave={async (data) => {
          setDueDate(data.date);
          setDueTime(data.time);
          await onUpdateTask(task.id, {
            dueDate: data.date || null,
            dueTime: data.time || null,
            isRecurring: Boolean(data.recurrence),
          });
          if (data.recurrence) {
            await onSaveRecurrence(task.id, data.recurrence);
          } else if (task.isRecurring) {
            await onDeleteRecurrence(task.id);
          }
        }}
      />

      {/* Google Tasks Authentic Deadline Picker */}
      <GoogleDatePickerModal
        isOpen={isDeadlinePickerOpen}
        onClose={() => setIsDeadlinePickerOpen(false)}
        initialDate={deadline}
        onSave={async (data) => {
          await handleDeadlineChange(data.date);
        }}
      />
    </div>
  );
};
