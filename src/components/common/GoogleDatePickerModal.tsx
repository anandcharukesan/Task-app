import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Repeat as RepeatIcon, X, Check } from 'lucide-react';
import { RecurrenceRule } from '../../types/recurrence';
import { RepeatModal } from '../recurrence/RepeatModal';
import { formatRecurrenceRule } from '../../lib/recurrence/recurrenceUtils';

interface GoogleDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string; // 'YYYY-MM-DD'
  initialTime?: string; // 'HH:MM'
  initialRecurrence?: RecurrenceRule | null;
  onSave: (data: {
    date: string;
    time: string;
    recurrence: RecurrenceRule | null;
  }) => void;
}

const WEEKDAY_HEADERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function formatTimeDisplay(timeStr: string): string {
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

export const GoogleDatePickerModal: React.FC<GoogleDatePickerModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialTime,
  initialRecurrence,
  onSave,
}) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const parseInitialDate = () => {
    if (initialDate && initialDate.includes('-')) {
      const parts = initialDate.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return { year: y, month: m, date: d, formatted: initialDate };
      }
    }
    return {
      year: today.getFullYear(),
      month: today.getMonth(),
      date: today.getDate(),
      formatted: todayStr,
    };
  };

  const parsed = parseInitialDate();
  const [viewYear, setViewYear] = useState<number>(parsed.year);
  const [viewMonth, setViewMonth] = useState<number>(parsed.month);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(parsed.formatted);
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || '');
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(initialRecurrence || null);

  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [isRepeatMenuOpen, setIsRepeatMenuOpen] = useState(false);
  const [isCustomRepeatModalOpen, setIsCustomRepeatModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const p = parseInitialDate();
      setViewYear(p.year);
      setViewMonth(p.month);
      setSelectedDateStr(initialDate || p.formatted);
      setSelectedTime(initialTime || '');
      setRecurrence(initialRecurrence || null);
      setIsTimePickerOpen(false);
      setIsRepeatMenuOpen(false);
      setIsCustomRepeatModalOpen(false);
    }
  }, [isOpen, initialDate, initialTime, initialRecurrence]);

  if (!isOpen) return null;

  // Navigation: Next / Prev Month
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Month & Year display
  const monthName = new Date(viewYear, viewMonth, 1).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Calendar math
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayRaw = new Date(viewYear, viewMonth, 1).getDay();
  // Monday = 0 ... Sunday = 6
  const startDayOffset = (firstDayRaw + 6) % 7;

  const handleSelectDay = (dayNum: number) => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(
      2,
      '0'
    )}`;
    setSelectedDateStr(formatted);
  };

  const handleDone = () => {
    onSave({
      date: selectedDateStr,
      time: selectedTime,
      recurrence: recurrence,
    });
    onClose();
  };

  // Quick repeat presets
  const applyRepeatPreset = (type: 'none' | 'day' | 'week' | 'month' | 'year') => {
    if (type === 'none') {
      setRecurrence(null);
      setIsRepeatMenuOpen(false);
      return;
    }

    const curDate = selectedDateStr ? new Date(selectedDateStr) : new Date();
    const dayOfWeek = curDate.getDay();
    const dayOfMonth = curDate.getDate();

    const rule: RecurrenceRule = {
      taskId: '',
      frequency: type,
      interval: 1,
      weekdays: type === 'week' ? [dayOfWeek] : undefined,
      monthlyMode: type === 'month' ? 'day_of_month' : undefined,
      dayOfMonth: type === 'month' ? dayOfMonth : undefined,
      startDate: selectedDateStr || todayStr,
      endType: 'never',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    };
    setRecurrence(rule);
    setIsRepeatMenuOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Main Dialog Card */}
      <div className="relative w-full max-w-[340px] bg-[#F0F4F9] dark:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3] rounded-3xl shadow-2xl p-5 z-10 animate-in zoom-in-95 duration-200">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-4 px-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-full hover:bg-[#E0E2E7] dark:hover:bg-[#2E2F32] text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-sm font-semibold text-[#1F1F1F] dark:text-[#E3E3E3] tracking-wide">
            {monthName}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-full hover:bg-[#E0E2E7] dark:hover:bg-[#2E2F32] text-[#444746] dark:text-[#C4C7C5] transition-colors cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {WEEKDAY_HEADERS.map((day, idx) => (
            <div key={idx} className="text-xs font-semibold text-[#444746] dark:text-[#8E918F] py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-1 mb-4 text-center">
          {/* Empty offset days */}
          {Array.from({ length: startDayOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} className="w-8 h-8" />
          ))}

          {/* Month days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(
              2,
              '0'
            )}`;
            const isSelected = selectedDateStr === dayStr;
            const isToday = todayStr === dayStr;

            return (
              <div key={dayNum} className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`w-8 h-8 rounded-full text-xs flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] font-bold shadow-xs'
                      : isToday
                      ? 'text-[#1A73E8] dark:text-[#8AB4F8] font-bold hover:bg-[#E0E2E7] dark:hover:bg-[#2E2F32]'
                      : 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#E0E2E7] dark:hover:bg-[#2E2F32]'
                  }`}
                >
                  {dayNum}
                </button>
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-[#DDE1E8] dark:border-[#2D2E31] my-1" />

        {/* Set time Row */}
        <div className="py-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsTimePickerOpen(!isTimePickerOpen)}
              className="flex items-center gap-3 text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:opacity-80 transition-opacity cursor-pointer flex-1"
            >
              <Clock size={18} className="text-[#444746] dark:text-[#C4C7C5] shrink-0" />
              <span className={selectedTime ? 'font-medium text-[#1A73E8] dark:text-[#8AB4F8]' : ''}>
                {selectedTime ? formatTimeDisplay(selectedTime) : 'Set time'}
              </span>
            </button>

            {selectedTime && (
              <button
                type="button"
                onClick={() => setSelectedTime('')}
                className="p-1 rounded-full text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E0E2E7] dark:hover:bg-[#2E2F32] cursor-pointer"
                title="Clear time"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Expandable Time Picker */}
          {isTimePickerOpen && (
            <div className="mt-2.5 p-3 bg-white dark:bg-[#292A2D] rounded-xl border border-[#DDE1E8] dark:border-[#383A3C] flex flex-col gap-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#444746] dark:text-[#C4C7C5] font-medium">Custom time:</span>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-[#F0F4F9] dark:bg-[#1E1F20] px-2 py-1 rounded text-xs text-[#1F1F1F] dark:text-[#E3E3E3] border border-[#DADCE0] dark:border-[#3C4043] outline-none"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-[#F0F4F9] dark:border-[#3C4043]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTime('09:00');
                    setIsTimePickerOpen(false);
                  }}
                  className="text-left px-2 py-1 text-xs rounded hover:bg-[#F0F4F9] dark:hover:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3]"
                >
                  Morning (9:00 AM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTime('13:00');
                    setIsTimePickerOpen(false);
                  }}
                  className="text-left px-2 py-1 text-xs rounded hover:bg-[#F0F4F9] dark:hover:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3]"
                >
                  Afternoon (1:00 PM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTime('18:00');
                    setIsTimePickerOpen(false);
                  }}
                  className="text-left px-2 py-1 text-xs rounded hover:bg-[#F0F4F9] dark:hover:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3]"
                >
                  Evening (6:00 PM)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTime('20:00');
                    setIsTimePickerOpen(false);
                  }}
                  className="text-left px-2 py-1 text-xs rounded hover:bg-[#F0F4F9] dark:hover:bg-[#1E1F20] text-[#1F1F1F] dark:text-[#E3E3E3]"
                >
                  Night (8:00 PM)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#DDE1E8] dark:border-[#2D2E31] my-1" />

        {/* Repeat Row */}
        <div className="py-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsRepeatMenuOpen(!isRepeatMenuOpen)}
              className="flex items-center gap-3 text-sm text-[#1F1F1F] dark:text-[#E3E3E3] hover:opacity-80 transition-opacity cursor-pointer flex-1"
            >
              <RepeatIcon size={18} className="text-[#444746] dark:text-[#C4C7C5] shrink-0" />
              <span className={recurrence ? 'font-medium text-[#1A73E8] dark:text-[#8AB4F8]' : ''}>
                {recurrence ? formatRecurrenceRule(recurrence) : 'Repeat'}
              </span>
            </button>

            {recurrence && (
              <button
                type="button"
                onClick={() => setRecurrence(null)}
                className="p-1 rounded-full text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E0E2E7] dark:hover:bg-[#2E2F32] cursor-pointer"
                title="Clear recurrence"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Repeat Options Dropdown */}
          {isRepeatMenuOpen && (
            <div className="mt-2.5 p-1 bg-white dark:bg-[#292A2D] rounded-xl border border-[#DDE1E8] dark:border-[#383A3C] flex flex-col gap-0.5 animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => applyRepeatPreset('none')}
                className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-between ${
                  !recurrence ? 'bg-[#E8F0FE] dark:bg-[#3C4043] font-semibold text-[#1A73E8] dark:text-[#8AB4F8]' : 'text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#1E1F20]'
                }`}
              >
                <span>Does not repeat</span>
                {!recurrence && <Check size={14} />}
              </button>
              <button
                type="button"
                onClick={() => applyRepeatPreset('day')}
                className="w-full text-left px-3 py-1.5 text-xs rounded-lg text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#1E1F20]"
              >
                Every day
              </button>
              <button
                type="button"
                onClick={() => applyRepeatPreset('week')}
                className="w-full text-left px-3 py-1.5 text-xs rounded-lg text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#1E1F20]"
              >
                Every week
              </button>
              <button
                type="button"
                onClick={() => applyRepeatPreset('month')}
                className="w-full text-left px-3 py-1.5 text-xs rounded-lg text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#1E1F20]"
              >
                Every month
              </button>
              <button
                type="button"
                onClick={() => applyRepeatPreset('year')}
                className="w-full text-left px-3 py-1.5 text-xs rounded-lg text-[#1F1F1F] dark:text-[#E3E3E3] hover:bg-[#F0F4F9] dark:hover:bg-[#1E1F20]"
              >
                Every year
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRepeatMenuOpen(false);
                  setIsCustomRepeatModalOpen(true);
                }}
                className="w-full text-left px-3 py-1.5 text-xs rounded-lg text-[#1A73E8] dark:text-[#8AB4F8] font-medium hover:bg-[#F0F4F9] dark:hover:bg-[#1E1F20] border-t border-[#F0F4F9] dark:border-[#3C4043] mt-1 pt-1.5"
              >
                Custom...
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-end gap-3 pt-3 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-sm font-semibold text-[#1A73E8] dark:text-[#8AB4F8] hover:bg-[#E0E2E7] dark:hover:bg-[#2E2F32] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="px-3.5 py-1.5 text-sm font-semibold text-[#1A73E8] dark:text-[#8AB4F8] hover:bg-[#E0E2E7] dark:hover:bg-[#2E2F32] rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Advanced Custom Repeat Modal if clicked Custom... */}
      {isCustomRepeatModalOpen && (
        <RepeatModal
          isOpen={isCustomRepeatModalOpen}
          onClose={() => setIsCustomRepeatModalOpen(false)}
          initialRule={recurrence}
          initialDueDate={selectedDateStr}
          initialDueTime={selectedTime}
          onSave={(rule) => {
            setRecurrence({
              ...rule,
              taskId: '',
            });
            setIsCustomRepeatModalOpen(false);
          }}
          onRemove={() => {
            setRecurrence(null);
            setIsCustomRepeatModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
