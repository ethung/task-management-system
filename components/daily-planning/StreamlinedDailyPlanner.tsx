"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  CheckCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { UnifiedMarkdownEditor } from "@/components/ui/unified-markdown-editor";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { cn } from "@/lib/utils/cn";

interface StreamlinedDailyPlannerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  initialContent?: string;
  className?: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error" | "offline";
type NetworkStatus = "online" | "offline" | "unknown";

const generateDailyTemplate = (date: Date) => {
  const dayName = format(date, "EEEE");
  const fullDate = format(date, "MMMM d, yyyy");

  return `# ${dayName}, ${fullDate}

## Daily Goals
1.
2.
3.

## Tasks
- [ ]
- [ ]
- [ ]

## Notes

`;
};

// Mock API function - replace with actual API integration
const saveDailyPlan = async (content: string, date: Date): Promise<void> => {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 300 + Math.random() * 200)
  );

  console.log("Saving daily plan for", date.toDateString(), ":", content);
};

export function StreamlinedDailyPlanner({
  date,
  onDateChange,
  initialContent,
  className,
}: StreamlinedDailyPlannerProps) {
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>("unknown");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useLocalStorage<{
    [key: string]: string;
  }>("daily-planner-offline-changes", {});

  // Debounce content changes for autosave (increased to 5000ms to prevent flashing)
  const debouncedContent = useDebounce(content, 5000);

  // Initialize content when date changes or initial content is provided
  useEffect(() => {
    const dateKey = format(date, "yyyy-MM-dd");

    if (initialContent) {
      setContent(initialContent);
    } else if (pendingChanges[dateKey]) {
      // Load from offline storage if available
      setContent(pendingChanges[dateKey]);
    } else {
      setContent(generateDailyTemplate(date));
    }
  }, [date, initialContent, pendingChanges]);

  // Network status detection
  useEffect(() => {
    const updateNetworkStatus = () => {
      setNetworkStatus(navigator.onLine ? "online" : "offline");
    };

    // Initial check
    updateNetworkStatus();

    // Listen for network changes
    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  // Auto-save functionality
  const saveContent = useCallback(
    async (contentToSave: string, force = false) => {
      const dateKey = format(date, "yyyy-MM-dd");

      // Don't save if content hasn't changed and not forced
      if (!force && contentToSave === initialContent) {
        return;
      }

      if (networkStatus === "offline") {
        // Save to local storage when offline
        setPendingChanges((prev) => ({
          ...prev,
          [dateKey]: contentToSave,
        }));
        setSaveStatus("offline");
        return;
      }

      try {
        setSaveStatus("saving");
        await saveDailyPlan(contentToSave, date);

        // Clear pending changes on successful save
        setPendingChanges((prev) => {
          const newPending = { ...prev };
          delete newPending[dateKey];
          return newPending;
        });

        setSaveStatus("saved");
        setLastSaved(new Date());

        // Reset to idle after showing saved status
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Failed to save:", error);
        // Save to local storage as backup
        setPendingChanges((prev) => ({
          ...prev,
          [dateKey]: contentToSave,
        }));
        setSaveStatus("error");

        // Reset to idle after showing error
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [date, initialContent, networkStatus, setPendingChanges]
  );

  // Auto-save when debounced content changes
  useEffect(() => {
    if (debouncedContent && debouncedContent !== generateDailyTemplate(date)) {
      saveContent(debouncedContent);
    }
  }, [debouncedContent, date, saveContent]);

  // Sync pending changes when coming back online
  useEffect(() => {
    if (networkStatus === "online" && Object.keys(pendingChanges).length > 0) {
      setSaveStatus("saving");

      // Sync all pending changes
      const syncPromises = Object.entries(pendingChanges).map(
        async ([dateKey, content]) => {
          try {
            const syncDate = new Date(dateKey);
            await saveDailyPlan(content, syncDate);
            return dateKey;
          } catch (error) {
            console.error(`Failed to sync changes for ${dateKey}:`, error);
            return null;
          }
        }
      );

      Promise.allSettled(syncPromises).then((results) => {
        const successfulSyncs = results
          .filter(
            (result): result is PromiseFulfilledResult<string> =>
              result.status === "fulfilled" && result.value !== null
          )
          .map((result) => result.value);

        if (successfulSyncs.length > 0) {
          // Remove successfully synced changes
          setPendingChanges((prev) => {
            const updated = { ...prev };
            successfulSyncs.forEach((dateKey) => delete updated[dateKey]);
            return updated;
          });
        }

        setSaveStatus(
          successfulSyncs.length === Object.keys(pendingChanges).length
            ? "saved"
            : "error"
        );
        setLastSaved(new Date());
        setTimeout(() => setSaveStatus("idle"), 2000);
      });
    }
  }, [networkStatus, pendingChanges, setPendingChanges]);

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + (direction === "next" ? 1 : -1));
    onDateChange(newDate);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
  };

  const handleManualSave = () => {
    saveContent(content, true);
  };

  const retryFailedSave = () => {
    saveContent(content, true);
  };

  // Status indicator component
  const StatusIndicator = () => {
    const dateKey = format(date, "yyyy-MM-dd");
    const hasPendingChanges = pendingChanges[dateKey];

    if (networkStatus === "offline" || hasPendingChanges) {
      return (
        <div className="fixed bottom-4 right-4 flex items-center space-x-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 shadow-lg">
          <WifiOff className="h-4 w-4" />
          <span>Working offline - changes saved locally</span>
        </div>
      );
    }

    if (saveStatus === "saving") {
      return (
        <div className="fixed bottom-4 right-4 flex items-center space-x-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 shadow-lg">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <span>Syncing changes...</span>
        </div>
      );
    }

    if (saveStatus === "saved") {
      return (
        <div className="fixed bottom-4 right-4 flex items-center space-x-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 shadow-lg">
          <CheckCircle className="h-4 w-4" />
          <span>Saved {lastSaved && format(lastSaved, "h:mm a")}</span>
        </div>
      );
    }

    if (saveStatus === "error") {
      return (
        <div className="fixed bottom-4 right-4 flex items-center space-x-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <span>Save failed</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={retryFailedSave}
            className="h-auto p-1 text-red-800 hover:text-red-900"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={cn("flex h-screen flex-col bg-white", className)}>
      {/* Minimal header - only essential navigation */}
      <div className="flex items-center justify-center border-b bg-white p-3 shadow-sm">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate("prev")}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h1 className="min-w-[200px] text-center text-lg font-medium">
            {format(date, "EEEE, MMMM d, yyyy")}
          </h1>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateDate("next")}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Network status indicator in header */}
        <div className="absolute right-4 flex items-center space-x-2">
          {networkStatus === "offline" ? (
            <WifiOff className="h-4 w-4 text-gray-400" />
          ) : (
            <Wifi className="h-4 w-4 text-green-600" />
          )}
        </div>
      </div>

      {/* Full-height unified markdown editor */}
      <div className="flex-1 overflow-hidden">
        <UnifiedMarkdownEditor
          value={content}
          onChange={handleContentChange}
          placeholder="Start planning your day..."
          autoFocus={true}
          onSave={handleManualSave}
          className="h-full"
        />
      </div>

      {/* Floating status indicator */}
      <StatusIndicator />
    </div>
  );
}
