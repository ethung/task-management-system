'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  Calendar,
  Target,
  Star,
  Clock,
  CheckCircle,
  BarChart3,
  Download,
  Eye,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { format, subWeeks, isThisWeek, isThisMonth } from 'date-fns';
import type { WeeklyPlan, WeeklyReflection } from '@/lib/types';

interface WeekProgressDashboardProps {
  weeklyPlans: WeeklyPlan[];
  weeklyReflections: WeeklyReflection[];
  onExport?: (format: 'json' | 'csv') => Promise<void>;
  onViewPlan?: (plan: WeeklyPlan) => void;
  onViewReflection?: (reflection: WeeklyReflection) => void;
  isLoading?: boolean;
}

export function WeekProgressDashboard({
  weeklyPlans,
  weeklyReflections,
  onExport,
  onViewPlan,
  onViewReflection,
  isLoading = false,
}: WeekProgressDashboardProps) {
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'quarter'>('month');
  const [sortBy, setSortBy] = useState<'date' | 'satisfaction' | 'completion'>('date');

  // Filter data based on time period
  const filterByTime = (items: any[]) => {
    const now = new Date();
    switch (timeFilter) {
      case 'month':
        return items.filter(item => {
          const date = new Date(item.weekStartDate || item.weekEndDate);
          return isThisMonth(date) || isThisWeek(date);
        });
      case 'quarter':
        const threeMonthsAgo = subWeeks(now, 12);
        return items.filter(item => {
          const date = new Date(item.weekStartDate || item.weekEndDate);
          return date >= threeMonthsAgo;
        });
      default:
        return items;
    }
  };

  const filteredPlans = filterByTime(weeklyPlans);
  const filteredReflections = filterByTime(weeklyReflections);

  // Calculate statistics
  const totalPlans = filteredPlans.length;
  const completedPlans = filteredPlans.filter(plan => plan.status === 'COMPLETED').length;
  const activePlans = filteredPlans.filter(plan => plan.status === 'ACTIVE').length;

  const totalGoals = filteredPlans.reduce((sum, plan) => sum + plan.weeklyGoals.length, 0);
  const completedGoals = filteredPlans.reduce(
    (sum, plan) => sum + plan.weeklyGoals.filter(goal => goal.completed).length,
    0
  );

  const averageSatisfaction = filteredReflections.length > 0
    ? filteredReflections
        .filter(r => r.satisfactionRating !== null)
        .reduce((sum, r) => sum + (r.satisfactionRating || 0), 0) /
      filteredReflections.filter(r => r.satisfactionRating !== null).length
    : 0;

  const planningConsistency = totalPlans > 0 ? Math.round((totalPlans / 12) * 100) : 0; // Assuming 12 weeks max
  const goalCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // Sort plans for timeline
  const sortedPlans = [...filteredPlans].sort((a, b) => {
    switch (sortBy) {
      case 'satisfaction':
        const aReflection = filteredReflections.find(r => r.weeklyPlanId === a.id);
        const bReflection = filteredReflections.find(r => r.weeklyPlanId === b.id);
        return (bReflection?.satisfactionRating || 0) - (aReflection?.satisfactionRating || 0);
      case 'completion':
        const aRate = a.weeklyGoals.filter(g => g.completed).length / a.weeklyGoals.length;
        const bRate = b.weeklyGoals.filter(g => g.completed).length / b.weeklyGoals.length;
        return bRate - aRate;
      default:
        return new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime();
    }
  });

  const getSatisfactionColor = (rating: number) => {
    if (rating <= 3) return 'text-red-600 bg-red-100';
    if (rating <= 6) return 'text-yellow-600 bg-yellow-100';
    if (rating <= 8) return 'text-blue-600 bg-blue-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Progress Dashboard</h1>
          <p className="text-gray-600">Track your weekly planning progress and insights</p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">Last 3 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          {onExport && (
            <div className="flex items-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('json')}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>JSON</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('csv')}
                className="flex items-center space-x-1"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Planning Consistency</p>
                <p className="text-2xl font-bold">{planningConsistency}%</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">{totalPlans} weeks planned</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Goal Completion</p>
                <p className="text-2xl font-bold">{goalCompletionRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">{completedGoals} of {totalGoals} goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Satisfaction</p>
                <p className="text-2xl font-bold">{averageSatisfaction.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Out of 10</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Plans</p>
                <p className="text-2xl font-bold">{activePlans}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">{completedPlans} completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Plans Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Weekly Plans Timeline</span>
            </CardTitle>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="satisfaction">By Satisfaction</SelectItem>
                <SelectItem value="completion">By Completion</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedPlans.map((plan) => {
              const reflection = filteredReflections.find(r => r.weeklyPlanId === plan.id);
              const completedGoals = plan.weeklyGoals.filter(g => g.completed).length;
              const totalGoals = plan.weeklyGoals.length;
              const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

              return (
                <div key={plan.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-semibold">
                          Week of {format(new Date(plan.weekStartDate), 'MMM d, yyyy')}
                        </h4>
                        <Badge className={getStatusColor(plan.status)}>
                          {plan.status}
                        </Badge>
                        {reflection?.satisfactionRating && (
                          <Badge className={getSatisfactionColor(reflection.satisfactionRating)}>
                            {reflection.satisfactionRating}/10
                          </Badge>
                        )}
                      </div>

                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Target className="h-4 w-4" />
                          <span>{completedGoals}/{totalGoals} goals ({Math.round(completionRate)}%)</span>
                        </div>
                        {reflection && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>Reflected</span>
                          </div>
                        )}
                      </div>

                      {plan.intentions && (
                        <p className="mt-2 text-sm text-gray-700 italic">
                          "{plan.intentions.slice(0, 100)}..."
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {onViewPlan && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewPlan(plan)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Plan</span>
                        </Button>
                      )}
                      {reflection && onViewReflection && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewReflection(reflection)}
                          className="flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View Reflection</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Goal Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {sortedPlans.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No weekly plans found for the selected time period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      {filteredReflections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Insights & Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Recent Patterns</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Avg goals per week:</span>
                    <span className="font-medium">
                      {(totalGoals / Math.max(totalPlans, 1)).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Completion streak:</span>
                    <span className="font-medium">
                      {filteredPlans.filter(p => p.status === 'COMPLETED').length} weeks
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Reflection rate:</span>
                    <span className="font-medium">
                      {Math.round((filteredReflections.length / Math.max(totalPlans, 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Top Achievements</h4>
                <div className="space-y-2">
                  {filteredReflections
                    .filter(r => r.accomplishments)
                    .slice(0, 3)
                    .map((reflection, index) => (
                      <div key={index} className="text-sm p-2 bg-green-50 rounded">
                        <p className="text-green-800">
                          "{reflection.accomplishments?.slice(0, 60)}..."
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}