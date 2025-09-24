'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewTaskPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Please log in to create a task');
        return;
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Task created successfully!');
        router.push('/tasks');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('An error occurred while creating the task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/tasks">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create New Task</h1>
            <p className="text-muted-foreground">Add a new task to your project</p>
          </div>
        </div>

        {/* Task Form */}
        <div className="bg-card rounded-lg border p-6">
          <TaskForm onSubmit={handleSubmit} />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/tasks">
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}