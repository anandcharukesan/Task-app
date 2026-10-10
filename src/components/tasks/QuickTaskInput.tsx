import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Clock, Repeat, CornerDownLeft, AlignLeft } from 'lucide-react';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { RepeatModal } from '../recurrence/RepeatModal';
import { RecurrenceRule } from '../../types/recurrence';
import { formatRecurrenceRule } from '../../lib/recurrence/recurrenceUtils';
import { getTodayDateString } from '../../lib/date/dateUtils';

interface QuickTaskInputProps {
  listId: string;
  onAddTask: (data: {
    title: string;
    notes?: string;
    dueDate?: string;
    dueTime?: string;
    isRecurring?: boolean;
    recurrence?: Omit<RecurrenceRule, 'taskId'>;
  }) => Promise<unknown>;
}

export const QuickTaskInput: React.FC<QuickTaskInputProps> = ({
  listId: _listId,
  onAddTask,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<string>('');
  const [dueTime, setDueTime] = useState<string>('');
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<Omit<RecurrenceRule, 'taskId'> | null>(null);
  const [showNotesField, setShowNotesField] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded) {
      inputRef.current?.focus();
    }
  }, [isExpanded]);

  // Click outside collapses if empty
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !title.trim() &&
        !notes.trim() &&
        !dueDate &&
        !recurrenceRule &&
        !isRepeatModalOpen
      ) {
        setIsExpanded(false);
        setShowNotesField(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [title, notes, dueDate, recurrenceRule, isRepeatModalOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddTask({
        title: title.trim(),
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        isRecurring: Boolean(recurrenceRule),
        recurrence: recurrenceRule || undefined,
      });

      // Reset
      setTitle('');
      setNotes('');
      setDueDate('');
      setDueTime('');
      setRecurrenceRule(null);
      setShowNotesField(false);
      inputRef.current?.focus();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  if (!isExpanded) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(true);
          }
        }}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#292A2D] rounded-xl border border-[#DADCE0] dark:border-[#3C4043] shadow-xs hover:border-[#1A73E8] dark:hover:border-[#8AB4F8] text-[#5F6368] dark:text-[#9AA0A6] cursor-text transition-colors select-none"
      >
        <Plus size={20} className="text-[#1A73E8] dark:text-[#8AB4F8]" />
        <span className="text-sm font-medium">Add a task</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full bg-white dark:bg-[#292A2D] rounded-xl border border-[#1A73E8] dark:border-[#8AB4F8] shadow-md p-4 transition-all"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Title Input */}
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Title"
          className="w-full text-sm font-medium bg-transparent text-[#202124] dark:text-[#E8EAED] placeholder:text-[#80868B] dark:placeholder:text-[#9AA0A6] outline-none"
        />

        {/* Optional Notes Field */}
        {showNotesField ? (
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details"
            className="w-full text-xs bg-transparent text-[#202124] dark:text-[#E8EAED] placeholder:text-[#80868B] dark:placeholder:text-[#9AA0A6] outline-none resize-none"
          />
        ) : null}

        {/* Selected metadata indicators */}
        {(dueDate || recurrenceRule) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            {dueDate && (
              <span className="inline-flex items-center gap-1 text-[#1A73E8] dark:text-[#8AB4F8] font-medium">
                <Calendar size={12} />
                <span>{dueDate}</span>
                {dueTime && <span>· {dueTime}</span>}
                <button
                  type="button"
                  onClick={() => {
                    setDueDate('');
                    setDueTime('');
                  }}
                  className="ml-1 text-[#5F6368] hover:text-[#D93025]"
                >
                  ×
                </button>
              </span>
            )}

            {recurrenceRule && (
              <span className="inline-flex items-center gap-1 text-[#1A73E8] dark:text-[#8AB4F8] font-medium">
                <Repeat size={12} />
                <span>{formatRecurrenceRule({ ...recurrenceRule, taskId: '' })}</span>
                <button
                  type="button"
                  onClick={() => setRecurrenceRule(null)}
                  className="ml-1 text-[#5F6368] hover:text-[#D93025]"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Toolbar & Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F1F3F4] dark:border-[#3C4043]">
          <div className="flex items-center gap-1 text-[#5F6368] dark:text-[#9AA0A6]">
            {!showNotesField && (
              <IconButton
                icon={<AlignLeft size={16} />}
                aria-label="Add details"
                size="sm"
                onClick={() => setShowNotesField(true)}
              />
            )}

            {/* Quick Date Trigger */}
            <div className="relative flex items-center">
              <input
                type="date"
                id="quick-date-picker"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="sr-only"
              />
              <label htmlFor="quick-date-picker">
                <IconButton
                  icon={<Calendar size={16} />}
                  aria-label="Set due date"
                  size="sm"
                  onClick={() => {
                    const picker = document.getElementById('quick-date-picker') as HTMLInputElement;
                    picker?.showPicker ? picker.showPicker() : picker?.click();
                  }}
                />
              </label>
            </div>

            {/* Quick Time Trigger */}
            <div className="relative flex items-center">
              <input
                type="time"
                id="quick-time-picker"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="sr-only"
              />
              <label htmlFor="quick-time-picker">
                <IconButton
                  icon={<Clock size={16} />}
                  aria-label="Set due time"
                  size="sm"
                  onClick={() => {
                    const picker = document.getElementById('quick-time-picker') as HTMLInputElement;
                    picker?.showPicker ? picker.showPicker() : picker?.click();
                  }}
                />
              </label>
            </div>

            {/* Repeat Trigger */}
            <IconButton
              icon={<Repeat size={16} />}
              aria-label="Repeat task"
              size="sm"
              onClick={() => setIsRepeatModalOpen(true)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="text"
              size="sm"
              onClick={() => {
                setIsExpanded(false);
                setTitle('');
                setNotes('');
                setDueDate('');
                setDueTime('');
                setRecurrenceRule(null);
                setShowNotesField(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!title.trim() || isSubmitting}
              icon={<CornerDownLeft size={14} />}
            >
              Save
            </Button>
          </div>
        </div>
      </form>

      {/* Repeat Modal */}
      {isRepeatModalOpen && (
        <RepeatModal
          isOpen={isRepeatModalOpen}
          onClose={() => setIsRepeatModalOpen(false)}
          initialDueDate={dueDate || getTodayDateString()}
          initialDueTime={dueTime || ''}
          initialRule={
            recurrenceRule
              ? {
                  ...recurrenceRule,
                  taskId: '',
                }
              : null
          }
          onSave={(rule) => {
            setRecurrenceRule(rule);
            if (!dueDate) {
              setDueDate(rule.startDate);
            }
            if (rule.time && !dueTime) {
              setDueTime(rule.time);
            }
          }}
          onRemove={() => setRecurrenceRule(null)}
        />
      )}
    </div>
  );
};
