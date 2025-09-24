import { PrismaClient } from "@/lib/generated/prisma";
import { hashPassword } from "@/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create demo password
  const demoPassword = await hashPassword("DemoPassword123!");

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@plannerproject.com" },
    update: {},
    create: {
      email: "demo@plannerproject.com",
      name: "Demo User",
      passwordHash: demoPassword,
      emailVerified: true,
    },
  });

  console.log("👤 Created demo user:", user.email);

  // Create demo projects
  const personalProject = await prisma.project.upsert({
    where: { id: "personal-project-id" },
    update: {},
    create: {
      id: "personal-project-id",
      name: "Personal Tasks",
      description: "Personal productivity and life management",
      color: "#3B82F6",
      userId: user.id,
    },
  });

  const workProject = await prisma.project.upsert({
    where: { id: "work-project-id" },
    update: {},
    create: {
      id: "work-project-id",
      name: "Work Project",
      description: "Professional tasks and deadlines",
      color: "#10B981",
      userId: user.id,
    },
  });

  console.log("📁 Created demo projects");

  // Create demo tasks
  const tasks = [
    {
      title: "Set up development environment",
      description: "Configure all necessary tools and dependencies",
      completed: true,
      priority: "HIGH" as const,
      projectId: workProject.id,
      userId: user.id,
    },
    {
      title: "Review quarterly goals",
      description: "Assess progress and adjust objectives for Q4",
      completed: false,
      priority: "MEDIUM" as const,
      dueDate: new Date("2024-01-15"),
      projectId: personalProject.id,
      userId: user.id,
    },
    {
      title: "Plan weekend activities",
      description: "Research local events and book reservations",
      completed: false,
      priority: "LOW" as const,
      projectId: personalProject.id,
      userId: user.id,
    },
    {
      title: "Complete project documentation",
      description: "Write comprehensive docs for the new feature",
      completed: false,
      priority: "HIGH" as const,
      dueDate: new Date("2024-01-10"),
      projectId: workProject.id,
      userId: user.id,
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: task,
    });
  }

  console.log("✅ Created demo tasks");
  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
