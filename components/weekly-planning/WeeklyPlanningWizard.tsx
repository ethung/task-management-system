'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  X,
  Target,
  Calendar,
  CheckSquare,
  ArrowRight,
  ArrowLeft,
  Wand2,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import type { WeeklyPlan, WeeklyGoal } from '@/lib/types';

const weeklyGoalSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional(),
  priority: z.number().min(1).max(5),
  completed: z.boolean().optional(),
});

const weeklyPlanSchema = z.object({
  weekStartDate: z.date(),
  weeklyGoals: z.array(weeklyGoalSchema).min(1, 'At least one goal is required'),
  intentions: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
});

type WeeklyPlanFormData = z.infer<typeof weeklyPlanSchema>;

interface WeeklyPlanningWizardProps {
  initialPlan?: WeeklyPlan | null;
  currentDate: Date;
  onSave: (data: WeeklyPlanFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WeeklyPlanningWizard({
  initialPlan,
  currentDate,
  onSave,
  onCancel,
  isLoading = false,
}: WeeklyPlanningWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const form = useForm<WeeklyPlanFormData>({
    resolver: zodResolver(weeklyPlanSchema),
    defaultValues: {
      weekStartDate: weekStart,
      weeklyGoals: initialPlan?.weeklyGoals || [
        {
          id: crypto.randomUUID(),
          title: '',
          description: '',
          priority: 3,
          completed: false,
        }
      ],
      intentions: initialPlan?.intentions || '',
      status: initialPlan?.status || 'DRAFT',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'weeklyGoals',
  });

  const steps = [
    {
      title: 'Set Weekly Goals',
      description: 'Define what you want to accomplish this week',
      icon: Target,
    },
    {
      title: 'Weekly Intentions',
      description: 'Set your focus and intentions for the week',
      icon: Calendar,
    },
    {
      title: 'Review & Save',
      description: 'Review your plan and make it active',
      icon: CheckSquare,
    },
  ];

  const addGoal = () => {
    append({
      id: crypto.randomUUID(),
      title: '',
      description: '',
      priority: 3,
      completed: false,
    });
  };

  const removeGoal = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async (data: WeeklyPlanFormData) => {
    setIsSaving(true);
    try {
      await onSave(data);
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityLabel = (priority: number) => {
    const labels = {
      1: 'Very Low',
      2: 'Low',
      3: 'Medium',
      4: 'High',
      5: 'Very High',
    };
    return labels[priority as keyof typeof labels] || 'Medium';
  };

  const getPriorityColor = (priority: number) => {
    const colors = {
      1: 'bg-gray-100 text-gray-800',
      2: 'bg-blue-100 text-blue-800',
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Weekly Planning</h1>
        <p className="text-gray-600">
          Plan for the week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div key={index} className="flex items-center">
              <div
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : isCompleted
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-400 mx-2" />
              )}
            </div>
          );
        })}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
          {/* Step 1: Goals */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Weekly Goals</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Goal {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGoal(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`weeklyGoals.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Goal Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="What do you want to accomplish?"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`weeklyGoals.${index}.priority`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((priority) => (
                                  <SelectItem key={priority} value={priority.toString()}>
                                    <div className="flex items-center space-x-2">
                                      <Badge className={getPriorityColor(priority)}>
                                        {getPriorityLabel(priority)}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`weeklyGoals.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <MarkdownEditor
                              placeholder="Add more details about this goal..."
                              value={field.value || ''}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addGoal}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Goal
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Intentions */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Weekly Intentions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="intentions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Focus & Intentions</FormLabel>
                      <FormDescription>
                        Set your overall focus, themes, and intentions for this week.
                        What mindset or approach do you want to maintain?
                      </FormDescription>
                      <FormControl>
                        <MarkdownEditor
                          placeholder="This week I want to focus on..."
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Review */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckSquare className="h-5 w-5" />
                  <span>Review Your Plan</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Goals for this week:</h4>
                  <div className="space-y-2">
                    {form.watch('weeklyGoals').map((goal, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Badge className={getPriorityColor(goal.priority)}>
                          {getPriorityLabel(goal.priority)}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium">{goal.title}</p>
                          {goal.description && (
                            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {form.watch('intentions') && (
                  <div>
                    <h4 className="font-semibold mb-3">Weekly Intentions:</h4>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-gray-700">{form.watch('intentions')}</p>
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Set to "Active" to start working on this plan immediately.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div>
              {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSaving} className="flex items-center space-x-2">
                  {isSaving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  <span>{initialPlan ? 'Update Plan' : 'Create Plan'}</span>
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}