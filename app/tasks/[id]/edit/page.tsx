'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: number;
  status: string;
  dueDate?: string;
  projectId?: string;
  tags?: string[];
}

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please log in to edit this task');
        return;
      }

      const response = await fetch(`/api/tasks/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform the task data for the form
        const formattedTask = {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          tags: data.tags?.map((tag: any) => tag.id) || [],
        };
        setTask(formattedTask);
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

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please log in to update the task');
        return;
      }

      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Task updated successfully!');
        router.push(`/tasks/${params.id}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('An error occurred while updating the task');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchTask();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
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
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/tasks/${task.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Task</h1>
            <p className="text-muted-foreground">Update task details</p>
          </div>
        </div>

        {/* Task Form */}
        <div className="bg-card rounded-lg border p-6">
          <TaskForm task={task} onSubmit={handleSubmit} />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Link href={`/tasks/${task.id}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}