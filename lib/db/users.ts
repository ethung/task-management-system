import type { User } from "@/lib/types";

import { prisma } from "./index";

export async function createUser(data: {
  email: string;
  passwordHash: string;
  name?: string;
  avatar?: string;
  emailVerified?: boolean;
}): Promise<User> {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name || null,
      avatar: data.avatar || null,
      emailVerified: data.emailVerified || false,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
    timezone: user.timezone,
    preferences: user.preferences as Record<string, any> | null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
    timezone: user.timezone,
    preferences: user.preferences as Record<string, any> | null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
    timezone: user.timezone,
    preferences: user.preferences as Record<string, any> | null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function updateUser(
  id: string,
  data: Partial<Pick<User, "name" | "avatar">>
): Promise<User> {
  const user = await prisma.user.update({
    where: { id },
    data,
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
    timezone: user.timezone,
    preferences: user.preferences as Record<string, any> | null,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({
    where: { id },
  });
}
