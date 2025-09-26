"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Send,
  Bot,
  User,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAI } from "@/hooks/useAI";
import { AIMessage, ProductivityContext } from "@/lib/ai/types/index";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChatMessage extends AIMessage {
  id: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatInterfaceProps {
  productivityContext?: ProductivityContext;
  placeholder?: string;
  maxMessages?: number;
  enablePatterns?: boolean;
  className?: string;
}

export function ChatInterface({
  productivityContext,
  placeholder = "Ask your productivity assistant anything...",
  maxMessages = 50,
  enablePatterns = true,
  className = "",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hello! I'm your productivity expert. I'm here to help you with planning, task breakdown, prioritization, and productivity insights${productivityContext?.framework ? ` using ${productivityContext.framework.toUpperCase()} methodology` : ""}.\n\nHow can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [showingPatterns, setShowingPatterns] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ai = useAI({
    enablePatternRecognition: enablePatterns,
    enableAutoComplete: true,
    enableCRUDValidation: true,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || ai.isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Create messages for AI
    const aiMessages: AIMessage[] = messages
      .filter((m) => !m.isStreaming)
      .slice(-10) // Keep last 10 messages for context
      .concat([userMessage])
      .map(({ role, content }) => ({ role, content }));

    // Get AI response
    const response = await ai.chat(aiMessages, productivityContext);

    if (response) {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        metadata: response.metadata,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Trim messages if too many
      setMessages((prev) => {
        if (prev.length > maxMessages) {
          return [prev[0], ...prev.slice(-maxMessages + 1)];
        }
        return prev;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatFramework = (framework?: string) => {
    if (!framework) return "";
    switch (framework.toLowerCase()) {
      case "gtd":
        return "GTD";
      case "full-focus":
        return "Full Focus";
      case "hybrid":
        return "Hybrid";
      default:
        return framework;
    }
  };

  const MessageBubble = ({ message }: { message: ChatMessage }) => {
    const isUser = message.role === "user";
    const Icon = isUser ? User : Bot;

    return (
      <div
        className={`mb-4 flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
            isUser ? "bg-blue-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          <Icon size={16} />
        </div>

        <div
          className={`max-w-[80%] flex-1 ${isUser ? "text-right" : "text-left"}`}
        >
          <div
            className={`inline-block rounded-lg p-3 ${
              isUser
                ? "rounded-br-none bg-blue-500 text-white"
                : "rounded-bl-none bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
            }`}
          >
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          </div>

          <div
            className={`mt-1 text-xs text-gray-500 ${isUser ? "text-right" : "text-left"}`}
          >
            {message.timestamp.toLocaleTimeString()}
            {message.metadata?.confidence && (
              <span className="ml-2">
                Confidence: {Math.round(message.metadata.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`flex h-full flex-col ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Productivity Assistant
          </div>

          <div className="flex gap-2">
            {productivityContext?.framework && (
              <Badge variant="outline">
                {formatFramework(productivityContext.framework)}
              </Badge>
            )}
            {productivityContext?.userPreferences.expertiseLevel && (
              <Badge variant="secondary">
                {productivityContext.userPreferences.expertiseLevel}
              </Badge>
            )}
          </div>
        </CardTitle>

        {productivityContext?.currentWorkload && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Current workload: {productivityContext.currentWorkload.tasksCount}{" "}
            tasks
            {productivityContext.currentWorkload.urgentTasks > 0 && (
              <span className="text-orange-600 dark:text-orange-400">
                , {productivityContext.currentWorkload.urgentTasks} urgent
              </span>
            )}
            {productivityContext.currentWorkload.overdueItems > 0 && (
              <span className="text-red-600 dark:text-red-400">
                , {productivityContext.currentWorkload.overdueItems} overdue
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col">
        {/* Error Display */}
        {ai.error && (
          <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {ai.error}
              <Button
                variant="outline"
                size="sm"
                onClick={ai.clearError}
                className="ml-2 h-6 px-2 text-xs"
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Messages */}
        <div className="mb-4 flex-1 space-y-2 overflow-y-auto">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {ai.isLoading && (
            <div className="mb-4 flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div className="flex-1">
                <div className="inline-block rounded-lg rounded-bl-none bg-gray-100 p-3 dark:bg-gray-800">
                  <div className="text-gray-600 dark:text-gray-400">
                    Thinking...
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            rows={2}
            className="flex-1 resize-none"
            disabled={ai.isLoading}
          />

          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || ai.isLoading}
            size="sm"
            className="h-20 px-3"
          >
            {ai.isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Help me plan my day")}
            disabled={ai.isLoading}
          >
            Plan My Day
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Break down this project:")}
            disabled={ai.isLoading}
          >
            Break Down Project
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Help me prioritize these tasks:")}
            disabled={ai.isLoading}
          >
            Prioritize Tasks
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInput("Let's do a weekly reflection")}
            disabled={ai.isLoading}
          >
            Weekly Reflection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChatInterface;
