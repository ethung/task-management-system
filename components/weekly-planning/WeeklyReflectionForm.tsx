'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
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
  Heart,
  TrendingUp,
  Lightbulb,
  Target,
  Star,
  Save,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { format, endOfWeek } from 'date-fns';
import type { WeeklyReflection, WeeklyPlan } from '@/lib/types';

const weeklyReflectionSchema = z.object({
  weeklyPlanId: z.string(),
  weekEndDate: z.date(),
  accomplishments: z.string().optional(),
  challenges: z.string().optional(),
  lessons: z.string().optional(),
  nextWeekGoals: z.string().optional(),
  satisfactionRating: z.number().min(1).max(10).optional(),
  progressNotes: z.string().optional(),
});

type WeeklyReflectionFormData = z.infer<typeof weeklyReflectionSchema>;

interface WeeklyReflectionFormProps {
  initialReflection?: WeeklyReflection | null;
  weeklyPlan: WeeklyPlan;
  onSave: (data: WeeklyReflectionFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function WeeklyReflectionForm({
  initialReflection,
  weeklyPlan,
  onSave,
  onCancel,
  isLoading = false,
}: WeeklyReflectionFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const weekEnd = endOfWeek(weeklyPlan.weekStartDate, { weekStartsOn: 1 });

  const form = useForm<WeeklyReflectionFormData>({
    resolver: zodResolver(weeklyReflectionSchema),
    defaultValues: {
      weeklyPlanId: weeklyPlan.id,
      weekEndDate: weekEnd,
      accomplishments: initialReflection?.accomplishments || '',
      challenges: initialReflection?.challenges || '',
      lessons: initialReflection?.lessons || '',
      nextWeekGoals: initialReflection?.nextWeekGoals || '',
      satisfactionRating: initialReflection?.satisfactionRating || undefined,
      progressNotes: initialReflection?.progressNotes || '',
    },
  });

  const handleSave = async (data: WeeklyReflectionFormData) => {
    setIsSaving(true);
    try {
      await onSave(data);
    } finally {
      setIsSaving(false);
    }
  };

  const getSatisfactionColor = (rating: number) => {
    if (rating <= 3) return 'text-red-600';
    if (rating <= 6) return 'text-yellow-600';
    if (rating <= 8) return 'text-blue-600';
    return 'text-green-600';
  };

  const getSatisfactionLabel = (rating: number) => {
    if (rating <= 3) return 'Needs Improvement';
    if (rating <= 6) return 'Satisfactory';
    if (rating <= 8) return 'Good';
    return 'Excellent';
  };

  const completedGoals = weeklyPlan.weeklyGoals.filter(goal => goal.completed).length;
  const totalGoals = weeklyPlan.weeklyGoals.length;
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Weekly Reflection</h1>
        <p className="text-gray-600">
          Reflect on the week ending {format(weekEnd, 'MMM d, yyyy')}
        </p>
      </div>

      {/* Week Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Week Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{completedGoals}</div>
              <div className="text-sm text-gray-600">Goals Completed</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{Math.round(completionRate)}%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{totalGoals}</div>
              <div className="text-sm text-gray-600">Total Goals</div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="font-semibold mb-2">Weekly Goals:</h4>
            <div className="space-y-2">
              {weeklyPlan.weeklyGoals.map((goal, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  {goal.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                  <span className={goal.completed ? 'line-through text-gray-500' : ''}>{goal.title}</span>
                  <Badge variant={goal.completed ? 'default' : 'secondary'}>
                    {goal.completed ? 'Completed' : 'In Progress'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
          {/* Accomplishments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>What went well?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="accomplishments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accomplishments & Wins</FormLabel>
                    <FormDescription>
                      Celebrate your successes, both big and small. What are you proud of from this week?
                    </FormDescription>
                    <FormControl>
                      <MarkdownEditor
                        placeholder="I'm proud that I..."
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

          {/* Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span>What was challenging?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="challenges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challenges & Obstacles</FormLabel>
                    <FormDescription>
                      What obstacles did you face? What made things difficult this week?
                    </FormDescription>
                    <FormControl>
                      <MarkdownEditor
                        placeholder="The biggest challenge was..."
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

          {/* Lessons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <span>What did you learn?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="lessons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Learnings & Insights</FormLabel>
                    <FormDescription>
                      What insights did you gain? What would you do differently next time?
                    </FormDescription>
                    <FormControl>
                      <MarkdownEditor
                        placeholder="I learned that..."
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

          {/* Next Week Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Looking ahead</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="nextWeekGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goals for Next Week</FormLabel>
                    <FormDescription>
                      Based on this week's reflection, what do you want to focus on next week?
                    </FormDescription>
                    <FormControl>
                      <MarkdownEditor
                        placeholder="Next week I want to..."
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

          {/* Satisfaction Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-purple-600" />
                <span>Overall Satisfaction</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="satisfactionRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How satisfied are you with this week? (1-10)</FormLabel>
                    <FormDescription>
                      Rate your overall satisfaction with how the week went.
                    </FormDescription>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                          <SelectItem key={rating} value={rating.toString()}>
                            <div className="flex items-center space-x-2">
                              <span>{rating}</span>
                              <span className={getSatisfactionColor(rating)}>
                                {getSatisfactionLabel(rating)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Progress Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-pink-600" />
                <span>Additional Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="progressNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progress Notes</FormLabel>
                    <FormDescription>
                      Any additional thoughts, feelings, or observations about your week?
                    </FormDescription>
                    <FormControl>
                      <MarkdownEditor
                        placeholder="Additional thoughts..."
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

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>

            <Button type="submit" disabled={isSaving} className="flex items-center space-x-2">
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{initialReflection ? 'Update Reflection' : 'Save Reflection'}</span>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}