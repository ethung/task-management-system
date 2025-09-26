"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Clock,
  Tag,
} from "lucide-react";
import { SmartAutocomplete } from "./SmartAutocomplete";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAITaskIntegration } from "@/hooks/useAITaskIntegration";

interface TaskFormData {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  projectId?: string;
}

interface SmartTaskFormProps {
  onSubmit: (taskData: TaskFormData) => void;
  onCancel?: () => void;
  initialData?: Partial<TaskFormData>;
  className?: string;
}

export function SmartTaskForm({
  onSubmit,
  onCancel,
  initialData = {},
  className = "",
}: SmartTaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData.title || "",
    description: initialData.description || "",
    priority: initialData.priority || "MEDIUM",
    dueDate: initialData.dueDate || "",
    projectId: initialData.projectId || "",
  });

  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([]);

  const { createTaskWithAI, getTaskSuggestions, isProcessing, error } =
    useAITaskIntegration();

  // Get AI suggestions when title changes
  useEffect(() => {
    const getSuggestions = async () => {
      if (formData.title.length >= 5) {
        try {
          const suggestions = await getTaskSuggestions(formData, "hybrid");
          setAiSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (err) {
          console.error("Failed to get AI suggestions:", err);
        }
      } else {
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(getSuggestions, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.title, getTaskSuggestions]);

  const handleInputChange = (field: keyof TaskFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const applySuggestion = (type: string, value: any) => {
    switch (type) {
      case "description":
        setFormData((prev) => ({ ...prev, description: value }));
        break;
      case "priority":
        setFormData((prev) => ({ ...prev, priority: value }));
        break;
      case "enhancedDescription":
        setFormData((prev) => ({
          ...prev,
          description: prev.description
            ? `${prev.description}\n\n${value}`
            : value,
        }));
        break;
    }
    setAppliedSuggestions((prev) => [...prev, type]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await createTaskWithAI(formData, {
      enableSuggestions: true,
      validateWithAI: true,
      framework: "hybrid",
    });

    if (result.success) {
      onSubmit(formData);
    } else if (result.requiresConfirmation) {
      setValidationResult(result.validation);
    }
  };

  const confirmSubmit = async () => {
    // Force creation despite AI concerns
    const result = await createTaskWithAI(formData, {
      enableSuggestions: false,
      validateWithAI: false,
    });

    if (result.success) {
      onSubmit(formData);
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Create Smart Task
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Title with AI Autocomplete */}
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <SmartAutocomplete
                value={formData.title}
                onChange={(value) => handleInputChange("title", value)}
                context="task"
                placeholder="Enter task title..."
              >
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter task title..."
                  required
                />
              </SmartAutocomplete>
            </div>

            {/* Task Description with AI Enhancement */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <SmartAutocomplete
                value={formData.description}
                onChange={(value) => handleInputChange("description", value)}
                context="task"
                placeholder="Enter task description..."
              >
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Enter task description..."
                  rows={3}
                />
              </SmartAutocomplete>
            </div>

            {/* Priority Selection */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => handleInputChange("dueDate", e.target.value)}
              />
            </div>

            {/* AI Suggestions Panel */}
            {showSuggestions && aiSuggestions && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4" />
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiSuggestions.enhancedDescription &&
                    !appliedSuggestions.includes("enhancedDescription") && (
                      <div className="rounded border bg-white p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              Enhanced Description
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {aiSuggestions.enhancedDescription}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              applySuggestion(
                                "enhancedDescription",
                                aiSuggestions.enhancedDescription
                              )
                            }
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}

                  {aiSuggestions.suggestedPriority &&
                    aiSuggestions.suggestedPriority !== formData.priority && (
                      <div className="rounded border bg-white p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              Suggested Priority
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {aiSuggestions.suggestedPriority}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              applySuggestion(
                                "priority",
                                aiSuggestions.suggestedPriority
                              )
                            }
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    )}

                  {aiSuggestions.estimatedDuration && (
                    <div className="rounded border bg-white p-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <p className="text-sm">
                          <span className="font-medium">
                            Estimated Duration:
                          </span>{" "}
                          {aiSuggestions.estimatedDuration}
                        </p>
                      </div>
                    </div>
                  )}

                  {aiSuggestions.suggestedTags &&
                    aiSuggestions.suggestedTags.length > 0 && (
                      <div className="rounded border bg-white p-3">
                        <div className="flex items-start gap-2">
                          <Tag className="mt-0.5 h-4 w-4" />
                          <div>
                            <p className="text-sm font-medium">
                              Suggested Tags
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {aiSuggestions.suggestedTags.map(
                                (tag: string) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {aiSuggestions.breakdown &&
                    aiSuggestions.breakdown.length > 0 && (
                      <div className="rounded border bg-white p-3">
                        <p className="mb-2 text-sm font-medium">
                          Suggested Task Breakdown
                        </p>
                        <ul className="space-y-1 text-sm">
                          {aiSuggestions.breakdown.map(
                            (item: string, index: number) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <span className="text-muted-foreground">
                                  {index + 1}.
                                </span>
                                <span>{item}</span>
                              </li>
                            )
                          )}
                        </ul>
                        <p className="mt-2 text-xs text-muted-foreground">
                          These subtasks will be created automatically after the
                          main task.
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Validation Alert */}
            {validationResult && !validationResult.approved && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">AI Validation Concern</p>
                      <p className="mt-1 text-sm">{validationResult.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={confirmSubmit}>
                        Create Anyway
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setValidationResult(null)}
                      >
                        Revise Task
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isProcessing || !formData.title.trim()}
                className="min-w-[120px]"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create Task
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
