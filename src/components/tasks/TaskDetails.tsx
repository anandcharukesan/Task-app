import React, { useState, useEffect } from 'react';
import { Task, Subtask } from '../../types/task';
import { TaskList } from '../../types/list';
import { RecurrenceRule } from '../../types/recurrence';
import { Checkbox } from '../common/Checkbox';
import { IconButton } from '../common/IconButton';
import { Button } from '../common/Button';
import { SubtaskItem } from './SubtaskItem';
import { RepeatModal } from '../recurrence/RepeatModal';
import { GoogleDatePickerModal } from '../common/GoogleDatePickerModal';
import { formatRecurrenceRule } from '../../lib/recurrence/recurrenceUtils';
import { getTodayDateString } from '../../lib/date/dateUtils';
import {
  Calendar,
  Clock,
  Repeat,
  Plus,
  Trash2,
  Folder,
  FastForward,
  X,
} from 'lucide-react';

interface TaskDetailsProps {
  task: Task | null;
  lists: TaskList[];
  subtasks: Subtask[];
  recurrence: RecurrenceRule | null;
  onClose: () => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<unknown>;
  onDeleteTask: (id: string) => Promise<unknown>;
  onToggleComplete: (id: string, completed: boolean) => Promise<unknown>;
  onSkipOccurrence?: (id: string) => Promise<unknown>;
  onSaveRecurrence: (taskId: string, rule: Omit<RecurrenceRule, 'taskId'>) => Promise<unknown>;
  onDeleteRecurrence: (taskId: string) => Promise<unknown>;
  onCreateSubtask: (taskId: string, title: string) => Promise<unknown>;
  onUpdateSubtask: (id: string, updates: Partial<Subtask>) => Promise<unknown>;
  onDeleteSubtask: (id: string) => Promise<unknown>;
}

