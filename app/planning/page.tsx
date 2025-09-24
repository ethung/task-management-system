'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TemporalNavigator } from '@/components/version-control/TemporalNavigator';
import { UndoRedoButton } from '@/components/version-control/UndoRedoButton';
import { VersionHistoryPanel } from '@/components/version-control/VersionHistoryPanel';
import { WeeklyPlanningWizard } from '@/components/weekly-planning/WeeklyPlanningWizard';
import { WeeklyReflectionForm } from '@/components/weekly-planning/WeeklyReflectionForm';
import { WeekProgressDashboard } from '@/components/weekly-planning/WeekProgressDashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Edit,
  MessageSquare,
  BarChart3,
  History,
  Calendar,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import type { WeeklyPlan, WeeklyReflection, UndoRedoAction, EntityVersion } from '@/lib/types';

export default function PlanningPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPlan, setCurrentPlan] = useState<WeeklyPlan | null>(null);
  const [currentReflection, setCurrentReflection] = useState<WeeklyReflection | null>(null);
  const [allPlans, setAllPlans] = useState<WeeklyPlan[]>([]);
  const [allReflections, setAllReflections] = useState<WeeklyReflection[]>([]);
  const [undoHistory, setUndoHistory] = useState<UndoRedoAction[]>([]);
  const [versionHistory, setVersionHistory] = useState<EntityVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlanningWizard, setShowPlanningWizard] = useState(false);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Mock data - in real app, these would be API calls
  const mockWeeklyPlan: WeeklyPlan = {
    id: '1',
    userId: 'user1',
    weekStartDate: weekStart,
    weeklyGoals: [
      { id: '1', title: 'Complete project proposal', description: 'Draft and review with team', priority: 5, completed: true },
      { id: '2', title: 'Exercise 3 times', description: 'Gym sessions Monday, Wednesday, Friday', priority: 3, completed: false },
      { id: '3', title: 'Learn React hooks', description: 'Complete online course modules', priority: 4, completed: false },
    ],
    intentions: 'Focus on deep work and maintaining work-life balance',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockReflection: WeeklyReflection = {
    id: '1',
    userId: 'user1',
    weeklyPlanId: '1',
    weekEndDate: weekEnd,
    accomplishments: 'Successfully completed the project proposal and received positive feedback from the team.',
    challenges: 'Had difficulty maintaining exercise routine due to unexpected work commitments.',
    lessons: 'Need to block time for exercise more rigidly and treat it as unmovable.',
    nextWeekGoals: 'Focus on consistency in both work output and personal habits.',
    satisfactionRating: 7,
    progressNotes: 'Overall good week with room for improvement in time management.',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  useEffect(() => {
    loadWeekData(currentDate);
  }, [currentDate]);

  const loadWeekData = async (date: Date) => {
    setIsLoading(true);
    try {
      // Mock API calls - replace with actual API integration
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading

      setCurrentPlan(mockWeeklyPlan);
      setCurrentReflection(mockReflection);
      setAllPlans([mockWeeklyPlan]);
      setAllReflections([mockReflection]);

      // Load undo history
      setUndoHistory([
        {
          id: '1',
          description: 'Updated weekly goals',
          timestamp: new Date(),
          entityType: 'WEEKLY_PLAN',
          entityId: '1',
          canUndo: true,
        }
      ]);
    } catch (error) {
      console.error('Failed to load week data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleUndo = async () => {
    try {
      // Mock undo operation
      console.log('Undoing last action...');
      // Refresh data after undo
      await loadWeekData(currentDate);
    } catch (error) {
      console.error('Failed to undo:', error);
    }
  };

  const handleSavePlan = async (planData: any) => {
    try {
      console.log('Saving plan:', planData);
      // Mock save operation
      setShowPlanningWizard(false);
      await loadWeekData(currentDate);
    } catch (error) {
      console.error('Failed to save plan:', error);
    }
  };

  const handleSaveReflection = async (reflectionData: any) => {
    try {
      console.log('Saving reflection:', reflectionData);
      // Mock save operation
      setShowReflectionForm(false);
      await loadWeekData(currentDate);
    } catch (error) {
      console.error('Failed to save reflection:', error);
    }
  };

  const handleVersionRevert = async (version: number) => {
    try {
      console.log('Reverting to version:', version);
      // Mock revert operation
      await loadWeekData(currentDate);
    } catch (error) {
      console.error('Failed to revert version:', error);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      console.log('Exporting data in format:', format);
      // Mock export operation
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const planExists = (date: Date) => {
    // Mock function to check if plan exists for date
    return date.getDay() !== 0; // Assume plans exist for all days except Sunday
  };

  const getWeekSummary = () => {
    if (!currentPlan) return null;

    const totalGoals = currentPlan.weeklyGoals.length;
    const completedGoals = currentPlan.weeklyGoals.filter(g => g.completed).length;
    const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    return {
      totalGoals,
      completedGoals,
      completionRate,
      hasReflection: !!currentReflection,
      satisfactionRating: currentReflection?.satisfactionRating,
    };
  };

  const summary = getWeekSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <TemporalNavigator
        currentDate={currentDate}
        onDateChange={handleDateChange}
        planExists={planExists}
        isLoading={isLoading}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Week Overview Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Week of {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </h1>
              {summary && (
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Target className="h-3 w-3" />
                    <span>{summary.completedGoals}/{summary.totalGoals} goals</span>
                  </Badge>
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>{Math.round(summary.completionRate)}% complete</span>
                  </Badge>
                  {summary.hasReflection && (
                    <Badge variant="outline" className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Reflected</span>
                    </Badge>
                  )}
                  {currentPlan && (
                    <Badge variant={currentPlan.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {currentPlan.status}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <UndoRedoButton
                onUndo={handleUndo}
                undoHistory={undoHistory}
                isLoading={isLoading}
              />

              {currentPlan && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVersionHistory(true)}
                >
                  <History className="h-4 w-4 mr-1" />
                  History
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="planning" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Planning</span>
            </TabsTrigger>
            <TabsTrigger value="reflection" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>Reflection</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Plan Card */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Current Week Plan</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {currentPlan ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPlanningWizard(true)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      ) : (
                        <Button
                          onClick={() => setShowPlanningWizard(true)}
                          className="flex items-center space-x-2"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Create Plan</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {currentPlan ? (
                    <div className="space-y-4">
                      {currentPlan.intentions && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-blue-900 mb-1">Weekly Intentions</h4>
                          <p className="text-blue-800">{currentPlan.intentions}</p>
                        </div>
                      )}

                      <div>
                        <h4 className="font-medium mb-3">Goals for this week:</h4>
                        <div className="space-y-2">
                          {currentPlan.weeklyGoals.map((goal, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              {goal.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-gray-400" />
                              )}
                              <div className="flex-1">
                                <p className={`font-medium ${goal.completed ? 'line-through text-gray-500' : ''}`}>
                                  {goal.title}
                                </p>
                                {goal.description && (
                                  <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                                )}
                              </div>
                              <Badge variant={goal.completed ? 'default' : 'secondary'}>
                                Priority {goal.priority}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No plan for this week yet</p>
                      <p className="text-sm">Create a plan to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions & Status */}
              <div className="space-y-4">
                {/* Week Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Week Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {summary ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Goal Progress</span>
                          <span className="font-medium">{summary.completedGoals}/{summary.totalGoals}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${summary.completionRate}%` }}
                          />
                        </div>
                        {summary.satisfactionRating && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Satisfaction</span>
                            <span className="font-medium">{summary.satisfactionRating}/10</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('planning')}
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Weekly Planning
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('reflection')}
                      disabled={!currentPlan}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Weekly Reflection
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab('dashboard')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Progress Dashboard
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Planning Tab */}
          <TabsContent value="planning">
            <WeeklyPlanningWizard
              initialPlan={currentPlan}
              currentDate={currentDate}
              onSave={handleSavePlan}
              onCancel={() => setActiveTab('overview')}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Reflection Tab */}
          <TabsContent value="reflection">
            {currentPlan ? (
              <WeeklyReflectionForm
                initialReflection={currentReflection}
                weeklyPlan={currentPlan}
                onSave={handleSaveReflection}
                onCancel={() => setActiveTab('overview')}
                isLoading={isLoading}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                  <h3 className="text-lg font-semibold mb-2">No Plan Available</h3>
                  <p className="text-gray-600 mb-4">
                    You need to create a weekly plan before you can reflect on it.
                  </p>
                  <Button onClick={() => setActiveTab('planning')}>
                    Create Weekly Plan
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <WeekProgressDashboard
              weeklyPlans={allPlans}
              weeklyReflections={allReflections}
              onExport={handleExport}
              onViewPlan={(plan) => {
                setCurrentPlan(plan);
                setActiveTab('planning');
              }}
              onViewReflection={(reflection) => {
                setCurrentReflection(reflection);
                setActiveTab('reflection');
              }}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <Dialog open={showPlanningWizard} onOpenChange={setShowPlanningWizard}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <WeeklyPlanningWizard
            initialPlan={currentPlan}
            currentDate={currentDate}
            onSave={handleSavePlan}
            onCancel={() => setShowPlanningWizard(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showReflectionForm} onOpenChange={setShowReflectionForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {currentPlan && (
            <WeeklyReflectionForm
              initialReflection={currentReflection}
              weeklyPlan={currentPlan}
              onSave={handleSaveReflection}
              onCancel={() => setShowReflectionForm(false)}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and restore previous versions of your weekly plan.
            </DialogDescription>
          </DialogHeader>
          <VersionHistoryPanel
            versions={versionHistory}
            onRevert={handleVersionRevert}
            entityType="Weekly Plan"
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}