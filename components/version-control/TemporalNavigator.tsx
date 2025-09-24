'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar as CalendarViewIcon,
  ArrowLeft,
  ArrowRight,
  Target,
} from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils/cn';

interface TemporalNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onYearWeekChange?: (year: number, week: number) => void;
  planExists?: (date: Date) => boolean;
  isLoading?: boolean;
  showWeekView?: boolean;
  showCalendarView?: boolean;
  showQuickNav?: boolean;
}

export function TemporalNavigator({
  currentDate,
  onDateChange,
  onYearWeekChange,
  planExists,
  isLoading = false,
  showWeekView = true,
  showCalendarView = true,
  showQuickNav = true,
}: TemporalNavigatorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [yearWeekMode, setYearWeekMode] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(1);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const weeks = Array.from({ length: 53 }, (_, i) => i + 1);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev'
      ? subWeeks(currentDate, 1)
      : addWeeks(currentDate, 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const handleYearWeekGo = () => {
    if (onYearWeekChange) {
      onYearWeekChange(selectedYear, selectedWeek);
      setYearWeekMode(false);
    }
  };

  const getISOWeek = (date: Date) => {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return Math.ceil((firstThursday - target.valueOf()) / 604800000) + 1;
  };

  const currentWeekNumber = getISOWeek(currentDate);
  const currentYearNumber = currentDate.getFullYear();

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center space-x-4">
        {/* Week Navigation */}
        {showWeekView && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('prev')}
              disabled={isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex flex-col items-center min-w-0">
              <div className="font-semibold text-sm">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </div>
              <div className="text-xs text-gray-500">
                Week {currentWeekNumber}, {currentYearNumber}
                {planExists && planExists(currentDate) && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Has plan
                  </Badge>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek('next')}
              disabled={isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Quick Navigation */}
        {showQuickNav && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="flex items-center space-x-1"
            >
              <Target className="h-4 w-4" />
              <span>Today</span>
            </Button>

            <div className="h-4 w-px bg-gray-300" />
          </>
        )}

        {/* Year/Week Direct Navigation */}
        <Popover open={yearWeekMode} onOpenChange={setYearWeekMode}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <Clock className="h-4 w-4 mr-1" />
              Go to...
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Navigate to specific week</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Year</label>
                    <Select
                      value={selectedYear.toString()}
                      onValueChange={(value) => setSelectedYear(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map(year => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Week</label>
                    <Select
                      value={selectedWeek.toString()}
                      onValueChange={(value) => setSelectedWeek(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {weeks.map(week => (
                          <SelectItem key={week} value={week.toString()}>
                            Week {week}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleYearWeekGo}
                  className="w-full mt-3"
                  disabled={isLoading}
                >
                  Go to Week {selectedWeek}, {selectedYear}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Calendar View */}
        {showCalendarView && (
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <CalendarIcon className="h-4 w-4" />
                <span>Calendar</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => {
                  if (date) {
                    onDateChange(date);
                    setCalendarOpen(false);
                  }
                }}
                initialFocus
                modifiers={{
                  hasPlan: (date) => planExists ? planExists(date) : false,
                }}
                modifiersClassNames={{
                  hasPlan: 'bg-blue-100 text-blue-900 font-bold',
                }}
              />
              <div className="p-3 border-t text-xs text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-100 rounded"></div>
                  <span>Weeks with plans</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {isLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        )}
      </div>
    </div>
  );
}