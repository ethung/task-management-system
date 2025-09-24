'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, History } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { UndoRedoAction } from '@/lib/types';

interface UndoRedoButtonProps {
  onUndo: () => Promise<void>;
  undoHistory: UndoRedoAction[];
  isLoading?: boolean;
  disabled?: boolean;
}

export function UndoRedoButton({
  onUndo,
  undoHistory,
  isLoading = false,
  disabled = false
}: UndoRedoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const canUndo = undoHistory.length > 0 && !disabled && !isLoading;
  const lastAction = undoHistory[0];

  const handleUndo = async () => {
    setIsOpen(false);
    await onUndo();
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleUndo}
        disabled={!canUndo}
        className="flex items-center space-x-2"
      >
        <Undo2 className="h-4 w-4" />
        <span>Undo</span>
        {isLoading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        )}
      </Button>

      {undoHistory.length > 0 && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <History className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Recent Actions</h4>
                <Badge variant="secondary">{undoHistory.length}</Badge>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {undoHistory.map((action, index) => (
                  <div
                    key={action.id}
                    className={`p-2 rounded border text-sm ${
                      index === 0
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {action.description}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(action.timestamp)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {action.entityType.toLowerCase().replace('_', ' ')}
                      {index === 0 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Can undo
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {lastAction && (
                <div className="pt-2 border-t">
                  <Button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className="w-full"
                    size="sm"
                  >
                    <Undo2 className="h-4 w-4 mr-2" />
                    Undo: {lastAction.description}
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}