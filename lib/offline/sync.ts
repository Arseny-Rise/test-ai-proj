"use client";

import type {
  EntityType,
  NoteEntity,
  SubtaskEntity,
  SyncAction,
  SyncPullResponse,
  TaskEntity,
  TaskListEntity,
} from "@/lib/types";
import {
  getClientId,
  getLastSyncAt,
  offlineDb,
  setLastSyncAt,
} from "./db";

type SyncStatus = "saved" | "syncing" | "offline" | "conflict";

type SyncListener = (status: SyncStatus, message?: string) => void;

const listeners = new Set<SyncListener>();
let syncInProgress = false;

export function subscribeSyncStatus(listener: SyncListener) {
  listeners.add(listener);
  listener(navigator.onLine ? "saved" : "offline");
  return () => {
    listeners.delete(listener);
  };
}

function notify(status: SyncStatus, message?: string) {
  listeners.forEach((listener) => listener(status, message));
}

async function enqueueChange(
  entity: EntityType,
  action: SyncAction,
  payload: Record<string, unknown>
) {
  const clientId = await getClientId();
  const change = {
    id: crypto.randomUUID(),
    entity,
    action,
    payload,
    timestamp: String(payload.updatedAt ?? new Date().toISOString()),
    clientId,
  };
  await offlineDb.syncQueue.put(change);
  void runSync();
}

export async function upsertTaskList(data: TaskListEntity) {
  await offlineDb.taskLists.put(data);
  await enqueueChange(
    "taskList",
    data.deletedAt ? "delete" : "update",
    data as unknown as Record<string, unknown>
  );
}

export async function upsertTask(data: TaskEntity) {
  await offlineDb.tasks.put(data);
  await enqueueChange(
    "task",
    data.deletedAt ? "delete" : "update",
    data as unknown as Record<string, unknown>
  );
}

export async function upsertSubtask(data: SubtaskEntity) {
  await offlineDb.subtasks.put(data);
  await enqueueChange(
    "subtask",
    data.deletedAt ? "delete" : "update",
    data as unknown as Record<string, unknown>
  );
}

export async function upsertNote(data: NoteEntity) {
  await offlineDb.notes.put(data);
  await enqueueChange(
    "note",
    data.deletedAt ? "delete" : "update",
    data as unknown as Record<string, unknown>
  );
}

async function applyPull(data: SyncPullResponse) {
  await offlineDb.transaction(
    "rw",
    [offlineDb.taskLists, offlineDb.tasks, offlineDb.subtasks, offlineDb.notes],
    async () => {
      for (const item of data.taskLists) await offlineDb.taskLists.put(item);
      for (const item of data.tasks) await offlineDb.tasks.put(item);
      for (const item of data.subtasks) await offlineDb.subtasks.put(item);
      for (const item of data.notes) await offlineDb.notes.put(item);
    }
  );
  await setLastSyncAt(data.serverTime);
}

export async function pullFromServer(force = false) {
  if (!navigator.onLine) {
    notify("offline");
    return;
  }

  const since = force ? new Date(0).toISOString() : await getLastSyncAt();
  const res = await fetch(`/api/sync?since=${encodeURIComponent(since)}`);
  if (!res.ok) throw new Error("Pull failed");
  const data = (await res.json()) as SyncPullResponse;
  await applyPull(data);
}

export async function runSync() {
  if (syncInProgress || !navigator.onLine) {
    if (!navigator.onLine) notify("offline");
    return;
  }

  syncInProgress = true;
  notify("syncing");

  try {
    const queue = await offlineDb.syncQueue.orderBy("timestamp").toArray();
    if (queue.length > 0) {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes: queue }),
      });

      if (!res.ok) throw new Error("Push failed");

      const result = (await res.json()) as {
        applied: string[];
        conflicts: Array<{ changeId: string; serverData: Record<string, unknown> }>;
      };

      const appliedSet = new Set(result.applied);
      for (const change of queue) {
        if (appliedSet.has(change.id)) {
          await offlineDb.syncQueue.delete(change.id);
        }
      }

      if (result.conflicts.length > 0) {
        notify("conflict", "Версия на сервере новее — обновлено");
        await pullFromServer(true);
      }
    }

    await pullFromServer();
    notify("saved");
  } catch {
    notify("offline");
  } finally {
    syncInProgress = false;
  }
}

export function startSyncLoop() {
  void pullFromServer(true).then(() => runSync());

  const onOnline = () => void runSync();
  window.addEventListener("online", onOnline);
  const interval = window.setInterval(() => void runSync(), 30000);

  return () => {
    window.removeEventListener("online", onOnline);
    window.clearInterval(interval);
  };
}

export async function getActiveTaskLists(userId: string) {
  return offlineDb.taskLists
    .filter((l) => l.userId === userId && !l.deletedAt)
    .sortBy("sortOrder");
}

export async function getActiveTasks(filter?: {
  listId?: string | null;
  today?: boolean;
  completed?: boolean;
}) {
  let items = await offlineDb.tasks.filter((t) => !t.deletedAt).toArray();

  if (filter?.listId !== undefined) {
    items = items.filter((t) => t.listId === filter.listId);
  }
  if (filter?.today) {
    const today = new Date().toDateString();
    items = items.filter(
      (t) => t.dueDate && new Date(t.dueDate).toDateString() === today
    );
  }
  if (filter?.completed !== undefined) {
    items = items.filter((t) => t.completed === filter.completed);
  }

  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getSubtasksForTask(taskId: string) {
  return offlineDb.subtasks
    .filter((s) => s.taskId === taskId && !s.deletedAt)
    .sortBy("sortOrder");
}

export async function getActiveNotes(userId: string, search?: string) {
  let items = await offlineDb.notes
    .filter((n) => n.userId === userId && !n.deletedAt)
    .toArray();

  if (search?.trim()) {
    const q = search.toLowerCase();
    items = items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        JSON.stringify(n.contentJson).toLowerCase().includes(q)
    );
  }

  return items.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
