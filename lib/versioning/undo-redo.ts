import { prisma } from "@/lib/db";
import type { EntityType, UndoRedoAction, AuditLog } from "@/lib/types";
import { VersionManager } from "./version-manager";

export class UndoRedoManager {
  static async getUndoHistory(
    userId: string,
    limit: number = 10
  ): Promise<UndoRedoAction[]> {
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        userId,
        changeType: { in: ["CREATE", "UPDATE", "DELETE"] },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    return recentLogs.map((log) => ({
      id: log.id,
      description: this.generateActionDescription(log),
      timestamp: log.timestamp,
      entityType: log.entityType as EntityType,
      entityId: log.entityId,
      canUndo: true, // Could add logic to determine if undoable
    }));
  }

  static async getLastUserAction(userId: string): Promise<UndoRedoAction | null> {
    const lastLog = await prisma.auditLog.findFirst({
      where: {
        userId,
        changeType: { in: ["CREATE", "UPDATE", "DELETE"] },
      },
      orderBy: { timestamp: "desc" },
    });

    if (!lastLog) return null;

    return {
      id: lastLog.id,
      description: this.generateActionDescription(lastLog),
      timestamp: lastLog.timestamp,
      entityType: lastLog.entityType as EntityType,
      entityId: lastLog.entityId,
      canUndo: true,
    };
  }

  static async undoLastAction(userId: string): Promise<{
    success: boolean;
    message: string;
    data?: Record<string, any>;
  }> {
    try {
      const lastAction = await this.getLastUserAction(userId);

      if (!lastAction) {
        return { success: false, message: "No actions to undo" };
      }

      return await this.undoAction(lastAction.id, userId);
    } catch (error) {
      console.error("Failed to undo last action:", error);
      return { success: false, message: "Failed to undo action" };
    }
  }

  static async undoAction(
    auditLogId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: Record<string, any>;
  }> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get the audit log entry
        const auditLog = await tx.auditLog.findUnique({
          where: { id: auditLogId },
        });

        if (!auditLog) {
          return { success: false, message: "Audit log entry not found" };
        }

        if (auditLog.userId !== userId) {
          return { success: false, message: "Unauthorized to undo this action" };
        }

        const entityType = auditLog.entityType as EntityType;
        const changeType = auditLog.changeType;

        let result: Record<string, any> | null = null;
        let message = "";

        switch (changeType) {
          case "CREATE":
            // For CREATE, we need to DELETE (mark as deleted or actually delete)
            // This depends on the entity type and business logic
            result = await this.undoCreate(entityType, auditLog.entityId, userId);
            message = "Creation undone - entity marked as deleted";
            break;

          case "UPDATE":
            // For UPDATE, revert to the before state
            if (auditLog.beforeData) {
              const revertResult = await VersionManager.createVersion(
                entityType,
                auditLog.entityId,
                userId,
                auditLog.beforeData as Record<string, any>,
                "RESTORE",
                auditLog.afterData as Record<string, any> | null,
                `Undoing action: ${this.generateActionDescription(auditLog)}`
              );
              result = auditLog.beforeData as Record<string, any>;
              message = "Update undone - reverted to previous state";
            } else {
              return { success: false, message: "No previous state to revert to" };
            }
            break;

          case "DELETE":
            // For DELETE, restore the entity
            if (auditLog.beforeData) {
              const restoreResult = await VersionManager.createVersion(
                entityType,
                auditLog.entityId,
                userId,
                auditLog.beforeData as Record<string, any>,
                "RESTORE",
                null,
                `Undoing deletion: ${this.generateActionDescription(auditLog)}`
              );
              result = auditLog.beforeData as Record<string, any>;
              message = "Deletion undone - entity restored";
            } else {
              return { success: false, message: "No data to restore" };
            }
            break;

          default:
            return { success: false, message: "Cannot undo this type of action" };
        }

        return {
          success: true,
          message,
          data: result || {},
        };
      });
    } catch (error) {
      console.error("Failed to undo action:", error);
      return { success: false, message: "Failed to undo action" };
    }
  }

  private static async undoCreate(
    entityType: EntityType,
    entityId: string,
    userId: string
  ): Promise<Record<string, any> | null> {
    // Mark entity as deleted rather than actually deleting
    // This preserves referential integrity and audit trail
    const deletedData = { deleted: true, deletedAt: new Date(), deletedBy: userId };

    switch (entityType) {
      case "WEEKLY_PLAN":
        await prisma.weeklyPlan.update({
          where: { id: entityId },
          data: { status: "ARCHIVED" }, // Use status instead of hard delete
        });
        break;

      case "WEEKLY_REFLECTION":
        // For reflections, we might actually delete since they're less critical
        await prisma.weeklyReflection.delete({
          where: { id: entityId },
        });
        break;

      case "TASK":
        await prisma.task.update({
          where: { id: entityId },
          data: { status: "BLOCKED" }, // Mark as blocked instead of delete
        });
        break;

      default:
        throw new Error(`Unsupported entity type for undo create: ${entityType}`);
    }

    return deletedData;
  }

  static generateActionDescription(auditLog: any): string {
    const entityType = auditLog.entityType.toLowerCase().replace("_", " ");
    const changeType = auditLog.changeType.toLowerCase();

    if (auditLog.changeDescription) {
      return auditLog.changeDescription;
    }

    switch (auditLog.changeType) {
      case "CREATE":
        return `Created ${entityType}`;
      case "UPDATE":
        return `Updated ${entityType}`;
      case "DELETE":
        return `Deleted ${entityType}`;
      case "RESTORE":
        return `Restored ${entityType}`;
      default:
        return `Modified ${entityType}`;
    }
  }

  static async canUndo(auditLogId: string, userId: string): Promise<boolean> {
    try {
      const auditLog = await prisma.auditLog.findUnique({
        where: { id: auditLogId },
      });

      if (!auditLog || auditLog.userId !== userId) {
        return false;
      }

      // Check if there are any conflicting changes after this action
      const laterChanges = await prisma.auditLog.findMany({
        where: {
          entityType: auditLog.entityType,
          entityId: auditLog.entityId,
          timestamp: { gt: auditLog.timestamp },
        },
      });

      // Simple check: if there are later changes, undoing might be complex
      // In a more sophisticated system, you'd analyze the conflicts
      return laterChanges.length === 0;
    } catch (error) {
      console.error("Error checking if action can be undone:", error);
      return false;
    }
  }

  static async getUserActionStats(userId: string): Promise<{
    totalActions: number;
    undoableActions: number;
    lastActionAt?: Date;
  }> {
    const [totalActions, recentActions] = await Promise.all([
      prisma.auditLog.count({
        where: { userId },
      }),
      prisma.auditLog.findMany({
        where: {
          userId,
          changeType: { in: ["CREATE", "UPDATE", "DELETE"] },
        },
        orderBy: { timestamp: "desc" },
        take: 10,
      }),
    ]);

    const undoableActions = recentActions.length; // Simplified
    const lastActionAt = recentActions[0]?.timestamp;

    return {
      totalActions,
      undoableActions,
      lastActionAt: lastActionAt || undefined,
    };
  }
}