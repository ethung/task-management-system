'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { format, startOfDay, endOfDay, addDays, subDays } from 'date-fns';
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
  isBigThree?: boolean;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
}

interface DailyViewProps {
  initialDate?: Date;
}

export function DailyView({ initialDate = new Date() }: DailyViewProps) {
  const [currentDate, setCurrentDate] = useState(startOfDay(initialDate));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [bigThreeTasks, setBigThreeTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const startDate = currentDate.toISOString();
      const endDate = endOfDay(currentDate).toISOString();

      const searchParams = new URLSearchParams({
        dueDateStart: startDate,
        dueDateEnd: endDate,
        limit: '100',
      });

      const response = await fetch(`/api/tasks?${searchParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedTasks = data.tasks || [];

        // Separate Big Three tasks
        const bigThree = fetchedTasks.filter((task: Task) => task.isBigThree);
        const regularTasks = fetchedTasks.filter((task: Task) => !task.isBigThree);

        setBigThreeTasks(bigThree);
        setTasks(regularTasks);
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

  const addQuickTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      setIsAddingTask(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTaskTitle,
          dueDate: currentDate.toISOString(),
          priority: 3,
        }),
      });

      if (response.ok) {
        setNewTaskTitle('');
        fetchTasks();
        toast.success('Task created successfully!');
      } else {
        toast.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('An error occurred while creating the task');
    } finally {
      setIsAddingTask(false);
    }
  };

  const toggleBigThree = async (taskId: string) => {
    try {
      const task = [...tasks, ...bigThreeTasks].find(t => t.id === taskId);
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
          isBigThree: !task.isBigThree,
        }),
      });

      if (response.ok) {
        fetchTasks();
        toast.success(task.isBigThree ? 'Removed from Big 3' : 'Added to Big 3');
      } else {
        toast.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('An error occurred while updating the task');
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Handle moving tasks between Big Three and regular tasks
    if (source.droppableId !== destination.droppableId) {
      if (destination.droppableId === 'big-three' && bigThreeTasks.length >= 3) {
        toast.error('You can only have 3 Big Three tasks');
        return;
      }
      toggleBigThree(draggableId);
    } else {
      // Handle reordering within the same list
      const sourceList = source.droppableId === 'big-three' ? bigThreeTasks : tasks;
      const newList = Array.from(sourceList);
      const [reorderedItem] = newList.splice(source.index, 1);
      newList.splice(destination.index, 0, reorderedItem);

      if (source.droppableId === 'big-three') {
        setBigThreeTasks(newList);
      } else {
        setTasks(newList);
      }
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev'
      ? subDays(currentDate, 1)
      : addDays(currentDate, 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(startOfDay(new Date()));
  };

  useEffect(() => {
    fetchTasks();
  }, [currentDate]);

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-center">
              <h1 className="text-3xl font-bold">
                {format(currentDate, 'EEEE')}
              </h1>
              <p className="text-muted-foreground">
                {format(currentDate, 'MMMM d, yyyy')}
              </p>
            </div>

            <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {!isToday && (
            <Button variant="outline" onClick={goToToday}>
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </Button>
          )}
        </div>

        {/* Quick Add Task */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Add a task for today..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addQuickTask()}
              />
              <Button onClick={addQuickTask} disabled={isAddingTask || !newTaskTitle.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Big Three Tasks */}
            <div className="lg:col-span-1">
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-orange-600" />
                    Big 3 for Today
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Your 3 most important tasks ({bigThreeTasks.length}/3)
                  </p>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId="big-three">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3 min-h-[200px]"
                      >
                        {loading ? (
                          [...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                          ))
                        ) : bigThreeTasks.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Drag tasks here to set your Big 3</p>
                          </div>
                        ) : (
                          bigThreeTasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard task={task} onUpdate={fetchTasks} />
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
            </div>

            {/* All Tasks */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>All Tasks for Today</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} scheduled
                  </p>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId="all-tasks">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3 min-h-[200px]"
                      >
                        {loading ? (
                          [...Array(5)].map((_, i) => (
                            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                          ))
                        ) : tasks.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground">
                            <Circle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No tasks scheduled for today</p>
                            <p className="text-sm mt-1">Add a task above to get started</p>
                          </div>
                        ) : (
                          tasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <TaskCard task={task} onUpdate={fetchTasks} />
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
            </div>
          </div>
        </DragDropContext>

        {/* Daily Stats */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {[...tasks, ...bigThreeTasks].filter(t => t.status === 'completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {[...tasks, ...bigThreeTasks].filter(t => t.status === 'in_progress').length}
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {[...tasks, ...bigThreeTasks].filter(t => t.status === 'pending').length}
                </div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {bigThreeTasks.length}
                </div>
                <div className="text-sm text-muted-foreground">Big 3</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}