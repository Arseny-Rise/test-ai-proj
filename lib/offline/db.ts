import Dexie, { type Table } from "dexie";
import type {
  NoteEntity,
  SubtaskEntity,
  SyncChange,
  TaskEntity,
  TaskListEntity,
} from "@/lib/types";

export interface SyncMeta {
  id: string;
  lastSyncAt: string;
  clientId: string;
}

class OfflineDatabase extends Dexie {
  taskLists!: Table<TaskListEntity, string>;
  tasks!: Table<TaskEntity, string>;
  subtasks!: Table<SubtaskEntity, string>;
  notes!: Table<NoteEntity, string>;
  syncQueue!: Table<SyncChange, string>;
  meta!: Table<SyncMeta, string>;

  constructor() {
    super("personal-todo-notes");
    this.version(1).stores({
      taskLists: "id, userId, updatedAt, deletedAt",
      tasks: "id, listId, updatedAt, deletedAt, dueDate, completed",
      subtasks: "id, taskId, updatedAt, deletedAt",
      notes: "id, userId, updatedAt, deletedAt, title",
      syncQueue: "id, timestamp",
      meta: "id",
    });
  }
}

export const offlineDb = new OfflineDatabase();

export async function getClientId(): Promise<string> {
  const existing = await offlineDb.meta.get("client");
  if (existing?.clientId) return existing.clientId;

  const clientId = crypto.randomUUID();
  await offlineDb.meta.put({
    id: "client",
    clientId,
    lastSyncAt: new Date(0).toISOString(),
  });
  return clientId;
}

export async function getLastSyncAt(): Promise<string> {
  const meta = await offlineDb.meta.get("client");
  return meta?.lastSyncAt ?? new Date(0).toISOString();
}

export async function setLastSyncAt(iso: string) {
  const clientId = await getClientId();
  await offlineDb.meta.put({
    id: "client",
    clientId,
    lastSyncAt: iso,
  });
}
