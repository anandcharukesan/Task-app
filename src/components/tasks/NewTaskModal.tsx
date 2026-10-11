import React, { useState, useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { AlignLeft, Clock, ChevronDown, X } from 'lucide-react';
import { TaskList } from '../../types/list';
import { RecurrenceRule } from '../../types/recurrence';
import { GoogleDatePickerModal } from '../common/GoogleDatePickerModal';
import { RepeatModal } from '../recurrence/RepeatModal';
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

export const NewTaskModal: React.FC<NewTaskModalProps> = ({
  isOpen,
  onClose,
  lists,
  defaultListId,
  onAddTask,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('15:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);
  const [showListPicker, setShowListPicker] = useState(false);
  const [selectedListId, setSelectedListId] = useState(defaultListId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const repeatDropdownRef = useRef<HTMLDivElement>(null);
  const listDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize values when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setNotes('');
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      setDueDate(todayStr);
      setDueTime('15:00');
      setIsAllDay(false);
      setRecurrenceRule(null);
      setShowRepeatDropdown(false);
      setShowListPicker(false);
      setSelectedListId(
        defaultListId === 'starred' || defaultListId === 'all'
          ? lists[0]?.id || ''
          : defaultListId
      );
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, defaultListId, lists]);

  // Click outside dropdowns to close them
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        repeatDropdownRef.current &&
        !repeatDropdownRef.current.contains(e.target as Node)
      ) {
        setShowRepeatDropdown(false);
      }
      if (
        listDropdownRef.current &&
        !listDropdownRef.current.contains(e.target as Node)
      ) {
        setShowListPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const currentList =
    lists.find((l) => l.id === selectedListId) ||
    lists[0] || { name: 'My Tasks', id: '' };

  const formattedDate = dueDate
    ? (() => {
        try {
          return format(parseISO(dueDate), 'd MMMM');
        } catch {
          return dueDate;
        }
      })()
    : format(new Date(), 'd MMMM');

  const recurrenceLabel = recurrenceRule
    ? formatRecurrenceRule(recurrenceRule)
    : 'Does not repeat';

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTask({
        title: title.trim(),
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined,
        dueTime: isAllDay ? undefined : dueTime || undefined,
        isStarred: false,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Modal Window - Matching Google Tasks Create Modal */}
      <div className="relative w-full max-w-[480px] bg-white dark:bg-[#282A2C] rounded-[28px] shadow-[0_4px_24px_rgba(0,0,0,0.25)] p-6 z-10 animate-in zoom-in-95 duration-150 flex flex-col gap-5">
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#444746] dark:text-[#C4C7C5] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
          title="Close"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Title Input with Google signature blue underline */}
          <div className="pr-8">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title"
              className="w-full text-xl font-normal text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#747775] dark:placeholder-[#8E918F] bg-transparent border-b-2 border-[#0B57D0] pb-2 outline-none transition-colors"
            />
          </div>

          {/* Row 1: Clock Icon + Date / Time / All day / Recurrence */}
          <div className="flex items-start gap-4">
            <Clock size={19} className="text-[#444746] dark:text-[#C4C7C5] mt-2 shrink-0" />

            <div className="flex-1 flex flex-col gap-2.5">
              {/* Date & Time Chips */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Date button */}
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(true)}
                  className="px-4 py-2 bg-[#EEF2F6] dark:bg-[#1E1F20] hover:bg-[#E3E8EF] dark:hover:bg-[#3C4043] text-[#1F1F1F] dark:text-[#E3E3E3] text-sm font-medium rounded-lg transition-colors cursor-pointer select-none"
                >
                  {formattedDate}
                </button>

                {/* Time button (hidden if all day) */}
                {!isAllDay && (
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(true)}
                    className="px-4 py-2 bg-[#EEF2F6] dark:bg-[#1E1F20] hover:bg-[#E3E8EF] dark:hover:bg-[#3C4043] text-[#1F1F1F] dark:text-[#E3E3E3] text-sm font-medium rounded-lg transition-colors cursor-pointer select-none"
                  >
                    {dueTime || '15:00'}
                  </button>
                )}
              </div>

              {/* All day Checkbox */}
              <label className="flex items-center gap-2.5 text-sm text-[#444746] dark:text-[#C4C7C5] select-none cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={isAllDay}
                  onChange={(e) => setIsAllDay(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0B57D0] border-[#747775] focus:ring-0 cursor-pointer"
                />
                <span>All day</span>
              </label>

              {/* Recurrence Dropdown Button */}
              <div className="relative" ref={repeatDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowRepeatDropdown(!showRepeatDropdown)}
                  className="px-3.5 py-2 bg-[#EEF2F6] dark:bg-[#1E1F20] hover:bg-[#E3E8EF] dark:hover:bg-[#3C4043] text-[#1F1F1F] dark:text-[#E3E3E3] text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-6 w-fit select-none"
                >
                  <span>{recurrenceLabel}</span>
                  <ChevronDown size={16} className="text-[#444746] dark:text-[#C4C7C5]" />
                </button>

                {/* Recurrence Options Popup */}
                {showRepeatDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-[#282A2C] rounded-2xl shadow-xl border border-[#DADCE0] dark:border-[#3C4043] py-1.5 z-50 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => {
                        setRecurrenceRule(null);
                        setShowRepeatDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                    >
                      Does not repeat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecurrenceRule({
                          frequency: 'day',
                          interval: 1,
                          startDate: dueDate || format(new Date(), 'yyyy-MM-dd'),
                          endType: 'never',
                          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        });
                        setShowRepeatDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const curDate = dueDate ? new Date(dueDate) : new Date();
                        setRecurrenceRule({
                          frequency: 'week',
                          interval: 1,
                          weekdays: [curDate.getDay()],
                          startDate: dueDate || format(new Date(), 'yyyy-MM-dd'),
                          endType: 'never',
                          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        });
                        setShowRepeatDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                    >
                      Weekly
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const curDate = dueDate ? new Date(dueDate) : new Date();
                        setRecurrenceRule({
                          frequency: 'month',
                          interval: 1,
                          monthlyMode: 'day_of_month',
                          dayOfMonth: curDate.getDate(),
                          startDate: dueDate || format(new Date(), 'yyyy-MM-dd'),
                          endType: 'never',
                          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                        });
                        setShowRepeatDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                    >
                      Monthly
                    </button>
                    <div className="my-1 border-t border-[#F1F3F4] dark:border-[#3C4043]" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowRepeatDropdown(false);
                        setIsRepeatModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043] transition-colors cursor-pointer"
                    >
                      Custom...
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: 3-lines Icon + Description Textarea */}
          <div className="flex items-start gap-4">
            <AlignLeft size={19} className="text-[#444746] dark:text-[#C4C7C5] mt-3 shrink-0" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add description"
              rows={3}
              className="flex-1 bg-[#EEF2F6] dark:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#747775] dark:placeholder-[#8E918F] text-sm rounded-xl p-3 border-none outline-none resize-none focus:ring-1 focus:ring-[#0B57D0] transition-shadow"
            />
          </div>

          {/* Row 3: List Icon + List Selector Dropdown */}
          <div className="flex items-start gap-4">
            {/* List Icon matching screenshot */}
            <div className="mt-2.5 shrink-0 text-[#444746] dark:text-[#C4C7C5]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="8" y1="4" x2="8" y2="20" />
                <line x1="3" y1="9.5" x2="21" y2="9.5" />
                <line x1="3" y1="14.5" x2="21" y2="14.5" />
              </svg>
            </div>

            <div className="relative" ref={listDropdownRef}>
              <button
                type="button"
                onClick={() => setShowListPicker(!showListPicker)}
                className="px-3.5 py-2 bg-[#EEF2F6] dark:bg-[#1E1F20] hover:bg-[#E3E8EF] dark:hover:bg-[#3C4043] text-[#1F1F1F] dark:text-[#E3E3E3] text-sm font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-6 w-fit select-none"
              >
                <span>{currentList.name}</span>
                <ChevronDown size={16} className="text-[#444746] dark:text-[#C4C7C5]" />
              </button>

              {/* List Selector Popup */}
              {showListPicker && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-[#282A2C] rounded-2xl shadow-xl border border-[#DADCE0] dark:border-[#3C4043] py-1.5 z-50 animate-in fade-in zoom-in-95">
                  {lists.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        setSelectedListId(l.id);
                        setShowListPicker(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${
                        l.id === currentList.id
                          ? 'bg-[#E8F0FE] dark:bg-[#3C4043] text-[#0B57D0] dark:text-[#8AB4F8] font-medium'
                          : 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043]'
                      }`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Right: Save Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                title.trim() && !isSubmitting
                  ? 'bg-[#0B57D0] text-white hover:bg-[#0842A0] cursor-pointer shadow-sm active:scale-95'
                  : 'bg-[#E0E2E6] dark:bg-[#3C4043] text-[#80868B] dark:text-[#747775] cursor-not-allowed'
              }`}
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* Date & Time Picker Modal */}
      {isDatePickerOpen && (
        <GoogleDatePickerModal
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          initialDate={dueDate || format(new Date(), 'yyyy-MM-dd')}
          initialTime={dueTime}
          initialRecurrence={recurrenceRule}
          onSave={({ date, time, recurrence }) => {
            setDueDate(date);
            if (time) setDueTime(time);
            if (recurrence) setRecurrenceRule(recurrence);
            setIsDatePickerOpen(false);
          }}
        />
      )}

      {/* Repeat Modal for custom recurrence */}
      {isRepeatModalOpen && (
        <RepeatModal
          isOpen={isRepeatModalOpen}
          onClose={() => setIsRepeatModalOpen(false)}
          currentRule={recurrenceRule}
          onSave={(rule) => {
            setRecurrenceRule(rule as any);
            setIsRepeatModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
