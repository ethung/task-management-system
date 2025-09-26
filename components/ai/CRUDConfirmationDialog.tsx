"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface CRUDConfirmation {
  action: "create" | "update" | "delete";
  entity: string;
  changes: Record<string, any>;
  risks: string[];
  recommendation: "proceed" | "caution" | "abort";
  reasoning: string;
}

interface CRUDConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "create" | "update" | "delete";
  entity: string;
  changes: Record<string, any>;
  onConfirm: () => void;
  onCancel: () => void;
}

const actionColors = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
};

const recommendationIcons = {
  proceed: <CheckCircle className="h-4 w-4 text-green-600" />,
  caution: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
  abort: <XCircle className="h-4 w-4 text-red-600" />,
};

const recommendationColors = {
  proceed: "border-green-200 bg-green-50",
  caution: "border-yellow-200 bg-yellow-50",
  abort: "border-red-200 bg-red-50",
};

export function CRUDConfirmationDialog({
  open,
  onOpenChange,
  action,
  entity,
  changes,
  onConfirm,
  onCancel,
}: CRUDConfirmationDialogProps) {
  const [confirmation, setConfirmation] = useState<CRUDConfirmation | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfirmation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/crud-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, entity, changes }),
      });

      if (response.ok) {
        const data = await response.json();
        setConfirmation(data.confirmation);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to get AI confirmation");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && !confirmation) {
      fetchConfirmation();
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm();
    setConfirmation(null);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel();
    setConfirmation(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge className={actionColors[action]}>
              {action.toUpperCase()}
            </Badge>
            Confirm {action} {entity}
          </DialogTitle>
          <DialogDescription>
            AI is analyzing this operation for potential risks and
            recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Analyzing...</span>
            </div>
          )}

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {confirmation && (
            <div className="space-y-3">
              <Alert
                className={recommendationColors[confirmation.recommendation]}
              >
                <div className="flex items-start gap-2">
                  {recommendationIcons[confirmation.recommendation]}
                  <div>
                    <div className="font-medium capitalize">
                      {confirmation.recommendation}
                    </div>
                    <div className="mt-1 text-sm">{confirmation.reasoning}</div>
                  </div>
                </div>
              </Alert>

              {confirmation.risks.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Identified Risks:</div>
                  <ul className="space-y-1 text-sm">
                    {confirmation.risks.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0 text-yellow-600" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-medium">Changes:</div>
                <div className="rounded bg-muted p-2 font-mono text-xs">
                  {Object.entries(changes).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground">{key}:</span>{" "}
                      {JSON.stringify(value)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || error !== null}
            variant={
              confirmation?.recommendation === "abort"
                ? "destructive"
                : "default"
            }
          >
            {confirmation?.recommendation === "abort"
              ? "Proceed Anyway"
              : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
