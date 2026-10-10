import React from 'react';

// Day mapping: 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 0 = Sun
const DAYS = [
  { label: 'M', value: 1, name: 'Monday' },
  { label: 'T', value: 2, name: 'Tuesday' },
  { label: 'W', value: 3, name: 'Wednesday' },
  { label: 'T', value: 4, name: 'Thursday' },
  { label: 'F', value: 5, name: 'Friday' },
  { label: 'S', value: 6, name: 'Saturday' },
  { label: 'S', value: 0, name: 'Sunday' },
];

interface WeekdaySelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

export const WeekdaySelector: React.FC<WeekdaySelectorProps> = ({
  selectedDays,
  onChange,
}) => {
  const toggleDay = (dayValue: number) => {
    if (selectedDays.includes(dayValue)) {
      // Keep at least one day selected
      if (selectedDays.length > 1) {
        onChange(selectedDays.filter((d) => d !== dayValue));
      }
    } else {
      onChange([...selectedDays, dayValue]);
    }
  };

  return (
    <div className="flex items-center justify-between gap-1.5 py-2">
      {DAYS.map(({ label, value, name }) => {
        const isSelected = selectedDays.includes(value);
        return (
          <button
            key={`${value}-${name}`}
            type="button"
            aria-label={name}
            aria-pressed={isSelected}
            onClick={() => toggleDay(value)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full font-medium text-xs sm:text-sm flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              isSelected
                ? 'bg-[#1A73E8] text-white shadow-xs dark:bg-[#8AB4F8] dark:text-[#202124]'
                : 'bg-transparent text-[#5F6368] dark:text-[#9AA0A6] border border-[#DADCE0] dark:border-[#3C4043] hover:bg-[#F1F3F4] dark:hover:bg-[#303134]'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
