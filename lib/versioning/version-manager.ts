import { prisma } from "@/lib/db";
import type { EntityType, ChangeType, AuditLog, EntityVersion } from "@/lib/types";

export class VersionManager {
  static async createVersion<T extends Record<string, any>>(
    entityType: EntityType,
    entityId: string,
    userId: string,
    data: T,
    changeType: ChangeType = "UPDATE",
    beforeData?: T | null,
    changeDescription?: string
  ): Promise<{ version: number; auditLog: AuditLog }> {
    return await prisma.$transaction(async (tx) => {
      // Get current highest version for this entity
      const lastVersion = await tx.entityVersion.findFirst({
        where: { entityType, entityId },
        orderBy: { version: "desc" },
      });

      const newVersion = (lastVersion?.version || 0) + 1;

      // Create new version snapshot
      const entityVersion = await tx.entityVersion.create({
        data: {
          entityType,
          entityId,
          versionData: data,
          version: newVersion,
          createdBy: userId,
          isActive: true,
        },
      });

      // Mark previous version as inactive
      if (lastVersion) {
        await tx.entityVersion.update({
          where: { id: lastVersion.id },
          data: { isActive: false },
        });
      }

      // Create audit log entry
      const auditLogEntry = await tx.auditLog.create({
        data: {
          entityType,
          entityId,
          userId,
          changeType,
          beforeData: beforeData as any || null,
          afterData: data,
          changeDescription,
          version: newVersion,
          parentVersion: lastVersion?.version || null,
        },
      });

      return {
        version: newVersion,
        auditLog: {
          id: auditLogEntry.id,
          entityType: auditLogEntry.entityType as EntityType,
          entityId: auditLogEntry.entityId,
          userId: auditLogEntry.userId,
          changeType: auditLogEntry.changeType as ChangeType,
          beforeData: auditLogEntry.beforeData as Record<string, any> | null,
          afterData: auditLogEntry.afterData as Record<string, any> | null,
          changeDescription: auditLogEntry.changeDescription,
          timestamp: auditLogEntry.timestamp,
          version: auditLogEntry.version,
          parentVersion: auditLogEntry.parentVersion,
        },
      };
    });
  }

  static async getVersionHistory(
    entityType: EntityType,
    entityId: string
  ): Promise<EntityVersion[]> {
    const versions = await prisma.entityVersion.findMany({
      where: { entityType, entityId },
      orderBy: { version: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return versions.map((v) => ({
      id: v.id,
      entityType: v.entityType as EntityType,
      entityId: v.entityId,
      versionData: v.versionData as Record<string, any>,
      version: v.version,
      createdAt: v.createdAt,
      createdBy: v.createdBy,
      isActive: v.isActive,
      tags: (v.tags as string[]) || null,
    }));
  }

  static async revertToVersion(
    entityType: EntityType,
    entityId: string,
    version: number,
    userId: string
  ): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get the target version
        const targetVersion = await tx.entityVersion.findFirst({
          where: {
            entityType,
            entityId,
            version,
          },
        });

        if (!targetVersion) {
          return { success: false, error: "Version not found" };
        }

        // Get current active version for before data
        const currentVersion = await tx.entityVersion.findFirst({
          where: {
            entityType,
            entityId,
            isActive: true,
          },
        });

        // Create a new version with the target data
        const result = await this.createVersion(
          entityType,
          entityId,
          userId,
          targetVersion.versionData as Record<string, any>,
          "RESTORE",
          currentVersion?.versionData as Record<string, any> | null,
          `Reverted to version ${version}`
        );

        return {
          success: true,
          data: targetVersion.versionData as Record<string, any>,
        };
      });
    } catch (error) {
      console.error("Failed to revert to version:", error);
      return { success: false, error: "Failed to revert to version" };
    }
  }

  static async getLatestVersion(
    entityType: EntityType,
    entityId: string
  ): Promise<EntityVersion | null> {
    const version = await prisma.entityVersion.findFirst({
      where: {
        entityType,
        entityId,
        isActive: true,
      },
    });

    if (!version) return null;

    return {
      id: version.id,
      entityType: version.entityType as EntityType,
      entityId: version.entityId,
      versionData: version.versionData as Record<string, any>,
      version: version.version,
      createdAt: version.createdAt,
      createdBy: version.createdBy,
      isActive: version.isActive,
      tags: (version.tags as string[]) || null,
    };
  }

  static async getAuditTrail(
    entityType: EntityType,
    entityId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    const logs = await prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      entityType: log.entityType as EntityType,
      entityId: log.entityId,
      userId: log.userId,
      changeType: log.changeType as ChangeType,
      beforeData: log.beforeData as Record<string, any> | null,
      afterData: log.afterData as Record<string, any> | null,
      changeDescription: log.changeDescription,
      timestamp: log.timestamp,
      version: log.version,
      parentVersion: log.parentVersion,
    }));
  }

  static generateDiff(
    beforeData: Record<string, any> | null,
    afterData: Record<string, any> | null
  ): { added: Record<string, any>; removed: Record<string, any>; changed: Record<string, any> } {
    const diff = {
      added: {} as Record<string, any>,
      removed: {} as Record<string, any>,
      changed: {} as Record<string, any>,
    };

    if (!beforeData && afterData) {
      return { added: afterData, removed: {}, changed: {} };
    }

    if (beforeData && !afterData) {
      return { added: {}, removed: beforeData, changed: {} };
    }

    if (!beforeData || !afterData) {
      return diff;
    }

    // Find added and changed fields
    for (const key in afterData) {
      if (!(key in beforeData)) {
        diff.added[key] = afterData[key];
      } else if (JSON.stringify(beforeData[key]) !== JSON.stringify(afterData[key])) {
        diff.changed[key] = {
          before: beforeData[key],
          after: afterData[key],
        };
      }
    }

    // Find removed fields
    for (const key in beforeData) {
      if (!(key in afterData)) {
        diff.removed[key] = beforeData[key];
      }
    }

    return diff;
  }

  static async tagVersion(
    entityType: EntityType,
    entityId: string,
    version: number,
    tag: string
  ): Promise<boolean> {
    try {
      const entityVersion = await prisma.entityVersion.findFirst({
        where: { entityType, entityId, version },
      });

      if (!entityVersion) return false;

      const currentTags = (entityVersion.tags as string[]) || [];
      const updatedTags = [...currentTags, tag];

      await prisma.entityVersion.update({
        where: { id: entityVersion.id },
        data: { tags: updatedTags },
      });

      return true;
    } catch (error) {
      console.error("Failed to tag version:", error);
      return false;
    }
  }
}