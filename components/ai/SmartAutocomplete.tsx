"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Sparkles, Check } from "lucide-react";
import { debounce } from "lodash";
import { useAI } from "@/hooks/useAI";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SmartAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  context: "task" | "goal" | "project" | "note";
  userPatterns?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactElement; // The input component to wrap
}

export function SmartAutocomplete({
  value,
  onChange,
  onBlur,
  context,
  userPatterns,
  placeholder,
  disabled = false,
  className = "",
  children,
}: SmartAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const ai = useAI({ enableAutoComplete: true });

  // Debounced function to fetch suggestions
  const debouncedGetSuggestions = useCallback(
    debounce(async (text: string, position: number) => {
      if (text.length < 3 || disabled) return; // Don't suggest for very short text

      setIsLoadingSuggestions(true);

      try {
        const results = await ai.autocomplete(
          text,
          position,
          context,
          userPatterns
        );

        // Filter out suggestions that are too similar to current text
        const filteredSuggestions = results.filter((suggestion) => {
          const currentWord = getCurrentWord(text, position);
          return (
            suggestion.toLowerCase() !== currentWord.toLowerCase() &&
            !text.toLowerCase().includes(suggestion.toLowerCase())
          );
        });

        setSuggestions(filteredSuggestions);
        setShowSuggestions(filteredSuggestions.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 300),
    [ai.autocomplete, context, userPatterns, disabled]
  );

  // Get the current word being typed
  const getCurrentWord = (text: string, position: number): string => {
    const beforeCursor = text.slice(0, position);
    const afterCursor = text.slice(position);

    const wordStart = beforeCursor.search(/\S*$/);
    const wordEnd = afterCursor.search(/\s/);

    const wordStartPos = wordStart >= 0 ? wordStart : position;
    const wordEndPos = wordEnd >= 0 ? position + wordEnd : text.length;

    return text.slice(wordStartPos, wordEndPos);
  };

  // Apply suggestion
  const applySuggestion = (suggestion: string) => {
    const currentWord = getCurrentWord(value, cursorPosition);
    const beforeWord = value.slice(0, cursorPosition - currentWord.length);
    const afterWord = value.slice(
      cursorPosition +
        (currentWord.length - getCurrentWord(value, cursorPosition).length)
    );

    const newValue = beforeWord + suggestion + afterWord;
    onChange(newValue);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case "Enter":
      case "Tab":
        if (selectedIndex >= 0) {
          e.preventDefault();
          applySuggestion(suggestions[selectedIndex]);
        }
        break;

      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle input changes
  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    // Get cursor position (for real inputs, this would come from the selection)
    const position = newValue.length;
    setCursorPosition(position);

    // Fetch suggestions
    if (newValue.trim()) {
      debouncedGetSuggestions(newValue, position);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  // Clone the input element with our handlers
  const inputElement = React.cloneElement(children as React.ReactElement<any>, {
    value,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      handleInputChange(e.target.value);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      handleKeyDown(e);
      // Call original onKeyDown if it exists
      (children.props as any)?.onKeyDown?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      // Delay hiding suggestions to allow clicking on them
      setTimeout(() => {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }, 150);
      onBlur?.();
      (children.props as any)?.onBlur?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      if (suggestions.length > 0 && value.trim()) {
        setShowSuggestions(true);
      }
      (children.props as any)?.onFocus?.(e);
    },
    disabled,
    placeholder: placeholder || (children.props as any)?.placeholder,
    className:
      `${(children.props as any)?.className || ""} ${className}`.trim(),
  });

  return (
    <div ref={containerRef} className="relative w-full">
      {inputElement}

      {/* AI Indicator */}
      {(showSuggestions || isLoadingSuggestions) && (
        <div className="pointer-events-none absolute right-2 top-2">
          {isLoadingSuggestions ? (
            <Loader2 size={16} className="animate-spin text-blue-500" />
          ) : (
            <Sparkles size={16} className="text-green-500" />
          )}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto border shadow-lg">
          <div className="p-1">
            <div className="border-b px-2 py-1 text-xs text-gray-500">
              AI Suggestions
            </div>

            {suggestions.map((suggestion, index) => (
              <Button
                key={`${suggestion}-${index}`}
                ref={(el) => {
                  suggestionRefs.current[index] = el;
                }}
                variant={index === selectedIndex ? "secondary" : "ghost"}
                className="h-auto w-full justify-start whitespace-normal p-2 text-left"
                onClick={() => applySuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex w-full items-start gap-2">
                  <Check
                    size={14}
                    className={`mt-0.5 flex-shrink-0 ${
                      index === selectedIndex
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <span className="flex-1 break-words text-sm">
                    {suggestion}
                  </span>
                </div>
              </Button>
            ))}

            <div className="border-t px-2 py-1 text-xs text-gray-400">
              Press Tab or Enter to accept, Esc to dismiss
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default SmartAutocomplete;
