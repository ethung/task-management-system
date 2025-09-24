export type User = {
  id: string;
  email: string;
  name: string | null;
  avatar?: string | null;
  emailVerified: boolean;
  timezone: string;
  preferences?: Record<string, any> | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

// Public user type (without sensitive fields)
export type PublicUser = Omit<User, "preferences" | "lastLoginAt">;

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate: Date | null;
  projectId: string | null;
  userId: string;
  bigThreeRank?: number | null;
  weeklyPlanId?: string | null;
  plannedDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type APIResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
};

export type PaginatedResponse<T> = APIResponse<{
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}>;

// Weekly Planning Types
export type WeeklyGoal = {
  id: string;
  title: string;
  description?: string;
  priority: number;
  completed?: boolean;
};

export type WeeklyPlanStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type WeeklyPlan = {
  id: string;
  userId: string;
  weekStartDate: Date;
  weeklyGoals: WeeklyGoal[];
  intentions?: string | null;
  status: WeeklyPlanStatus;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
  weeklyReflections?: WeeklyReflection[];
};

export type WeeklyReflection = {
  id: string;
  userId: string;
  weeklyPlanId: string;
  weekEndDate: Date;
  accomplishments?: string | null;
  challenges?: string | null;
  lessons?: string | null;
  nextWeekGoals?: string | null;
  satisfactionRating?: number | null;
  progressNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  weeklyPlan?: WeeklyPlan;
};

// Version Control Types
export type EntityType = "WEEKLY_PLAN" | "WEEKLY_REFLECTION" | "TASK" | "GOAL";
export type ChangeType = "CREATE" | "UPDATE" | "DELETE" | "RESTORE";

export type AuditLog = {
  id: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  changeType: ChangeType;
  beforeData?: Record<string, any> | null;
  afterData?: Record<string, any> | null;
  changeDescription?: string | null;
  timestamp: Date;
  version: number;
  parentVersion?: number | null;
};

export type EntityVersion = {
  id: string;
  entityType: EntityType;
  entityId: string;
  versionData: Record<string, any>;
  version: number;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
  tags?: string[] | null;
};

// Big Three Task Types
export type BigThreeTask = Task & {
  bigThreeRank: 1 | 2 | 3;
  plannedDate: Date;
};

// Temporal Access Types
export type TemporalPlanQuery = {
  year: number;
  week: number;
  date?: Date;
};

// Undo/Redo Types
export type UndoRedoAction = {
  id: string;
  description: string;
  timestamp: Date;
  entityType: EntityType;
  entityId: string;
  canUndo: boolean;
};

// Version History Types
export type VersionHistoryEntry = {
  version: number;
  timestamp: Date;
  userId: string;
  changeType: ChangeType;
  description?: string;
  data: Record<string, any>;
};
