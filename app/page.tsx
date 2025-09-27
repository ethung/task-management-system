"use client";

import React, { useState } from "react";
import { DailyMarkdownPlanner } from "@/components/daily-planning/DailyMarkdownPlanner";

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleSave = async (content: string, date: Date) => {
    // For demo purposes, just log the content
    console.log("Saving daily plan for", date.toDateString(), ":", content);

    // In a real app, this would save to your database
    // await saveDailyPlan(content, date);
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl">
        <header className="py-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Daily Planner</h1>
          <p className="mt-2 text-gray-600">
            Minimal, markdown-first daily planning
          </p>
        </header>

        <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
          <DailyMarkdownPlanner
            date={currentDate}
            onDateChange={handleDateChange}
            onSave={handleSave}
          />
        </div>
      </div>
    </main>
  );
}
