"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Edit, Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

interface MinimalMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
}

export function MinimalMarkdownEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  className,
  autoFocus = false,
  onSave,
  onCancel,
}: MinimalMarkdownEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setIsDirty(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Auto-complete checkbox patterns
    if (e.key === "Enter") {
      const textarea = e.currentTarget;
      const { selectionStart, value } = textarea;
      const lines = value.substring(0, selectionStart).split("\n");
      const currentLine = lines[lines.length - 1];

      // Auto-continue checkbox lists
      const checkboxMatch = currentLine.match(/^(\s*)- \[([ x])\]\s*(.*)$/);
      if (checkboxMatch) {
        const [, indentation, , content] = checkboxMatch;
        if (content.trim() === "") {
          // If current line is empty checkbox, remove it
          e.preventDefault();
          const newValue =
            value.substring(0, selectionStart - currentLine.length - 1) +
            value.substring(selectionStart);
          onChange(newValue);

          // Move cursor to end of previous line
          setTimeout(() => {
            const newPosition = selectionStart - currentLine.length - 1;
            textarea.setSelectionRange(newPosition, newPosition);
          }, 0);
        } else {
          // Continue with new checkbox
          e.preventDefault();
          const newCheckbox = `\n${indentation}- [ ] `;
          const newValue =
            value.substring(0, selectionStart) +
            newCheckbox +
            value.substring(selectionStart);
          onChange(newValue);

          // Move cursor to after new checkbox
          setTimeout(() => {
            const newPosition = selectionStart + newCheckbox.length;
            textarea.setSelectionRange(newPosition, newPosition);
          }, 0);
        }
      }

      // Auto-continue numbered lists (goals)
      const numberMatch = currentLine.match(/^(\d+)\.\s*(.*)$/);
      if (numberMatch) {
        const [, numberStr, content] = numberMatch;
        if (content.trim() === "") {
          // If current line is empty number, remove it
          e.preventDefault();
          const newValue =
            value.substring(0, selectionStart - currentLine.length - 1) +
            value.substring(selectionStart);
          onChange(newValue);

          setTimeout(() => {
            const newPosition = selectionStart - currentLine.length - 1;
            textarea.setSelectionRange(newPosition, newPosition);
          }, 0);
        } else {
          // Continue with next number
          e.preventDefault();
          const nextNumber = parseInt(numberStr) + 1;
          const newNumberLine = `\n${nextNumber}. `;
          const newValue =
            value.substring(0, selectionStart) +
            newNumberLine +
            value.substring(selectionStart);
          onChange(newValue);

          setTimeout(() => {
            const newPosition = selectionStart + newNumberLine.length;
            textarea.setSelectionRange(newPosition, newPosition);
          }, 0);
        }
      }
    }

    // Tab to indent checkboxes
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;

      if (selectionStart === selectionEnd) {
        // Single cursor position
        const lines = value.substring(0, selectionStart).split("\n");
        const currentLine = lines[lines.length - 1];
        const checkboxMatch = currentLine.match(/^(\s*)- \[([ x])\]/);

        if (checkboxMatch) {
          const indent = e.shiftKey ? "" : "  "; // Remove or add indent
          const newValue = e.shiftKey
            ? value.replace(new RegExp(`^  `, "m"), "") // Remove 2 spaces from current line
            : value.substring(0, selectionStart - currentLine.length) +
              indent +
              currentLine +
              value.substring(selectionStart);

          onChange(newValue);

          setTimeout(() => {
            const adjustment = e.shiftKey ? -2 : 2;
            const newPosition = selectionStart + adjustment;
            textarea.setSelectionRange(newPosition, newPosition);
          }, 0);
        } else {
          // Regular tab behavior
          const newValue =
            value.substring(0, selectionStart) +
            "  " +
            value.substring(selectionEnd);
          onChange(newValue);

          setTimeout(() => {
            const newPosition = selectionStart + 2;
            textarea.setSelectionRange(newPosition, newPosition);
          }, 0);
        }
      }
    }

    // Save shortcut
    if (e.metaKey && e.key === "s") {
      e.preventDefault();
      onSave?.();
      setIsDirty(false);
    }
  };

  const handleSave = () => {
    onSave?.();
    setIsDirty(false);
  };

  const handleCancel = () => {
    onCancel?.();
    setIsDirty(false);
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-gray-50 p-2">
        <div className="flex items-center space-x-2">
          <Button
            variant={!isPreview ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setIsPreview(false)}
          >
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant={isPreview ? "secondary" : "ghost"}
            size="sm"
            onClick={togglePreview}
          >
            <Eye className="mr-1 h-4 w-4" />
            Preview
          </Button>
        </div>

        {(onSave || onCancel) && (
          <div className="flex items-center space-x-2">
            {isDirty && (
              <span className="text-xs text-amber-600">Unsaved changes</span>
            )}
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
            {onSave && (
              <Button variant="default" size="sm" onClick={handleSave}>
                <Check className="mr-1 h-4 w-4" />
                Save
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative flex-1">
        {!isPreview ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "h-full w-full resize-none border-0 p-4 focus:outline-none",
              "font-mono text-sm leading-relaxed",
              "placeholder:text-gray-400"
            )}
            spellCheck={false}
          />
        ) : (
          <div className="h-full overflow-auto p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom checkbox rendering with interactive behavior
                  input: ({ type, checked, ...props }) => {
                    if (type === "checkbox") {
                      return (
                        <input
                          type="checkbox"
                          checked={checked}
                          className="mr-2"
                          readOnly
                          {...props}
                        />
                      );
                    }
                    return <input type={type} {...props} />;
                  },
                  // Ensure proper spacing for lists
                  ul: ({ children, ...props }) => (
                    <ul className="space-y-1" {...props}>
                      {children}
                    </ul>
                  ),
                  li: ({ children, ...props }) => (
                    <li className="flex items-start" {...props}>
                      {children}
                    </li>
                  ),
                }}
              >
                {value || "*Nothing to preview yet...*"}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <div>
            {value.length} characters • {value.split("\n").length} lines
          </div>
          <div className="flex space-x-4">
            <span>⌘S to save</span>
            <span>Tab to indent tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
