import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { WeekdaySelector } from './WeekdaySelector';
import { MonthlyRulePicker } from './MonthlyRulePicker';
import { RecurrenceRule, RecurrenceFrequency, EndCondition, MonthlyMode, WeekPosition } from '../../types/recurrence';
import { formatRecurrenceRule } from '../../lib/recurrence/recurrenceUtils';
import { getTodayDateString } from '../../lib/date/dateUtils';
import { Clock, Calendar, ChevronDown, Trash2 } from 'lucide-react';
import { parseISO } from 'date-fns';

interface RepeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRule?: RecurrenceRule | null;
  currentRule?: RecurrenceRule | null;
  initialDueDate?: string | null;
  initialDueTime?: string | null;
  onSave: (rule: Omit<RecurrenceRule, 'taskId'>) => void;
  onRemove?: () => void;
}

const FREQUENCIES: { label: string; value: RecurrenceFrequency }[] = [
  { label: 'day', value: 'day' },
  { label: 'week', value: 'week' },
  { label: 'month', value: 'month' },
  { label: 'year', value: 'year' },
  { label: 'hour', value: 'hour' },
  { label: 'minute', value: 'minute' },
];

export const RepeatModal: React.FC<RepeatModalProps> = ({
  isOpen,
  onClose,
  initialRule,
  currentRule,
  initialDueDate,
  initialDueTime,
  onSave,
  onRemove,
}) => {
  const today = getTodayDateString();
  const effectiveRule = initialRule || currentRule || null;

  const [frequency, setFrequency] = useState<RecurrenceFrequency>('week');
  const [interval, setInterval] = useState<number>(1);
  const [weekdays, setWeekdays] = useState<number[]>([new Date().getDay()]);
  const [monthlyMode, setMonthlyMode] = useState<MonthlyMode>('day_of_month');
  const [dayOfMonth, setDayOfMonth] = useState<number>(new Date().getDate());
  const [weekPosition, setWeekPosition] = useState<WeekPosition>('first');
  const [weekday, setWeekday] = useState<number>(new Date().getDay());
  const [time, setTime] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(today);
  const [endType, setEndType] = useState<EndCondition>('never');
  const [endDate, setEndDate] = useState<string>('');
  const [occurrenceLimit, setOccurrenceLimit] = useState<number>(5);

  useEffect(() => {
    if (effectiveRule) {
      setFrequency(effectiveRule.frequency || 'week');
      setInterval(effectiveRule.interval || 1);
      setWeekdays(effectiveRule.weekdays && effectiveRule.weekdays.length > 0 ? effectiveRule.weekdays : [new Date().getDay()]);
      setMonthlyMode(effectiveRule.monthlyMode || 'day_of_month');
      setDayOfMonth(effectiveRule.dayOfMonth || new Date().getDate());
      setWeekPosition(effectiveRule.weekPosition || 'first');
      setWeekday(effectiveRule.weekday !== undefined ? effectiveRule.weekday : new Date().getDay());
      setTime(effectiveRule.time || initialDueTime || '');
      setStartDate(effectiveRule.startDate || initialDueDate || today);
      setEndType(effectiveRule.endType || 'never');
      setEndDate(effectiveRule.endDate || '');
      setOccurrenceLimit(effectiveRule.occurrenceLimit || 5);
    } else {
      setFrequency('week');
      setInterval(1);
      const start = initialDueDate || today;
      let dayVal = 1; // Default Monday
      try {
        dayVal = parseISO(start).getDay();
      } catch {
        dayVal = new Date().getDay();
      }
      setWeekdays([dayVal]);
      setMonthlyMode('day_of_month');
      setDayOfMonth(new Date().getDate());
      setWeekPosition('first');
      setWeekday(dayVal);
      setTime(initialDueTime || '');
      setStartDate(start);
      setEndType('never');
      setEndDate('');
      setOccurrenceLimit(5);
    }
  }, [effectiveRule, initialDueDate, initialDueTime, isOpen, today]);

  const currentRulePreview: RecurrenceRule = {
    taskId: '',
    frequency,
    interval,
    weekdays,
    monthlyMode,
    dayOfMonth,
    weekPosition,
    weekday,
    time: time || undefined,
    startDate,
    endType,
    endDate: endType === 'on' ? endDate : undefined,
    occurrenceLimit: endType === 'after' ? occurrenceLimit : undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };

  const handleDone = () => {
    onSave({
      frequency,
      interval: Math.max(1, interval),
      weekdays: frequency === 'week' ? weekdays : undefined,
      monthlyMode: frequency === 'month' ? monthlyMode : undefined,
      dayOfMonth: frequency === 'month' && monthlyMode === 'day_of_month' ? dayOfMonth : undefined,
      weekPosition: frequency === 'month' && monthlyMode === 'weekday_position' ? weekPosition : undefined,
      weekday: frequency === 'month' && monthlyMode === 'weekday_position' ? weekday : undefined,
      time: time.trim() || undefined,
      startDate: startDate || today,
      endType,
      endDate: endType === 'on' ? endDate : undefined,
      occurrenceLimit: endType === 'after' ? Math.max(1, occurrenceLimit) : undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Repeats every" maxWidth="sm">
      <div className="flex flex-col gap-4 text-[#1F1F1F] dark:text-[#E3E3E3] pt-1">
        {/* Row 1: Interval input & Frequency dropdown */}
        <div className="flex items-center gap-2.5">
          <input
            type="number"
            min="1"
            max="99"
            value={interval}
            onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-16 px-2 py-2 text-center text-sm font-medium bg-[#F1F3F4] dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#8AB4F8]"
          />
          <div className="relative flex-1">
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
              className="w-full appearance-none px-3.5 py-2 pr-9 text-sm bg-[#F1F3F4] dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#8AB4F8] cursor-pointer"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {interval === 1 ? f.label : `${f.label}s`}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] dark:text-[#9AA0A6] pointer-events-none"
            />
          </div>
        </div>

        {/* Weekly Day Selector */}
        {frequency === 'week' && (
          <div>
            <label className="text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6] mb-1.5 block">
              Repeats on
            </label>
            <WeekdaySelector selectedDays={weekdays} onChange={setWeekdays} />
          </div>
        )}

        {/* Monthly Pattern Selector */}
        {frequency === 'month' && (
          <div>
            <label className="text-xs font-medium text-[#5F6368] dark:text-[#9AA0A6] mb-1.5 block">
              Monthly pattern
            </label>
            <MonthlyRulePicker
              monthlyMode={monthlyMode}
              dayOfMonth={dayOfMonth}
              weekPosition={weekPosition}
              weekday={weekday}
              onChangeMode={setMonthlyMode}
              onChangeDayOfMonth={setDayOfMonth}
              onChangeWeekPosition={setWeekPosition}
              onChangeWeekday={setWeekday}
            />
          </div>
        )}

        {/* Set Time Box */}
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-[#F1F3F4] dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg focus:outline-none focus:border-[#1A73E8] dark:focus:border-[#8AB4F8]"
            placeholder="Set time"
          />
          {time && (
            <button
              type="button"
              onClick={() => setTime('')}
              className="text-xs text-[#5F6368] hover:text-[#D93025] dark:text-[#9AA0A6] px-2 py-1 shrink-0"
            >
              Clear
            </button>
          )}
        </div>

        {/* Ends Section */}
        <div className="pt-1">
          <label className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] mb-3 block">
            Ends
          </label>
          <div className="flex flex-col gap-3">
            {/* Never */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="radio"
                name="end-condition"
                checked={endType === 'never'}
                onChange={() => setEndType('never')}
                className="w-4 h-4 text-[#1A73E8] focus:ring-0 cursor-pointer"
              />
              <span className="text-sm font-normal">Never</span>
            </label>

            {/* On */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer shrink-0 select-none">
                <input
                  type="radio"
                  name="end-condition"
                  checked={endType === 'on'}
                  onChange={() => setEndType('on')}
                  className="w-4 h-4 text-[#1A73E8] focus:ring-0 cursor-pointer"
                />
                <span className="text-sm font-normal">On</span>
              </label>
              <input
                type="date"
                value={endDate}
                disabled={endType !== 'on'}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm bg-[#F1F3F4] dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg focus:outline-none focus:border-[#1A73E8] disabled:opacity-40"
              />
            </div>

            {/* After */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer shrink-0 select-none">
                <input
                  type="radio"
                  name="end-condition"
                  checked={endType === 'after'}
                  onChange={() => setEndType('after')}
                  className="w-4 h-4 text-[#1A73E8] focus:ring-0 cursor-pointer"
                />
                <span className="text-sm font-normal">After</span>
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={occurrenceLimit}
                disabled={endType !== 'after'}
                onChange={(e) => setOccurrenceLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 px-2 py-1 text-center text-sm bg-[#F1F3F4] dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg focus:outline-none focus:border-[#1A73E8] disabled:opacity-40"
              />
              <span className="text-sm text-[#444746] dark:text-[#C4C7C5]">occurrences</span>
            </div>
          </div>
        </div>

        {/* Actions matching screenshot: Cancel & Done pill */}
        <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-[#F1F3F4] dark:border-[#3C4043]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-sm font-medium text-[#1A73E8] dark:text-[#A8C7FA] hover:bg-[#F1F3F4] dark:hover:bg-[#3C4043]/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="px-6 py-2 rounded-full text-sm font-medium bg-[#0B57D0] hover:bg-[#0842A0] dark:bg-[#A8C7FA] dark:hover:bg-[#8AB4F8] text-white dark:text-[#062E6F] transition-all cursor-pointer shadow-xs active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
