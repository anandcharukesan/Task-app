import React, { useState, useEffect, useRef } from 'react';
import { AlignLeft, Clock, Star, ChevronDown, X } from 'lucide-react';
import { TaskList } from '../../types/list';
import { RecurrenceRule } from '../../types/recurrence';
import { GoogleDatePickerModal } from '../common/GoogleDatePickerModal';
import { formatRecurrenceRule } from '../../lib/recurrence/recurrenceUtils';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  lists: TaskList[];
  defaultListId: string;
  onAddTask: (data: {
    title: string;
    notes?: string;
    dueDate?: string;
    dueTime?: string;
    isStarred?: boolean;
    isRecurring?: boolean;
    recurrenceRule?: RecurrenceRule | null;
    listId: string;
  }) => Promise<unknown>;
}

function formatTaskDateBadge(dateStr: string): string {
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

function formatTaskTimeBadge(timeStr: string): string {
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

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  lists,
  defaultListId,
  onAddTask,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [selectedListId, setSelectedListId] = useState(defaultListId);
  const [showListPicker, setShowListPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setNotes('');
      setShowNotes(false);
      setDueDate('');
      setDueTime('');
      setRecurrenceRule(null);
      setIsDatePickerOpen(false);
      setIsStarred(false);
      setSelectedListId(defaultListId === 'starred' ? (lists[0]?.id || '') : defaultListId);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, defaultListId, lists]);

  if (!isOpen) return null;

  const currentList = lists.find((l) => l.id === selectedListId) || lists[0] || { name: 'My Tasks', id: '' };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTask({
        title: title.trim(),
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        isStarred,
        isRecurring: Boolean(recurrenceRule),
        recurrenceRule: recurrenceRule || undefined,
        listId: currentList.id,
      });
      onClose();
    } catch (err) {
      console.error('Error adding task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E1F20] rounded-t-3xl shadow-2xl p-4 sm:p-5 z-10 animate-in slide-in-from-bottom duration-250">
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          {/* Top: List Selector Dropdown */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowListPicker(!showListPicker)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#444746] dark:text-[#C4C7C5] bg-[#F0F4F9] dark:bg-[#2B2C2F] hover:bg-[#E3E3E3] dark:hover:bg-[#383A3C] rounded-full transition-colors cursor-pointer"
            >
              <span>{currentList.name}</span>
              <ChevronDown size={14} />
            </button>

            {/* List selector popup */}
            {showListPicker && (
              <div className="absolute top-8 left-0 z-20 bg-white dark:bg-[#2B2C2F] shadow-lg rounded-xl border border-[#DADCE0] dark:border-[#3C4043] py-1 min-w-[150px]">
                {lists.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setSelectedListId(l.id);
                      setShowListPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                      l.id === currentList.id
                        ? 'bg-[#E8F0FE] dark:bg-[#3C4043] text-[#1A73E8] dark:text-[#8AB4F8]'
                        : 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#383A3C]'
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New task input */}
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New task"
            className="w-full text-base text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-[#747775] dark:placeholder:text-[#8E918F] bg-transparent border-none outline-none py-1"
          />

          {/* Expandable Notes input */}
          {showNotes && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add details"
              rows={2}
              className="w-full text-xs text-[#1F1F1F] dark:text-[#E3E3E3] placeholder:text-[#747775] dark:placeholder:text-[#8E918F] bg-transparent border-none outline-none resize-none"
            />
          )}

          {/* Expandable Date & Repeat Pill Chip */}
          {dueDate && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#F0F4F9] dark:bg-[#2B2C2F] text-[#1A73E8] dark:text-[#8AB4F8] rounded-full text-xs font-medium self-start animate-in fade-in duration-150">
              <Clock size={13} className="shrink-0" />
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="hover:underline cursor-pointer"
              >
                {formatTaskDateBadge(dueDate)}
                {dueTime ? `, ${formatTaskTimeBadge(dueTime)}` : ''}
                {recurrenceRule ? ` • ⇄ ${formatRecurrenceRule(recurrenceRule)}` : ''}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDueDate('');
                  setDueTime('');
                  setRecurrenceRule(null);
                }}
                className="p-0.5 rounded-full hover:bg-[#E0E2E7] dark:hover:bg-[#383A3C] text-[#444746] dark:text-[#C4C7C5] ml-1 cursor-pointer"
                title="Remove date & repeat"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-[#F0F4F9] dark:border-[#2B2C2F] mt-1">
            {/* Left Icons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  showNotes || notes
                    ? 'bg-[#E8F0FE] dark:bg-[#2B2C2F] text-[#1A73E8] dark:text-[#8AB4F8]'
                    : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F0F4F9] dark:hover:bg-[#2B2C2F]'
                }`}
                title="Add details"
              >
                <AlignLeft size={18} />
              </button>

              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  dueDate
                    ? 'bg-[#E8F0FE] dark:bg-[#2B2C2F] text-[#1A73E8] dark:text-[#8AB4F8]'
                    : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F0F4F9] dark:hover:bg-[#2B2C2F]'
                }`}
                title="Set date, time & repeat"
              >
                <Clock size={18} />
              </button>

              <button
                type="button"
                onClick={() => setIsStarred(!isStarred)}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  isStarred
                    ? 'text-[#F4B400] fill-[#F4B400]'
                    : 'text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F0F4F9] dark:hover:bg-[#2B2C2F]'
                }`}
                title={isStarred ? 'Unstar task' : 'Star task'}
              >
                <Star
                  size={18}
                  className={isStarred ? 'fill-[#F4B400] text-[#F4B400]' : ''}
                />
              </button>
            </div>

            {/* Right Save Button */}
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                title.trim() && !isSubmitting
                  ? 'text-[#1A73E8] dark:text-[#8AB4F8] hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer'
                  : 'text-[#C4C7C5] dark:text-[#5F6368] cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Google Tasks Authentic Date & Time Picker Dialog (Screenshot) */}
      <GoogleDatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        initialDate={dueDate}
        initialTime={dueTime}
        initialRecurrence={recurrenceRule}
        onSave={(data) => {
          setDueDate(data.date);
          setDueTime(data.time);
          setRecurrenceRule(data.recurrence);
        }}
      />
    </div>
  );
};
