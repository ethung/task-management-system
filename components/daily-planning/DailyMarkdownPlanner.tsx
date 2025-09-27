"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { MinimalMarkdownEditor } from "@/components/ui/minimal-markdown-editor";
import { Button } from "@/components/ui/button";

interface DailyMarkdownPlannerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  onSave: (content: string, date: Date) => Promise<void>;
  initialContent?: string;
}

const generateDailyTemplate = (date: Date) => {
  const dayName = format(date, "EEEE");
  const fullDate = format(date, "MMMM d, yyyy");

  return `# ${dayName}, ${fullDate}

## Daily Goals
1.
2.
3.

## Tasks
- [ ]
- [ ]
- [ ]

## Notes

`;
};

export function DailyMarkdownPlanner({
  date,
  onDateChange,
  onSave,
  initialContent,
}: DailyMarkdownPlannerProps) {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize content when date changes or initial content is provided
  useEffect(() => {
    if (initialContent) {
      setContent(initialContent);
    } else {
      setContent(generateDailyTemplate(date));
    }
  }, [date, initialContent]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content, date);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    onDateChange(newDate);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between border-b bg-white p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h1 className="text-xl font-semibold">
              {format(date, "EEEE, MMMM d, yyyy")}
            </h1>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          {lastSaved && (
            <span className="text-sm text-gray-500">
              Saved {format(lastSaved, "h:mm a")}
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="flex items-center space-x-2"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </Button>
        </div>
      </div>

      {/* Markdown Editor */}
      <div className="h-[600px]">
        <MinimalMarkdownEditor
          value={content}
          onChange={handleContentChange}
          placeholder="Start planning your day..."
          autoFocus={true}
          onSave={handleSave}
          className="h-full"
        />
      </div>

      {/* Quick tips */}
      <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
        <p className="mb-2 font-medium">Quick Tips:</p>
        <ul className="space-y-1">
          <li>
            • Use <code>- [ ]</code> for uncompleted tasks and{" "}
            <code>- [x]</code> for completed ones
          </li>
          <li>
            • Add subtasks by indenting: <code> - [ ] subtask</code>
          </li>
          <li>• Keep your daily goals focused and achievable</li>
        </ul>
      </div>
    </div>
  );
}
