"use client";

import React, { useState } from "react";
import { StreamlinedDailyPlanner } from "@/components/daily-planning/StreamlinedDailyPlanner";

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  return (
    <main className="h-screen">
      <StreamlinedDailyPlanner
        date={currentDate}
        onDateChange={handleDateChange}
      />
    </main>
  );
}
