import Link from "next/link";

import { ROUTES } from "@/lib/constants";

export function Sidebar() {
  return (
    <aside className="w-64 border-r bg-background/95 backdrop-blur">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">Navigation</h2>
          <div className="space-y-1">
            <Link
              href={ROUTES.DASHBOARD}
              className="flex items-center rounded-lg px-4 py-2 text-sm hover:bg-accent"
            >
              Dashboard
            </Link>
            <Link
              href={ROUTES.PROJECTS}
              className="flex items-center rounded-lg px-4 py-2 text-sm hover:bg-accent"
            >
              Projects
            </Link>
            <Link
              href={ROUTES.TASKS}
              className="flex items-center rounded-lg px-4 py-2 text-sm hover:bg-accent"
            >
              Tasks
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
