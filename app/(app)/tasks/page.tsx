"use client";

import { TasksView } from "@/components/tasks/tasks-view";
import { useUserId } from "@/components/providers/user-provider";

export default function TasksPage() {
  const userId = useUserId();
  return <TasksView userId={userId} />;
}
