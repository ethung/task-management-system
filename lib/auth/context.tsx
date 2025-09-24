"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();

  const isAuthenticated = !!user;

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check authentication status on mount after hydration
  useEffect(() => {
    if (isHydrated) {
      checkAuth();
    }
  }, [isHydrated]);

  // Auto-refresh session periodically
  useEffect(() => {
    if (isAuthenticated && isHydrated) {
      const interval = setInterval(() => {
        refreshSession();
      }, 15 * 60 * 1000); // Refresh every 15 minutes

      return () => clearInterval(interval);
    }
    return undefined;
  }, [isAuthenticated, isHydrated]);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.user) {
          setUser(result.data.user);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Login failed");
      }

      setUser(result.data.user);
      router.push("/dashboard");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      router.push("/auth/login");
      router.refresh();
    }
  };

  const refreshSession = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        // If refresh fails, user needs to login again
        setUser(null);
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Session refresh failed:", error);
      setUser(null);
      router.push("/auth/login");
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}