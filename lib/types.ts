export type Priority = 0 | 1 | 2;

export type EntityType = "taskList" | "task" | "subtask" | "note";

export type SyncAction = "create" | "update" | "delete";

export interface TaskListEntity {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TaskEntity {
  id: string;
  listId: string | null;
  title: string;
  completed: boolean;
  dueDate: string | null;
  priority: Priority;
  sortOrder: number;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SubtaskEntity {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  updatedAt: string;
  deletedAt: string | null;
}

export interface NoteEntity {
  id: string;
  userId: string;
  title: string;
  contentJson: Record<string, unknown>;
  updatedAt: string;
  deletedAt: string | null;
}

export interface SyncChange {
  id: string;
  entity: EntityType;
  action: SyncAction;
  payload: Record<string, unknown>;
  timestamp: string;
  clientId: string;
}

export interface SyncPullResponse {
  taskLists: TaskListEntity[];
  tasks: TaskEntity[];
  subtasks: SubtaskEntity[];
  notes: NoteEntity[];
  serverTime: string;
}

export interface SyncPushResult {
  applied: string[];
  conflicts: Array<{
    changeId: string;
    entity: EntityType;
    serverData: Record<string, unknown>;
  }>;
}
