"use client";

import { useState } from "react";
import {
  Bot,
  Brain,
  Sparkles,
  MessageSquare,
  Target,
  BarChart3,
  Settings,
  User,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// AI Components
import { ChatInterface } from "@/components/ai/ChatInterface";
import { SmartAutocomplete } from "@/components/ai/SmartAutocomplete";
import { ProductivityDashboard } from "@/components/ai/ProductivityDashboard";
import { PatternInsights } from "@/components/ai/PatternInsights";
import { ProactiveSuggestions } from "@/components/ai/ProactiveSuggestions";

// Types
import {
  ProductivityContext,
  ProductivityFramework,
} from "@/lib/ai/types/index";

export default function AIDemoPage() {
  const [selectedFramework, setSelectedFramework] =
    useState<ProductivityFramework>("hybrid");
  const [communicationStyle, setCommunicationStyle] = useState<
    "concise" | "detailed" | "balanced"
  >("balanced");
  const [expertiseLevel, setExpertiseLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");

  // Demo text inputs for autocomplete testing
  const [taskInput, setTaskInput] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [projectInput, setProjectInput] = useState("");

  // Mock productivity context
  const productivityContext: ProductivityContext = {
    framework: selectedFramework,
    userPreferences: {
      communicationStyle,
      expertiseLevel,
    },
    currentWorkload: {
      tasksCount: 12,
      urgentTasks: 3,
      overdueItems: 1,
    },
    historicalPatterns: {
      completionRate: 0.78,
      averageTaskDuration: 45,
      peakProductivityHours: [9, 14, 16],
    },
  };

  const currentState = {
    tasksCompleted: 8,
    tasksRemaining: 4,
    averageCompletionTime: 45,
    energyLevel: "high",
    currentFocus: "deep work",
    recentPatterns: ["afternoon productivity spike", "friday slowdown"],
  };

  const demoPatterns = [
    {
      type: "recurring_task" as const,
      confidence: 0.92,
      description: "You consistently check emails at 9 AM and 2 PM",
      suggestion:
        "Consider blocking dedicated email times to reduce interruptions",
      data: { frequency: "daily", times: ["9:00", "14:00"] },
    },
    {
      type: "energy_cycle" as const,
      confidence: 0.87,
      description: "Your productivity peaks between 2-4 PM consistently",
      suggestion: "Schedule your most important work during peak energy hours",
      data: { peakHours: [14, 15, 16], lowHours: [11, 12, 17] },
    },
  ];

  return (
    <div className="container mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="flex items-center justify-center gap-3 text-4xl font-bold">
          <Brain className="h-10 w-10 text-blue-600" />
          AI Agent Integration System Demo
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          Experience the sophisticated AI-powered productivity assistant with
          deep framework expertise, smart autocomplete, pattern recognition, and
          expert agent orchestration.
        </p>

        {/* Status Badges */}
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Ollama Local AI
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Bot className="h-3 w-3 text-blue-500" />
            Expert Productivity Agent
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3 text-purple-500" />
            Smart Autocomplete
          </Badge>
          <Badge variant="outline" className="gap-1">
            <BarChart3 className="h-3 w-3 text-orange-500" />
            Pattern Recognition
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Target className="h-3 w-3 text-red-500" />
            Agent Orchestration
          </Badge>
        </div>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Productivity Framework
              </label>
              <Select
                value={selectedFramework}
                onValueChange={(value) =>
                  setSelectedFramework(value as ProductivityFramework)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gtd">GTD (Getting Things Done)</SelectItem>
                  <SelectItem value="full-focus">
                    Full Focus (Michael Hyatt)
                  </SelectItem>
                  <SelectItem value="hybrid">Hybrid Approach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Communication Style</label>
              <Select
                value={communicationStyle}
                onValueChange={(value) => setCommunicationStyle(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Expertise Level</label>
              <Select
                value={expertiseLevel}
                onValueChange={(value) => setExpertiseLevel(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Current Context:</strong>{" "}
            {productivityContext.currentWorkload.tasksCount} total tasks,
            {productivityContext.currentWorkload.urgentTasks} urgent,
            {productivityContext.currentWorkload.overdueItems} overdue •
            Completion Rate:{" "}
            {Math.round(
              (productivityContext.historicalPatterns?.completionRate || 0) *
                100
            )}
            % • Peak Hours:{" "}
            {productivityContext.historicalPatterns?.peakProductivityHours.join(
              ", "
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Demo Tabs */}
      <Tabs defaultValue="chat" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Expert Chat
          </TabsTrigger>
          <TabsTrigger value="autocomplete" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Smart Autocomplete
          </TabsTrigger>
          <TabsTrigger value="patterns" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Pattern Recognition
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <Brain className="h-4 w-4" />
            AI Dashboard
          </TabsTrigger>
        </TabsList>

        {/* Expert Chat Interface */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Expert Productivity Assistant
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat with your AI productivity expert. The agent understands{" "}
                {selectedFramework.toUpperCase()} methodology and provides
                measured, professional guidance based on your preferences and
                current workload.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <ChatInterface
                  productivityContext={productivityContext}
                  placeholder={`Ask your ${selectedFramework.toUpperCase()} expert anything about productivity, planning, or task management...`}
                  enablePatterns={true}
                  className="h-full"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Autocomplete Demo */}
        <TabsContent value="autocomplete" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Smart Autocomplete System
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Experience AI-powered text completion that understands
                productivity contexts and suggests relevant, actionable
                completions based on your patterns and framework preferences.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Task Autocomplete */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Task Description
                  </label>
                  <SmartAutocomplete
                    value={taskInput}
                    onChange={setTaskInput}
                    context="task"
                    userPatterns={[
                      "daily standup",
                      "code review",
                      "write documentation",
                    ]}
                  >
                    <Textarea
                      placeholder="Start typing a task description..."
                      rows={3}
                      className="w-full"
                    />
                  </SmartAutocomplete>
                  <p className="text-xs text-gray-500">
                    Try typing: "Review the", "Write a", "Schedule a", or
                    "Complete the"
                  </p>
                </div>

                {/* Goal Autocomplete */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Goal Setting</label>
                  <SmartAutocomplete
                    value={goalInput}
                    onChange={setGoalInput}
                    context="goal"
                    userPatterns={[
                      "quarterly objectives",
                      "performance metrics",
                      "skill development",
                    ]}
                  >
                    <Textarea
                      placeholder="Start typing a goal..."
                      rows={3}
                      className="w-full"
                    />
                  </SmartAutocomplete>
                  <p className="text-xs text-gray-500">
                    Try typing: "Increase", "Achieve", "Learn", or "Improve"
                  </p>
                </div>

                {/* Project Autocomplete */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Project Planning
                  </label>
                  <SmartAutocomplete
                    value={projectInput}
                    onChange={setProjectInput}
                    context="project"
                    userPatterns={[
                      "website redesign",
                      "team onboarding",
                      "system migration",
                    ]}
                  >
                    <Textarea
                      placeholder="Start typing a project description..."
                      rows={3}
                      className="w-full"
                    />
                  </SmartAutocomplete>
                  <p className="text-xs text-gray-500">
                    Try typing: "Launch the", "Migrate", "Design", or
                    "Implement"
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
                  How Smart Autocomplete Works:
                </h4>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>
                    • Uses AI to understand productivity context and suggest
                    relevant completions
                  </li>
                  <li>
                    • Learns from your patterns and framework preferences (
                    {selectedFramework.toUpperCase()})
                  </li>
                  <li>
                    • Provides framework-specific language (GTD next actions,
                    Full Focus goal structure)
                  </li>
                  <li>
                    • Filters suggestions based on your expertise level and
                    communication style
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pattern Recognition */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PatternInsights
              data={demoPatterns}
              userId="demo-user"
              timeframe="30d"
            />

            <ProactiveSuggestions
              currentState={currentState}
              onSuggestionAction={(suggestion, action) => {
                console.log("Demo suggestion action:", suggestion, action);
              }}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pattern Recognition Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium">What We Analyze:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Recurring task patterns and themes</li>
                    <li>• Time estimation accuracy over time</li>
                    <li>• Energy and productivity cycles</li>
                    <li>• Workload spikes and capacity planning</li>
                    <li>• Success patterns and optimization opportunities</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Actionable Insights:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Optimal scheduling recommendations</li>
                    <li>• Productivity framework adjustments</li>
                    <li>• Proactive workload management</li>
                    <li>• Energy-based task prioritization</li>
                    <li>• Habit formation suggestions</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <ProductivityDashboard
            userId="demo-user"
            currentState={currentState}
          />
        </TabsContent>
      </Tabs>

      {/* Features Summary */}
      <Card>
        <CardHeader>
          <CardTitle>AI Agent System Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <User className="h-4 w-4" />
                Expert Productivity Knowledge
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deep understanding of GTD, Full Focus, and hybrid methodologies
                with 15+ years of consulting experience persona.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <MessageSquare className="h-4 w-4" />
                Measured Expert Responses
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Professional, thoughtful guidance without verbosity or
                over-optimism, matching experienced consultant communication.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4" />
                Smart Autocomplete
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Context-aware text completion based on productivity frameworks,
                user patterns, and professional language.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <BarChart3 className="h-4 w-4" />
                Pattern Recognition
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced analysis of productivity cycles, recurring tasks, and
                behavioral patterns with proactive suggestions.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <Target className="h-4 w-4" />
                Agent Orchestration
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seamless handoff to specialized agents (resume expert, career
                coach) while maintaining context continuity.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="flex items-center gap-2 font-medium">
                <CheckCircle className="h-4 w-4" />
                CRUD Validation
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered confirmation workflows for destructive actions with
                intelligent risk assessment and guidance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
