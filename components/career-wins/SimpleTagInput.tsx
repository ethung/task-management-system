"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SimpleTagInputProps {
  value?: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function SimpleTagInput({
  value = [],
  onChange,
  placeholder = "Add a tag and press Enter",
}: SimpleTagInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && inputValue === "" && value.length > 0) {
      // Remove last tag if backspace is pressed and input is empty
      const newTags = [...value];
      newTags.pop();
      onChange(newTags);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !value.includes(trimmedValue)) {
      onChange([...value, trimmedValue]);
    }
    setInputValue("");
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex min-h-[40px] flex-wrap gap-1 rounded-md border border-input p-2">
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1"
          >
            {tag}
            <X
              className="h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={() => removeTag(tag)}
            />
          </Badge>
        ))}
        <div className="flex min-w-[120px] flex-1 items-center gap-1">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              value.length === 0 ? placeholder : "Add another tag..."
            }
            className="h-auto border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {inputValue.trim() && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={addTag}
              className="h-6 w-6 p-0"
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add a tag. Press Backspace to remove the last
        tag.
      </p>
    </div>
  );
}
