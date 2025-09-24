export const APP_NAME = "Planner Project";
export const APP_DESCRIPTION =
  "A modern productivity application for task and project management";

export const ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  PROJECTS: "/projects",
  TASKS: "/tasks",
  SETTINGS: "/settings",
  PROFILE: "/profile",
  LOGIN: "/login",
  REGISTER: "/register",
} as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },
  USERS: "/api/users",
  PROJECTS: "/api/projects",
  TASKS: "/api/tasks",
} as const;

export const TASK_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: "This field is required",
  EMAIL_INVALID: "Please enter a valid email address",
  PASSWORD_MIN_LENGTH: "Password must be at least 8 characters",
  PASSWORD_MAX_LENGTH: "Password must be less than 128 characters",
  NAME_MIN_LENGTH: "Name must be at least 2 characters",
  NAME_MAX_LENGTH: "Name must be less than 50 characters",
} as const;
