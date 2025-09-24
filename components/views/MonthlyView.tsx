'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  CheckCircle2,
  Circle,
  Clock
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isToday,
  isSameMonth,
  getDay
} from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: number;
  status: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

interface MonthlyViewProps {
  initialDate?: Date;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MonthlyView({ initialDate = new Date() }: MonthlyViewProps) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const fetchMonthTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const startDate = calendarStart.toISOString();
      const endDate = calendarEnd.toISOString();

      const searchParams = new URLSearchParams({
        dueDateStart: startDate,
        dueDateEnd: endDate,
        limit: '1000', // Get all tasks for the month view
      });

      const response = await fetch(`/api/tasks?${searchParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        toast.error('Failed to fetch tasks');
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('An error occurred while fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task =>
      task.dueDate && isSameDay(new Date(task.dueDate), date)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev'
      ? subMonths(currentMonth, 1)
      : addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  const goToThisMonth = () => {
    setCurrentMonth(startOfMonth(new Date()));
  };

  const getTaskDensityClass = (taskCount: number) => {
    if (taskCount === 0) return '';
    if (taskCount <= 2) return 'bg-blue-100 dark:bg-blue-900/30';
    if (taskCount <= 4) return 'bg-blue-200 dark:bg-blue-900/50';
    if (taskCount <= 6) return 'bg-blue-300 dark:bg-blue-900/70';
    return 'bg-blue-400 dark:bg-blue-900/90';
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-gray-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  useEffect(() => {
    fetchMonthTasks();
  }, [currentMonth]);

  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <h1 className="text-3xl font-bold">
                {format(currentMonth, 'MMMM yyyy')}
              </h1>
              <p className="text-muted-foreground">Monthly Overview</p>
            </div>

            <Button variant="outline" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex gap-2">
            {!isCurrentMonth && (
              <Button variant="outline" onClick={goToThisMonth}>
                <Calendar className="h-4 w-4 mr-2" />
                This Month
              </Button>
            )}
            <Link href="/tasks/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className="p-6">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {WEEKDAYS.map(day => (
                <div
                  key={day}
                  className="p-2 text-center text-sm font-medium text-muted-foreground bg-muted rounded"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
              {calendarDays.map(day => {
                const dayTasks = getTasksForDay(day);
                const isCurrentDay = isToday(day);
                const isCurrentMonthDay = isSameMonth(day, currentMonth);
                const completedTasks = dayTasks.filter(t => t.status === 'completed').length;
                const totalTasks = dayTasks.length;

                return (
                  <Popover key={day.toISOString()}>
                    <PopoverTrigger asChild>
                      <div
                        className={`
                          min-h-[120px] p-2 bg-background cursor-pointer hover:bg-muted/50 transition-colors
                          ${isCurrentDay ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}
                          ${!isCurrentMonthDay ? 'opacity-40' : ''}
                          ${getTaskDensityClass(totalTasks)}
                        `}
                      >
                        {/* Date */}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-sm font-medium ${
                              isCurrentDay ? 'text-blue-700 dark:text-blue-300' : ''
                            }`}
                          >
                            {format(day, 'd')}
                          </span>
                          {totalTasks > 0 && (
                            <Badge variant={completedTasks === totalTasks ? "default" : "secondary"} className="text-xs">
                              {completedTasks}/{totalTasks}
                            </Badge>
                          )}
                        </div>

                        {/* Task Preview */}
                        <div className="space-y-1">
                          {dayTasks.slice(0, 3).map(task => (
                            <div
                              key={task.id}
                              className="flex items-center gap-1 text-xs p-1 rounded bg-background/50 truncate"
                            >
                              {task.status === 'completed' ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />
                              ) : task.status === 'in_progress' ? (
                                <Clock className="h-3 w-3 text-blue-600 flex-shrink-0" />
                              ) : (
                                <Circle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              )}
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                              <span className="truncate">{task.title}</span>
                            </div>
                          ))}
                          {dayTasks.length > 3 && (
                            <div className="text-xs text-muted-foreground text-center">
                              +{dayTasks.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverTrigger>

                    <PopoverContent className="w-80" side="right">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold">
                            {format(day, 'EEEE, MMMM d, yyyy')}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                          </p>
                        </div>

                        {dayTasks.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No tasks for this day</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {dayTasks.map(task => (
                              <Link key={task.id} href={`/tasks/${task.id}`}>
                                <div className="flex items-center gap-2 p-2 rounded border hover:bg-muted transition-colors">
                                  {task.status === 'completed' ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : task.status === 'in_progress' ? (
                                    <Clock className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{task.title}</p>
                                    {task.project && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {task.project.name}
                                      </p>
                                    )}
                                  </div>
                                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Link href={`/daily?date=${format(day, 'yyyy-MM-dd')}`} className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              Daily View
                            </Button>
                          </Link>
                          <Link href="/tasks/new" className="flex-1">
                            <Button size="sm" className="w-full">
                              <Plus className="h-3 w-3 mr-1" />
                              Add Task
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Month Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Month Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {tasks.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {tasks.filter(t => t.status === 'blocked').length}
                </div>
                <div className="text-sm text-muted-foreground">Blocked</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {tasks.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Tasks</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}