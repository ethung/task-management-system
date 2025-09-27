"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CareerWinSmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: string) => void;
  placeholder?: string;
  type: "title" | "description" | "category";
  className?: string;
  disabled?: boolean;
  context?: {
    previousWins?: Array<{
      title: string;
      description?: string;
      category?: string;
    }>;
    userStyle?: string;
    industry?: string;
  };
}

interface CareerSuggestion {
  text: string;
  confidence: number;
  category?: string;
}

export function CareerWinSmartInput({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing...",
  type,
  className = "",
  disabled = false,
  context,
}: CareerWinSmartInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (input: string) => {
    if (input.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/career-wins/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type,
          input: input.trim(),
          context,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const suggestionTexts =
          data.suggestions?.map((s: CareerSuggestion) => s.text) || [];
        setSuggestions(suggestionTexts);
        setShowSuggestions(suggestionTexts.length > 0);
        setSelectedIndex(-1);
      } else if (response.status === 503) {
        // Smart suggestions disabled - fail silently
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Failed to fetch career win suggestions:", error);
      // Fail silently to maintain UX
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Debounce suggestions
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 400) as NodeJS.Timeout; // Slightly longer debounce for AI calls
  };

  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    onSelect?.(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

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
        if (selectedIndex >= 0) {
          e.preventDefault();
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay hiding suggestions to allow clicking
            setTimeout(() => setShowSuggestions(false), 150);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          className={`${className} ${isLoading ? "pr-8" : ""}`}
          disabled={disabled}
        />
        {isLoading && (
          <Loader2 className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform animate-spin text-muted-foreground" />
        )}
        {!isLoading && value.length > 0 && (
          <Sparkles className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 transform text-blue-500" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute left-0 right-0 top-full z-50 mt-1 border py-1 shadow-lg">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`w-full justify-start px-3 py-2 text-left font-normal ${
                index === selectedIndex ? "bg-accent" : ""
              }`}
              onMouseDown={(e) => e.preventDefault()} // Prevent input blur
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <Sparkles className="mr-2 h-3 w-3 text-blue-500" />
              {suggestion}
            </Button>
          ))}
        </Card>
      )}
    </div>
  );
}
