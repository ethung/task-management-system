import { prisma } from "./index";
import type { Project } from "@/lib/types";

export async function createProject(data: {
  name: string;
  description?: string;
  color?: string;
  userId: string;
}): Promise<Project> {
  const project = await prisma.project.create({
    data,
  });

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    userId: project.userId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function getProjectById(id: string): Promise<Project | null> {
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) return null;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    userId: project.userId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    userId: project.userId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }));
}

export async function updateProject(
  id: string,
  data: Partial<Pick<Project, "name" | "description" | "color">>
): Promise<Project> {
  const project = await prisma.project.update({
    where: { id },
    data,
  });

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    userId: project.userId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export async function deleteProject(id: string): Promise<void> {
  await prisma.project.delete({
    where: { id },
  });
}
