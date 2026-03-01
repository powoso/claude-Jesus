'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from './Modal';
import { useTranslation } from '@/lib/i18n';

interface CalendarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  maxDate?: Date;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function CalendarPicker({ isOpen, onClose, selectedDate, onSelectDate, maxDate }: CalendarPickerProps) {
  const { t } = useTranslation();
  const c = t.calendar;

  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  const today = useMemo(() => new Date(), []);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(viewYear, viewMonth, i),
        isCurrentMonth: true,
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(viewYear, viewMonth + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleSelect = (date: Date) => {
    if (maxDate && date > maxDate) return;
    onSelectDate(date);
    onClose();
  };

  const isDisabled = (date: Date) => {
    return !!(maxDate && date > maxDate);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={c.goToDate}>
      {/* Month/Year Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label={c.previousMonth}
        >
          <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
        </button>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">
          {c.months[viewMonth]} {viewYear}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label={c.nextMonth}
        >
          <ChevronRight size={20} className="text-[var(--text-secondary)]" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 mb-2">
        {c.days.map(day => (
          <div key={day} className="text-center text-xs font-medium text-[var(--text-muted)] py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ date, isCurrentMonth }, i) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          const disabled = isDisabled(date);

          return (
            <motion.button
              key={i}
              whileTap={disabled ? {} : { scale: 0.9 }}
              onClick={() => handleSelect(date)}
              disabled={disabled}
              className={`
                relative h-10 rounded-lg text-sm font-medium transition-colors
                ${!isCurrentMonth ? 'text-[var(--text-muted)]/40' : ''}
                ${isCurrentMonth && !isSelected && !disabled ? 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]' : ''}
                ${isSelected ? 'bg-[var(--accent)] text-white' : ''}
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {date.getDate()}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Today Button */}
      <div className="mt-4 text-center">
        <button
          onClick={() => handleSelect(today)}
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          {c.goToToday}
        </button>
      </div>
    </Modal>
  );
}
