"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskItem } from "./task-item";
import { useLiveQuery } from "@/lib/offline/hooks";
import {
  getActiveTaskLists,
  getActiveTasks,
  upsertTask,
  upsertTaskList,
} from "@/lib/offline/sync";
import type { TaskEntity } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Filter = "inbox" | "today" | "all" | "completed" | string;

interface TasksViewProps {
  userId: string;
}

export function TasksView({ userId }: TasksViewProps) {
  const [filter, setFilter] = useState<Filter>("inbox");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newListName, setNewListName] = useState("");

  const lists = useLiveQuery(() => getActiveTaskLists(userId), [userId]);
  const tasks = useLiveQuery(() => {
    if (filter === "today") return getActiveTasks({ today: true, completed: false });
    if (filter === "completed") return getActiveTasks({ completed: true });
    if (filter === "all") return getActiveTasks({ completed: false });
    if (filter === "inbox") return getActiveTasks({ listId: null, completed: false });
    return getActiveTasks({ listId: filter, completed: false });
  }, [filter]);

  const sortedTasks = useMemo(
    () => (tasks ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
    [tasks]
  );

  const addTask = async () => {
    const title = newTaskTitle.trim();
    if (!title) return;

    const isBuiltinFilter = ["inbox", "today", "all", "completed"].includes(filter);
    const now = new Date().toISOString();
    const task: TaskEntity = {
      id: generateId(),
      listId: isBuiltinFilter ? null : filter,
      title,
      completed: false,
      dueDate: filter === "today" ? new Date().toISOString() : null,
      priority: 0,
      sortOrder: sortedTasks.length,
      updatedAt: now,
      deletedAt: null,
    };

    await upsertTask(task);
    setNewTaskTitle("");
  };

  const addList = async () => {
    const name = newListName.trim();
    if (!name) return;
    const now = new Date().toISOString();
    await upsertTaskList({
      id: generateId(),
      userId,
      name,
      sortOrder: lists?.length ?? 0,
      updatedAt: now,
      deletedAt: null,
    });
    setNewListName("");
    setFilter(name);
  };

  const filterButtons: Array<{ id: Filter; label: string }> = [
    { id: "inbox", label: "Inbox" },
    { id: "today", label: "Сегодня" },
    { id: "all", label: "Все" },
    { id: "completed", label: "Выполненные" },
    ...(lists ?? []).map((list) => ({ id: list.id, label: list.name })),
  ];

  return (
    <div className="flex h-full flex-col md:flex-row">
      <div className="border-b border-border p-4 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-sm",
                filter === btn.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <aside className="hidden w-56 shrink-0 border-r border-border p-4 md:block">
        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
          Фильтры
        </p>
        <div className="space-y-1">
          {filterButtons.slice(0, 4).map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm",
                filter === btn.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
        <p className="mb-2 mt-6 text-xs font-medium uppercase text-muted-foreground">
          Списки
        </p>
        <div className="space-y-1">
          {(lists ?? []).map((list) => (
            <button
              key={list.id}
              onClick={() => setFilter(list.id)}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm",
                filter === list.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
            >
              {list.name}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Новый список"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void addList()}
            className="h-8"
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => void addList()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Добавить задачу…"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void addTask()}
              className="flex-1"
              autoFocus
            />
            <Button onClick={() => void addTask()}>Добавить</Button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {sortedTasks.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              Нет задач. Добавьте первую выше.
            </p>
          ) : (
            sortedTasks.map((task) => <TaskItem key={task.id} task={task} />)
          )}
        </div>
      </div>
    </div>
  );
}
