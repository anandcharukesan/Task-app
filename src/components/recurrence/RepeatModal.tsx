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
  initialDueDate,
  initialDueTime,
  onSave,
  onRemove,
}) => {
  const today = getTodayDateString();

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
    if (initialRule) {
      setFrequency(initialRule.frequency || 'week');
      setInterval(initialRule.interval || 1);
      setWeekdays(initialRule.weekdays && initialRule.weekdays.length > 0 ? initialRule.weekdays : [new Date().getDay()]);
      setMonthlyMode(initialRule.monthlyMode || 'day_of_month');
      setDayOfMonth(initialRule.dayOfMonth || new Date().getDate());
      setWeekPosition(initialRule.weekPosition || 'first');
      setWeekday(initialRule.weekday !== undefined ? initialRule.weekday : new Date().getDay());
      setTime(initialRule.time || initialDueTime || '');
      setStartDate(initialRule.startDate || initialDueDate || today);
      setEndType(initialRule.endType || 'never');
      setEndDate(initialRule.endDate || '');
      setOccurrenceLimit(initialRule.occurrenceLimit || 5);
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
  }, [initialRule, initialDueDate, initialDueTime, isOpen, today]);

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
    <Modal isOpen={isOpen} onClose={onClose} title="Repeats" maxWidth="md">
      <div className="flex flex-col gap-6 text-[#202124] dark:text-[#E8EAED]">
        {/* Every Section */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6] mb-2 block">
            Every
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="99"
              value={interval}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-20 px-3 py-2 text-center text-sm font-medium bg-white dark:bg-[#202124] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] dark:focus:border-[#8AB4F8]"
            />
            <div className="relative flex-1">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                className="w-full appearance-none px-3.5 py-2 pr-9 text-sm bg-white dark:bg-[#202124] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] dark:focus:border-[#8AB4F8] capitalize cursor-pointer"
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
        </div>

        {/* Weekly Day Selector */}
        {frequency === 'week' && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6] mb-1 block">
              Repeats on
            </label>
            <WeekdaySelector selectedDays={weekdays} onChange={setWeekdays} />
          </div>
        )}

        {/* Monthly Pattern Selector */}
        {frequency === 'month' && (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6] mb-1 block">
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

        {/* Set Time (Optional) */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6] mb-2 flex items-center gap-1.5">
            <Clock size={14} />
            Set time (optional)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="px-3 py-2 text-sm bg-white dark:bg-[#202124] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] dark:focus:border-[#8AB4F8]"
            />
            {time && (
              <button
                type="button"
                onClick={() => setTime('')}
                className="text-xs text-[#5F6368] hover:text-[#D93025] dark:text-[#9AA0A6] underline px-2 py-1"
              >
                Clear time
              </button>
            )}
          </div>
        </div>

        {/* Starts */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6] mb-2 flex items-center gap-1.5">
            <Calendar size={14} />
            Starts
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-[#202124] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] dark:focus:border-[#8AB4F8]"
          />
        </div>

        {/* Ends */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] dark:text-[#9AA0A6] mb-3 block">
            Ends
          </label>
          <div className="flex flex-col gap-3">
            {/* Never */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="end-condition"
                checked={endType === 'never'}
                onChange={() => setEndType('never')}
                className="w-4 h-4 text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
              />
              <span className="text-sm font-medium">Never</span>
            </label>

            {/* On date */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer shrink-0">
                <input
                  type="radio"
                  name="end-condition"
                  checked={endType === 'on'}
                  onChange={() => setEndType('on')}
                  className="w-4 h-4 text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
                />
                <span className="text-sm font-medium">On</span>
              </label>
              <input
                type="date"
                value={endDate}
                disabled={endType !== 'on'}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-sm bg-white dark:bg-[#202124] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] disabled:opacity-40"
              />
            </div>

            {/* After occurrences */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer shrink-0">
                <input
                  type="radio"
                  name="end-condition"
                  checked={endType === 'after'}
                  onChange={() => setEndType('after')}
                  className="w-4 h-4 text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
                />
                <span className="text-sm font-medium">After</span>
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={occurrenceLimit}
                disabled={endType !== 'after'}
                onChange={(e) => setOccurrenceLimit(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-18 px-2.5 py-1 text-center text-sm bg-white dark:bg-[#202124] border border-[#DADCE0] dark:border-[#3C4043] rounded-lg focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] disabled:opacity-40"
              />
              <span className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">occurrences</span>
            </div>
          </div>
        </div>

        {/* Live Summary Text */}
        <div className="p-3 rounded-lg bg-[#F8F9FA] dark:bg-[#202124] border border-[#DADCE0] dark:border-[#3C4043] text-xs text-[#5F6368] dark:text-[#9AA0A6]">
          <span className="font-semibold text-[#202124] dark:text-[#E8EAED]">Summary: </span>
          {formatRecurrenceRule(currentRulePreview)}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#DADCE0] dark:border-[#3C4043]">
          {initialRule && onRemove ? (
            <Button
              variant="text"
              size="sm"
              icon={<Trash2 size={16} />}
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="text-[#D93025] dark:text-[#F28B82] hover:bg-[#FCE8E6] dark:hover:bg-[#5C2B29]"
            >
              Remove
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleDone}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
