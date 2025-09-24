'use client';

import * as React from 'react';
import { X, Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
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

interface TagInputProps {
  value?: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<any[]>([]); // Replace 'any' with actual Tag type
  const selectedTags = new Set(value);

  React.useEffect(() => {
    // Fetch tag suggestions from API
    const fetchSuggestions = async () => {
      // TODO: Implement actual API call with authentication
      const response = await fetch('/api/tags/suggestions', {
        headers: {
          Authorization: 'Bearer YOUR_ACCESS_TOKEN', // Replace with actual token
        },
      });
      const data = await response.json();
      setSuggestions(data);
    };
    fetchSuggestions();
  }, []);

  const handleSelect = (tagId: string) => {
    const newSelectedTags = new Set(selectedTags);
    if (newSelectedTags.has(tagId)) {
      newSelectedTags.delete(tagId);
    } else {
      newSelectedTags.add(tagId);
    }
    onChange(Array.from(newSelectedTags));
    setInputValue('');
  };

  const handleRemove = (tagId: string) => {
    const newSelectedTags = new Set(selectedTags);
    newSelectedTags.delete(tagId);
    onChange(Array.from(newSelectedTags));
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-h-[40px] flex-wrap"
          >
            <div className="flex flex-wrap gap-1">
              {Array.from(selectedTags).map((tagId) => {
                const tag = suggestions.find((s) => s.id === tagId);
                return tag ? (
                  <Badge key={tag.id} variant="secondary">
                    {tag.name}
                    <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleRemove(tag.id)} />
                  </Badge>
                ) : null;
              })}
              {selectedTags.size === 0 && 'Select tags...'}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>No tag found.</CommandEmpty>
              <CommandGroup>
                {suggestions
                  .filter((tag) =>
                    tag.name.toLowerCase().includes(inputValue.toLowerCase())
                  )
                  .map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleSelect(tag.id)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedTags.has(tag.id) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {tag.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
