'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, RefreshCw } from 'lucide-react';
import { TagInput } from '@/components/tags/tag-input';
import { ProjectSelector } from '@/components/projects/project-selector';

interface FilterPanelProps {
  filters: {
    status: string;
    priority: string;
    projectId: string;
    tags: string[];
  };
  onFiltersChange: (filters: FilterPanelProps['filters']) => void;
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: '1', label: 'Low (1)' },
  { value: '2', label: 'Medium (2)' },
  { value: '3', label: 'High (3)' },
  { value: '4', label: 'Urgent (4)' },
  { value: '5', label: 'Critical (5)' },
];

export function FilterPanel({ filters, onFiltersChange }: FilterPanelProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    fetchProjects();
    fetchTags();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/projects', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/tags', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleFilterChange = (key: keyof FilterPanelProps['filters'], value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: '',
      priority: '',
      projectId: '',
      tags: [],
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status) count++;
    if (filters.priority) count++;
    if (filters.projectId) count++;
    if (filters.tags.length > 0) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{activeFilterCount} active</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="flex items-center gap-1 h-8"
              >
                <RefreshCw className="h-3 w-3" />
                Clear All
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select
              value={filters.priority}
              onValueChange={(value) => handleFilterChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Project</label>
            <Select
              value={filters.projectId}
              onValueChange={(value) => handleFilterChange('projectId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <TagInput
              value={filters.tags}
              onChange={(value) => handleFilterChange('tags', value)}
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {filters.status && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Status: {statusOptions.find(s => s.value === filters.status)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('status', '')}
                  />
                </Badge>
              )}

              {filters.priority && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Priority: {priorityOptions.find(p => p.value === filters.priority)?.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('priority', '')}
                  />
                </Badge>
              )}

              {filters.projectId && (
                <Badge variant="outline" className="flex items-center gap-1">
                  Project: {projects.find(p => p.id === filters.projectId)?.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange('projectId', '')}
                  />
                </Badge>
              )}

              {filters.tags.map((tagId) => {
                const tag = tags.find(t => t.id === tagId);
                return tag ? (
                  <Badge key={tagId} variant="outline" className="flex items-center gap-1">
                    {tag.name}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleFilterChange('tags', filters.tags.filter(t => t !== tagId))}
                    />
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}