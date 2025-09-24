'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Calendar, Flag, Folder, Tag } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: number;
  status: string;
  dueDate?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    name: string;
  };
  tags?: Array<{
    id: string;
    name: string;
  }>;
}

const priorityLabels = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
  5: 'Critical'
};

const statusLabels = {
  'pending': 'Not Started',
  'in_progress': 'In Progress',
  'completed': 'Completed',
  'blocked': 'Blocked'
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please log in to view this task');
        return;
      }

      const response = await fetch(`/api/tasks/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTask(data);
      } else if (response.status === 404) {
        toast.error('Task not found');
        router.push('/tasks');
      } else {
        toast.error('Failed to load task');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('An error occurred while loading the task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Task deleted successfully');
        router.push('/tasks');
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('An error occurred while deleting the task');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...task, status: newStatus }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        setTask(updatedTask);
        toast.success('Task status updated');
      } else {
        toast.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('An error occurred while updating the task');
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchTask();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">Task not found</p>
          <Link href="/tasks">
            <Button className="mt-4">Back to Tasks</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Link href="/tasks">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{task.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={
                  task.status === 'completed' ? 'default' :
                  task.status === 'in_progress' ? 'secondary' :
                  task.status === 'blocked' ? 'destructive' : 'outline'
                }>
                  {statusLabels[task.status] || task.status}
                </Badge>
                <Badge variant="outline">
                  <Flag className="h-3 w-3 mr-1" />
                  {priorityLabels[task.priority]} Priority
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/tasks/${task.id}/edit`}>
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {task.description && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{task.description}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Status Actions */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Update Status</h2>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <Button
                    key={status}
                    variant={task.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <h3 className="font-semibold">Details</h3>

              {task.dueDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(task.dueDate), 'PPP')}
                    </p>
                  </div>
                </div>
              )}

              {task.project && (
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Project</p>
                    <p className="text-sm text-muted-foreground">{task.project.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Priority</p>
                  <p className="text-sm text-muted-foreground">
                    {priorityLabels[task.priority]} ({task.priority}/5)
                  </p>
                </div>
              </div>

              {task.tags && task.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Tags</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div className="text-xs text-muted-foreground space-y-1">
                <p>Created: {format(new Date(task.createdAt), 'PPP')}</p>
                <p>Updated: {format(new Date(task.updatedAt), 'PPP')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}