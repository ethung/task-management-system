'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ProjectSelectorProps {
  value?: string;
  onChange: (projectId: string) => void;
}

export function ProjectSelector({ value, onChange }: ProjectSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [projects, setProjects] = React.useState<any[]>([]); // Replace 'any' with actual Project type

  React.useEffect(() => {
    // Fetch projects from API
    const fetchProjects = async () => {
      // TODO: Implement actual API call with authentication
      const response = await fetch('/api/projects', {
        headers: {
          Authorization: 'Bearer YOUR_ACCESS_TOKEN', // Replace with actual token
        },
      });
      const data = await response.json();
      setProjects(data);
    };
    fetchProjects();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? projects.find((project) => project.id === value)?.name
            : 'Select project...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search project..." />
          <CommandList>
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup>
              {projects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={project.name}
                  onSelect={() => {
                    onChange(project.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === project.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {project.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
