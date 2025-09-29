"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";

interface UnifiedMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onSave?: () => void;
  disabled?: boolean;
}

export function UnifiedMarkdownEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  className,
  autoFocus = false,
  onSave,
  disabled = false,
}: UnifiedMarkdownEditorProps) {
  const editableRef = useRef<HTMLDivElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const lastExternalValue = useRef<string>(value);
  const isUserTyping = useRef<boolean>(false);

  // For contentEditable, we want to work with plain text and let the browser handle formatting
  const setContentEditableText = useCallback(
    (element: HTMLDivElement, text: string) => {
      if (!text.trim()) {
        element.innerHTML = `<div style="color: #9ca3af; font-style: italic;">${placeholder}</div>`;
        return;
      }

      // For seamless editing, just set the textContent directly
      // This preserves line breaks naturally without HTML conversion issues
      element.textContent = text;
    },
    [placeholder]
  );

  // Convert HTML back to markdown when editing (simplified)
  const htmlToMarkdown = useCallback((element: HTMLElement): string => {
    // For contentEditable, use textContent to preserve actual line breaks
    // This maintains the natural text structure without HTML processing
    const text = element.textContent || "";
    return text;
  }, []);

  // Only update the rendered content when there's a genuine external change
  useEffect(() => {
    if (editableRef.current && !isComposing && !isUserTyping.current) {
      // Only update if this is a genuine external change (not from user typing)
      if (value !== lastExternalValue.current) {
        setContentEditableText(editableRef.current, value);
        lastExternalValue.current = value;
      }
    }
  }, [value, setContentEditableText, isComposing]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (!editableRef.current || isComposing) return;

    // Mark that user is actively typing
    isUserTyping.current = true;

    const newMarkdown = htmlToMarkdown(editableRef.current);
    if (newMarkdown !== value) {
      onChange(newMarkdown);
    }

    // Reset typing flag after a delay to allow for seamless experience
    setTimeout(() => {
      isUserTyping.current = false;
    }, 100);
  }, [onChange, value, htmlToMarkdown, isComposing]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Save shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Handle Enter key for markdown formatting
      if (e.key === "Enter") {
        e.preventDefault();

        // Mark that user is actively typing
        isUserTyping.current = true;

        const selection = window.getSelection();
        if (!selection || !editableRef.current) return;

        const range = selection.getRangeAt(0);
        const currentLine = range.commonAncestorContainer;

        // Get the text content of the current line
        let lineText = "";
        if (currentLine.nodeType === Node.TEXT_NODE) {
          lineText = currentLine.textContent || "";
        } else if (currentLine.nodeType === Node.ELEMENT_NODE) {
          lineText = (currentLine as Element).textContent || "";
        }

        // Auto-continue lists
        const checkboxMatch = lineText.match(/^- \[([ x])\]\s*(.*)$/);
        const numberMatch = lineText.match(/^(\d+)\.\s*(.*)$/);
        const bulletMatch = lineText.match(/^- (.*)$/);

        let newContent = "\n";

        if (checkboxMatch) {
          const [, , content] = checkboxMatch;
          if (content.trim() === "") {
            // Remove empty checkbox
            newContent = "\n";
          } else {
            // Continue with new checkbox
            newContent = "\n- [ ] ";
          }
        } else if (numberMatch) {
          const [, numberStr, content] = numberMatch;
          if (content.trim() === "") {
            // Remove empty number
            newContent = "\n";
          } else {
            // Continue with next number
            newContent = `\n${parseInt(numberStr) + 1}. `;
          }
        } else if (bulletMatch) {
          const [, content] = bulletMatch;
          if (content.trim() === "") {
            // Remove empty bullet
            newContent = "\n";
          } else {
            // Continue with new bullet
            newContent = "\n- ";
          }
        }

        // Insert the new content
        document.execCommand("insertHTML", false, newContent);
        handleInput();
      }
    },
    [onSave, handleInput]
  );

  // Focus handling
  useEffect(() => {
    if (autoFocus && editableRef.current) {
      editableRef.current.focus();
    }
  }, [autoFocus]);

  // Initialize content
  useEffect(() => {
    if (
      editableRef.current &&
      (editableRef.current.textContent === "" ||
        editableRef.current.innerHTML === "")
    ) {
      setContentEditableText(editableRef.current, value);
      lastExternalValue.current = value;
    }
  }, [setContentEditableText, value]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Main editor */}
      <div
        ref={editableRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => {
          setIsComposing(false);
          handleInput();
        }}
        className={cn(
          "w-full flex-1 overflow-auto p-4 focus:outline-none",
          "prose prose-sm max-w-none",
          "whitespace-pre-wrap leading-relaxed",
          disabled && "cursor-not-allowed bg-gray-50 text-gray-500"
        )}
        style={{ minHeight: "100%" }}
        suppressContentEditableWarning={true}
        aria-label="Markdown editor"
      />

      {/* Status bar */}
      <div className="border-t bg-gray-50 px-4 py-2 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <div>
            {value.length} characters • {value.split("\n").length} lines
          </div>
          <div className="flex space-x-4">
            <span>⌘S to save</span>
            <span>Enter to continue lists</span>
          </div>
        </div>
      </div>
    </div>
  );
}
