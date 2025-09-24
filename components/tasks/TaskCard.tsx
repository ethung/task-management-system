'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Flag,
  Folder,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TaskCardProps {
  task: {
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
  };
  onUpdate: () => void;
}

const priorityLabels = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent',
  5: 'Critical'
};

const statusIcons = {
  'pending': Circle,
  'in_progress': Clock,
  'completed': CheckCircle2,
  'blocked': AlertCircle
};

const statusColors = {
  'pending': 'text-muted-foreground',
  'in_progress': 'text-blue-600',
  'completed': 'text-green-600',
  'blocked': 'text-red-600'
};

export function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const StatusIcon = statusIcons[task.status] || Circle;

  const handleStatusToggle = async () => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
      setIsUpdating(true);
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...task, status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Task marked as ${newStatus === 'completed' ? 'completed' : 'pending'}`);
        onUpdate();
      } else {
        toast.error('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('An error occurred while updating the task');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Task deleted successfully');
        onUpdate();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('An error occurred while deleting the task');
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-gray-600';
      case 2: return 'text-blue-600';
      case 3: return 'text-yellow-600';
      case 4: return 'text-orange-600';
      case 5: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <Card className={`transition-colors hover:bg-muted/50 ${
      task.status === 'completed' ? 'opacity-75' : ''
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStatusToggle}
              disabled={isUpdating}
              className="p-1 h-auto"
            >
              <StatusIcon className={`h-5 w-5 ${statusColors[task.status]}`} />
            </Button>

            <div className="flex-1">
              <Link
                href={`/tasks/${task.id}`}
                className="text-lg font-semibold hover:underline"
              >
                {task.title}
              </Link>

              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {task.description.replace(/[#*`]/g, '').substring(0, 100)}
                  {task.description.length > 100 && '...'}
                </p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/tasks/${task.id}`}>
                <DropdownMenuItem>
                  View Details
                </DropdownMenuItem>
              </Link>
              <Link href={`/tasks/${task.id}/edit`}>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {task.project && (
            <div className="flex items-center gap-1">
              <Folder className="h-4 w-4" />
              <span>{task.project.name}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Flag className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
            <span>{priorityLabels[task.priority]}</span>
          </div>

          {task.dueDate && (
            <div className={`flex items-center gap-1 ${
              isOverdue ? 'text-red-600 font-medium' : ''
            }`}>
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            </div>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {task.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{task.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}