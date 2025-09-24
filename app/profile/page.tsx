"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { useAuth } from "@/lib/auth/context";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/auth";

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (!result.success) {
        if (result.details) {
          const errorMessages = result.details.map((detail: any) => detail.message).join(", ");
          setError(errorMessages);
        } else {
          setError(result.error || "Profile update failed");
        }
        return;
      }

      setSuccess("Profile updated successfully!");
      // Optionally update the user context with new data
      // This would require updating the AuthContext to have an updateUser method
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Profile update error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/dashboard"
                className="text-xl font-semibold text-gray-900 hover:text-indigo-600"
              >
                Planner Project
              </Link>
              <nav className="flex space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="text-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Profile
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.name || user?.email}
              </span>
              <button
                onClick={logout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Profile Settings
              </h1>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Enter your full name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    disabled
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 sm:text-sm cursor-not-allowed"
                    placeholder="your@email.com"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Email address cannot be changed. Contact support if you need to update it.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Account Information</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-gray-500">User ID</dt>
                      <dd className="text-sm text-gray-900">{user?.id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Email Verified</dt>
                      <dd className="text-sm text-gray-900">
                        {user?.emailVerified ? (
                          <span className="text-green-600">✅ Verified</span>
                        ) : (
                          <span className="text-red-600">❌ Not verified</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Timezone</dt>
                      <dd className="text-sm text-gray-900">{user?.timezone}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Last Login</dt>
                      <dd className="text-sm text-gray-900">
                        {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Member Since</dt>
                      <dd className="text-sm text-gray-900">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Updating..." : "Update Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}