export const TaskDetails: React.FC<TaskDetailsProps> = ({
  task,
  lists,
  subtasks,
  recurrence,
  onClose,
  onUpdateTask,
  onDeleteTask,
  onToggleComplete,
  onSkipOccurrence,
  onSaveRecurrence,
  onDeleteRecurrence,
  onCreateSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [listId, setListId] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setNotes(task.notes || '');
      setDueDate(task.dueDate || '');
      setDueTime(task.dueTime || '');
      setListId(task.listId || '');
    }
  }, [task]);

  if (!task) {
    return null;
  }

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
  };

  const handleDateChange = (date: string) => {
    setDueDate(date);
    onUpdateTask(task.id, { dueDate: date || null });
  };

  const handleTimeChange = (time: string) => {
    setDueTime(time);
    onUpdateTask(task.id, { dueTime: time || null });
  };

  const handleListChange = (newListId: string) => {
    setListId(newListId);
    onUpdateTask(task.id, { listId: newListId });
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    await onCreateSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#202124] text-[#202124] dark:text-[#E8EAED]">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#DADCE0] dark:border-[#3C4043]">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={task.completed}
            onChange={(checked) => onToggleComplete(task.id, checked)}
            aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          />
          <span className="text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6]">
            {task.completed ? 'Completed' : 'Mark completed'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <IconButton
            icon={<Trash2 size={18} />}
            aria-label="Delete task"
            onClick={() => {
              onDeleteTask(task.id);
              onClose();
            }}
            variant="ghost"
          />
          <IconButton
            icon={<X size={18} />}
            aria-label="Close task details"
            onClick={onClose}
            variant="ghost"
          />
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
        {/* Title */}
        <div>
          <textarea
            rows={2}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Title"
            className={`w-full text-lg font-medium bg-transparent border-none outline-none resize-none leading-snug ${
              task.completed ? 'line-through text-[#80868B] dark:text-[#9AA0A6]' : 'text-[#202124] dark:text-[#E8EAED]'
            }`}
          />
        </div>

        {/* List Assignment */}
        <div className="flex items-center gap-3 text-sm text-[#5F6368] dark:text-[#9AA0A6]">
          <Folder size={18} className="shrink-0 text-[#5F6368] dark:text-[#9AA0A6]" />
          <div className="flex-1">
            <select
              value={listId}
              onChange={(e) => handleListChange(e.target.value)}
              className="w-full text-xs font-medium bg-[#F8F9FA] dark:bg-[#292A2D] text-[#202124] dark:text-[#E8EAED] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg px-2.5 py-1.5 cursor-pointer outline-none focus:border-[#1A73E8]"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Time Section */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-3 text-sm">
            <Calendar size={18} className="shrink-0 text-[#5F6368] dark:text-[#9AA0A6]" />
            <div className="flex-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="text-xs px-2.5 py-1.5 bg-[#F8F9FA] dark:bg-[#292A2D] text-[#202124] dark:text-[#E8EAED] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg hover:border-[#1A73E8] cursor-pointer text-left"
              >
                {dueDate ? dueDate : 'Set date & time'}
                {dueTime ? ` at ${dueTime}` : ''}
              </button>
              {(dueDate || dueTime) && (
                <button
                  type="button"
                  onClick={() => {
                    handleDateChange('');
                    handleTimeChange('');
                  }}
                  className="text-xs text-[#5F6368] dark:text-[#9AA0A6] hover:text-[#D93025] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Repeat Section */}
        <div className="flex items-start gap-3 text-sm">
          <Repeat size={18} className="shrink-0 text-[#5F6368] dark:text-[#9AA0A6] mt-0.5" />
          <div className="flex-1">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsRepeatModalOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsRepeatModalOpen(true);
                }
              }}
              className="text-xs text-[#1A73E8] dark:text-[#8AB4F8] hover:underline cursor-pointer font-medium"
            >
              {task.isRecurring && recurrence
                ? formatRecurrenceRule(recurrence)
                : 'Repeat'}
            </div>

            {/* Skip occurrence button if recurring */}
            {task.isRecurring && onSkipOccurrence && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<FastForward size={14} />}
                  onClick={() => onSkipOccurrence(task.id)}
                  className="text-xs h-7 px-2.5"
                >
                  Skip this occurrence
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Subtasks Section */}
        <div className="flex flex-col gap-2 pt-2 border-t border-[#F1F3F4] dark:border-[#3C4043]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6]">
              Subtasks {subtasks.length > 0 ? `(${subtasks.filter((s) => s.completed).length}/${subtasks.length})` : ''}
            </span>
          </div>

          <div className="flex flex-col">
            {subtasks.map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onToggle={(completed) => onUpdateSubtask(subtask.id, { completed })}
                onUpdateTitle={(subTitle) => onUpdateSubtask(subtask.id, { title: subTitle })}
                onDelete={() => onDeleteSubtask(subtask.id)}
              />
            ))}
          </div>

          {isAddingSubtask ? (
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                autoFocus
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Subtask title"
                className="flex-1 text-xs px-2.5 py-1.5 bg-[#F8F9FA] dark:bg-[#292A2D] text-[#202124] dark:text-[#E8EAED] border border-[#1A73E8] rounded-md outline-none"
              />
              <Button type="submit" size="sm" variant="primary" className="h-7 text-xs px-2.5">
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="text"
                onClick={() => {
                  setIsAddingSubtask(false);
                  setNewSubtaskTitle('');
                }}
                className="h-7 text-xs px-2"
              >
                Cancel
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingSubtask(true)}
              className="inline-flex items-center gap-1.5 text-xs text-[#1A73E8] dark:text-[#8AB4F8] hover:bg-[#F1F3F4] dark:hover:bg-[#303134] py-1.5 px-2 rounded-md self-start transition-colors font-medium"
            >
              <Plus size={14} />
              <span>Add subtasks</span>
            </button>
          )}
        </div>

        {/* Details / Notes Section */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#F1F3F4] dark:border-[#3C4043]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6]">
            Details
          </span>
          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add details"
            className="w-full text-xs text-[#202124] dark:text-[#E8EAED] placeholder:text-[#80868B] dark:placeholder:text-[#9AA0A6] bg-[#F8F9FA] dark:bg-[#292A2D] p-3 rounded-lg border border-[#DADCE0] dark:border-[#3C4043] outline-none focus:border-[#1A73E8] resize-none"
          />
        </div>
      </div>

      {/* Repeat Modal */}
      {isRepeatModalOpen && (
        <RepeatModal
          isOpen={isRepeatModalOpen}
          onClose={() => setIsRepeatModalOpen(false)}
          initialRule={recurrence}
          initialDueDate={dueDate || getTodayDateString()}
          initialDueTime={dueTime || ''}
          onSave={async (rule) => {
            await onSaveRecurrence(task.id, rule);
            if (!dueDate) {
              await onUpdateTask(task.id, { dueDate: rule.startDate });
            }
            if (rule.time && !dueTime) {
              await onUpdateTask(task.id, { dueTime: rule.time });
            }
          }}
          onRemove={async () => {
            await onDeleteRecurrence(task.id);
          }}
        />
      )}

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
    </div>
  );
};
