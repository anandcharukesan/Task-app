import React from 'react';
import { MonthlyMode, WeekPosition } from '../../types/recurrence';

const WEEK_POSITIONS: { label: string; value: WeekPosition }[] = [
  { label: 'First', value: 'first' },
  { label: 'Second', value: 'second' },
  { label: 'Third', value: 'third' },
  { label: 'Fourth', value: 'fourth' },
  { label: 'Last', value: 'last' },
];

const WEEKDAYS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

interface MonthlyRulePickerProps {
  monthlyMode: MonthlyMode;
  dayOfMonth: number;
  weekPosition: WeekPosition;
  weekday: number;
  onChangeMode: (mode: MonthlyMode) => void;
  onChangeDayOfMonth: (day: number) => void;
  onChangeWeekPosition: (pos: WeekPosition) => void;
  onChangeWeekday: (day: number) => void;
}

export const MonthlyRulePicker: React.FC<MonthlyRulePickerProps> = ({
  monthlyMode,
  dayOfMonth,
  weekPosition,
  weekday,
  onChangeMode,
  onChangeDayOfMonth,
  onChangeWeekPosition,
  onChangeWeekday,
}) => {
  return (
    <div className="flex flex-col gap-3 py-2 text-sm">
      {/* Option 1: On day of month */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="radio"
          name="monthly-mode"
          checked={monthlyMode === 'day_of_month'}
          onChange={() => onChangeMode('day_of_month')}
          className="w-4 h-4 text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
        />
        <span className="text-[#202124] dark:text-[#E8EAED]">On day</span>
        <input
          type="number"
          min="1"
          max="31"
          value={dayOfMonth}
          disabled={monthlyMode !== 'day_of_month'}
          onChange={(e) => onChangeDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value, 10) || 1)))}
          className="w-16 px-2.5 py-1 text-center bg-white dark:bg-[#292A2D] border border-[#DADCE0] dark:border-[#3C4043] rounded-md text-[#202124] dark:text-[#E8EAED] disabled:opacity-50"
        />
        <span className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">of the month</span>
      </label>

      {/* Option 2: On Nth weekday */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-3 cursor-pointer shrink-0">
          <input
            type="radio"
            name="monthly-mode"
            checked={monthlyMode === 'weekday_position'}
            onChange={() => onChangeMode('weekday_position')}
            className="w-4 h-4 text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
          />
          <span className="text-[#202124] dark:text-[#E8EAED]">On the</span>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={weekPosition}
            disabled={monthlyMode !== 'weekday_position'}
            onChange={(e) => onChangeWeekPosition(e.target.value as WeekPosition)}
            className="px-2 py-1 bg-white dark:bg-[#292A2D] border border-[#DADCE0] dark:border-[#3C4043] rounded-md text-xs text-[#202124] dark:text-[#E8EAED] disabled:opacity-50"
          >
            {WEEK_POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={weekday}
            disabled={monthlyMode !== 'weekday_position'}
            onChange={(e) => onChangeWeekday(parseInt(e.target.value, 10))}
            className="px-2 py-1 bg-white dark:bg-[#292A2D] border border-[#DADCE0] dark:border-[#3C4043] rounded-md text-xs text-[#202124] dark:text-[#E8EAED] disabled:opacity-50"
          >
            {WEEKDAYS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
