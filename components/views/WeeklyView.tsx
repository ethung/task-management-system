'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addDays,
  isSameDay,
  isToday,
  startOfDay
} from 'date-fns';
import { TaskCard } from '@/components/tasks/TaskCard';
import { toast } from 'sonner';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';

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

interface DayTasks {
  date: Date;
  tasks: Task[];
}

interface WeeklyViewProps {
  initialDate?: Date;
}

export function WeeklyView({ initialDate = new Date() }: WeeklyViewProps) {
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(initialDate));
  const [weekData, setWeekData] = useState<DayTasks[]>([]);
  const [loading, setLoading] = useState(true);

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeek, i));
    }
    return days;
  };

  const fetchWeekTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const startDate = currentWeek.toISOString();
      const endDate = endOfWeek(currentWeek).toISOString();

      const searchParams = new URLSearchParams({
        dueDateStart: startDate,
        dueDateEnd: endDate,
        limit: '500', // Get all tasks for the week
      });

      const response = await fetch(`/api/tasks?${searchParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const tasks = data.tasks || [];

        // Group tasks by day
        const weekDays = getWeekDays();
        const groupedData = weekDays.map(date => ({
          date,
          tasks: tasks.filter((task: Task) =>
            task.dueDate && isSameDay(new Date(task.dueDate), date)
          )
        }));

        setWeekData(groupedData);
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev'
      ? subWeeks(currentWeek, 1)
      : addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
  };

  const goToThisWeek = () => {
    setCurrentWeek(startOfWeek(new Date()));
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Don't do anything if dropped in the same place
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    try {
      const taskId = draggableId;
      const newDayIndex = parseInt(destination.droppableId.replace('day-', ''));
      const newDate = addDays(currentWeek, newDayIndex);

      // Find the task
      let task: Task | undefined;
      for (const dayData of weekData) {
        task = dayData.tasks.find(t => t.id === taskId);
        if (task) break;
      }

      if (!task) return;

      const token = localStorage.getItem('accessToken');

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...task,
          dueDate: newDate.toISOString(),
        }),
      });

      if (response.ok) {
        fetchWeekTasks();
        toast.success('Task moved successfully');
      } else {
        toast.error('Failed to move task');
      }
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('An error occurred while moving the task');
    }
  };

  const getTaskCountForDay = (dayTasks: Task[]) => {
    const completed = dayTasks.filter(t => t.status === 'completed').length;
    const total = dayTasks.length;
    return { completed, total };
  };

  useEffect(() => {
    fetchWeekTasks();
  }, [currentWeek]);

  const weekStart = format(currentWeek, 'MMM d');
  const weekEnd = format(endOfWeek(currentWeek), 'MMM d, yyyy');
  const isCurrentWeek = isSameDay(currentWeek, startOfWeek(new Date()));

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <h1 className="text-3xl font-bold">Week View</h1>
              <p className="text-muted-foreground">
                {weekStart} - {weekEnd}
              </p>
            </div>

            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!isCurrentWeek && (
            <Button variant="outline" onClick={goToThisWeek}>
              <Calendar className="h-4 w-4 mr-2" />
              This Week
            </Button>
          )}
        </div>

        {/* Week Grid */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
            {weekData.map((dayData, dayIndex) => {
              const { completed, total } = getTaskCountForDay(dayData.tasks);
              const dayIsToday = isToday(dayData.date);

              return (
                <Card
                  key={dayIndex}
                  className={`flex flex-col h-[400px] ${
                    dayIsToday ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {format(dayData.date, 'EEE')}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {format(dayData.date, 'd')}
                        </p>
                      </div>
                      {total > 0 && (
                        <Badge variant={completed === total ? "default" : "secondary"}>
                          {completed}/{total}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 overflow-hidden">
                    <Droppable droppableId={`day-${dayIndex}`}>
                      {(provided, snapshot) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={`space-y-2 h-full overflow-y-auto ${
                            snapshot.isDraggingOver ? 'bg-muted/50 rounded' : ''
                          }`}
                        >
                          {loading ? (
                            [...Array(3)].map((_, i) => (
                              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                            ))
                          ) : dayData.tasks.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <div className="text-sm">No tasks</div>
                            </div>
                          ) : (
                            dayData.tasks.map((task, index) => (
                              <Draggable key={task.id} draggableId={task.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={snapshot.isDragging ? 'rotate-3 scale-105' : ''}
                                  >
                                    <div className="scale-90 origin-top-left">
                                      <TaskCard task={task} onUpdate={fetchWeekTasks} />
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </DragDropContext>

        {/* Week Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Week Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {weekData.reduce((acc, day) => acc + day.tasks.filter(t => t.status === 'completed').length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {weekData.reduce((acc, day) => acc + day.tasks.filter(t => t.status === 'in_progress').length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {weekData.reduce((acc, day) => acc + day.tasks.filter(t => t.status === 'pending').length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {weekData.reduce((acc, day) => acc + day.tasks.length, 0)}
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