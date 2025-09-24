'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  History,
  RotateCcw,
  Eye,
  Clock,
  User,
  FileText,
  Plus,
  Edit,
  Trash2,
  RotateCcw as RotateLeft
} from 'lucide-react';
import type { EntityVersion, VersionHistoryEntry } from '@/lib/types';

interface VersionHistoryPanelProps {
  versions: EntityVersion[];
  onRevert: (version: number) => Promise<void>;
  onViewVersion?: (version: EntityVersion) => void;
  isLoading?: boolean;
  entityType: string;
}

export function VersionHistoryPanel({
  versions,
  onRevert,
  onViewVersion,
  isLoading = false,
  entityType
}: VersionHistoryPanelProps) {
  const [selectedVersion, setSelectedVersion] = useState<EntityVersion | null>(null);
  const [isReverting, setIsReverting] = useState<number | null>(null);

  const handleRevert = async (version: number) => {
    setIsReverting(version);
    try {
      await onRevert(version);
    } finally {
      setIsReverting(null);
    }
  };

  const getChangeTypeIcon = (version: EntityVersion, previousVersion?: EntityVersion) => {
    if (!previousVersion) {
      return <Plus className="h-4 w-4 text-green-600" />;
    }

    // Simple change detection - in a real app you'd do deep comparison
    const hasChanges = JSON.stringify(version.versionData) !== JSON.stringify(previousVersion.versionData);
    if (hasChanges) {
      return <Edit className="h-4 w-4 text-blue-600" />;
    }

    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  const getChangeTypeName = (version: EntityVersion, previousVersion?: EntityVersion) => {
    if (!previousVersion) return 'Created';

    const hasChanges = JSON.stringify(version.versionData) !== JSON.stringify(previousVersion.versionData);
    if (hasChanges) return 'Updated';

    return 'No changes';
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  const generateDiffSummary = (version: EntityVersion, previousVersion?: EntityVersion) => {
    if (!previousVersion) return 'Initial version';

    const current = version.versionData;
    const previous = previousVersion.versionData;
    const changes: string[] = [];

    // Simple diff for common fields
    Object.keys(current).forEach(key => {
      if (JSON.stringify(current[key]) !== JSON.stringify(previous[key])) {
        changes.push(key);
      }
    });

    if (changes.length === 0) return 'No changes';
    return `Modified: ${changes.join(', ')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <span>Version History</span>
          <Badge variant="secondary">{versions.length} versions</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versions.map((version, index) => {
            const previousVersion = versions[index + 1];
            const isActive = version.isActive;
            const isLatest = index === 0;

            return (
              <div
                key={version.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isActive
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getChangeTypeIcon(version, previousVersion)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">
                          Version {version.version}
                        </span>
                        {isActive && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                        {isLatest && !isActive && (
                          <Badge variant="outline" className="text-xs">
                            Latest
                          </Badge>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 mt-1">
                        {getChangeTypeName(version, previousVersion)}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        {generateDiffSummary(version, previousVersion)}
                      </div>

                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(version.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>User {version.createdBy.slice(-8)}</span>
                        </div>
                      </div>

                      {version.tags && version.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {version.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 ml-2">
                    {onViewVersion && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewVersion(version)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}

                    {!isActive && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Revert to Version {version.version}</DialogTitle>
                            <DialogDescription>
                              This will create a new version with the data from version {version.version}.
                              Your current data will be preserved in the version history.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <h4 className="font-medium text-sm mb-2">Changes in this version:</h4>
                              <p className="text-sm text-gray-600">
                                {generateDiffSummary(version, previousVersion)}
                              </p>
                            </div>

                            <div className="flex justify-end space-x-2">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button
                                onClick={() => handleRevert(version.version)}
                                disabled={isReverting === version.version}
                                className="flex items-center space-x-2"
                              >
                                {isReverting === version.version ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  <RotateLeft className="h-4 w-4" />
                                )}
                                <span>Revert</span>
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {versions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No version history available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}