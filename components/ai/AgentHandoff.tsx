"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Users,
  Brain,
  CheckCircle,
  Info,
  Sparkles,
  User,
  Bot,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: Array<{
    name: string;
    description: string;
    confidence: number;
  }>;
}

interface AgentHandoffProps {
  currentAgent: string;
  suggestedAgent?: string;
  confidence?: number;
  reasoning?: string;
  agents: Agent[];
  onAgentSelect: (agentId: string) => void;
  onHandoffConfirm: () => void;
  onHandoffDecline: () => void;
  showHandoffSuggestion?: boolean;
  className?: string;
}

const AGENT_ICONS = {
  "base-productivity": Brain,
  "resume-expert": User,
  "career-coach": Users,
  "interview-prep": CheckCircle,
  "project-manager": Sparkles,
} as const;

const AGENT_COLORS = {
  "base-productivity":
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "resume-expert":
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "career-coach":
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "interview-prep":
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "project-manager":
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
} as const;

export function AgentHandoff({
  currentAgent,
  suggestedAgent,
  confidence = 0,
  reasoning,
  agents,
  onAgentSelect,
  onHandoffConfirm,
  onHandoffDecline,
  showHandoffSuggestion = false,
  className = "",
}: AgentHandoffProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>(currentAgent);
  const [showAgentList, setShowAgentList] = useState(false);

  const currentAgentData = agents.find((a) => a.id === currentAgent);
  const suggestedAgentData = suggestedAgent
    ? agents.find((a) => a.id === suggestedAgent)
    : null;

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId);
    onAgentSelect(agentId);
    setShowAgentList(false);
  };

  const getAgentIcon = (agentId: string) => {
    const IconComponent =
      AGENT_ICONS[agentId as keyof typeof AGENT_ICONS] || Bot;
    return <IconComponent className="h-4 w-4" />;
  };

  const getAgentColor = (agentId: string) => {
    return (
      AGENT_COLORS[agentId as keyof typeof AGENT_COLORS] ||
      "bg-gray-100 text-gray-800"
    );
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.8) return "text-green-600";
    if (conf >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className={className}>
      {/* Current Agent Display */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4" />
            Current Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge className={getAgentColor(currentAgent)}>
                {getAgentIcon(currentAgent)}
                <span className="ml-1">
                  {currentAgentData?.name || "Unknown Agent"}
                </span>
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentAgentData?.description}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAgentList(!showAgentList)}
            >
              Switch Agent
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Handoff Suggestion */}
      {showHandoffSuggestion && suggestedAgentData && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <div>
                <p className="font-medium">Agent Handoff Suggested</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Based on your request, I recommend switching to a specialized
                  agent better suited for this task.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded border bg-white p-3">
                <Badge className={getAgentColor(currentAgent)}>
                  {getAgentIcon(currentAgent)}
                  <span className="ml-1">{currentAgentData?.name}</span>
                </Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge className={getAgentColor(suggestedAgent)}>
                  {getAgentIcon(suggestedAgent)}
                  <span className="ml-1">
                    {suggestedAgentData?.name || suggestedAgent}
                  </span>
                </Badge>
                <div className="ml-auto flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${getConfidenceColor(confidence)}`}
                  >
                    {Math.round(confidence * 100)}% match
                  </span>
                </div>
              </div>

              {reasoning && (
                <p className="text-xs text-muted-foreground">
                  <strong>Reason:</strong> {reasoning}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={onHandoffConfirm}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Switch to {suggestedAgentData.name}
                </Button>
                <Button size="sm" variant="outline" onClick={onHandoffDecline}>
                  Stay with Current Agent
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Agent Selection List */}
      {showAgentList && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Available Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`cursor-pointer rounded border p-3 transition-colors hover:bg-muted/50 ${
                    selectedAgent === agent.id
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => handleAgentChange(agent.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getAgentColor(agent.id)}>
                        {getAgentIcon(agent.id)}
                        <span className="ml-1">{agent.name}</span>
                      </Badge>
                      {selectedAgent === agent.id && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                  <p className="ml-6 mt-1 text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                  <div className="ml-6 mt-2 flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((capability) => (
                      <Badge
                        key={capability.name}
                        variant="secondary"
                        className="text-xs"
                      >
                        {capability.name}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{agent.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Capabilities */}
      {currentAgentData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Current Agent Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentAgentData.capabilities.map((capability) => (
                <div
                  key={capability.name}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{capability.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {capability.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(capability.confidence * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
