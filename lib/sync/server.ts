import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  EntityType,
  NoteEntity,
  SubtaskEntity,
  SyncAction,
  SyncChange,
  SyncPullResponse,
  SyncPushResult,
  TaskEntity,
  TaskListEntity,
} from "@/lib/types";

function toIso(date: Date | null | undefined) {
  return date ? date.toISOString() : null;
}

function mapTaskList(row: {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  updatedAt: Date;
  deletedAt: Date | null;
}): TaskListEntity {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: toIso(row.deletedAt),
  };
}

function mapTask(row: {
  id: string;
  listId: string | null;
  title: string;
  completed: boolean;
  dueDate: Date | null;
  priority: number;
  sortOrder: number;
  updatedAt: Date;
  deletedAt: Date | null;
}): TaskEntity {
  return {
    id: row.id,
    listId: row.listId,
    title: row.title,
    completed: row.completed,
    dueDate: toIso(row.dueDate),
    priority: row.priority as 0 | 1 | 2,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: toIso(row.deletedAt),
  };
}

function mapSubtask(row: {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
  updatedAt: Date;
  deletedAt: Date | null;
}): SubtaskEntity {
  return {
    id: row.id,
    taskId: row.taskId,
    title: row.title,
    completed: row.completed,
    sortOrder: row.sortOrder,
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: toIso(row.deletedAt),
  };
}

function mapNote(row: {
  id: string;
  userId: string;
  title: string;
  contentJson: Prisma.JsonValue;
  updatedAt: Date;
  deletedAt: Date | null;
}): NoteEntity {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    contentJson: (row.contentJson as Record<string, unknown>) ?? {},
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: toIso(row.deletedAt),
  };
}

export async function pullChanges(
  userId: string,
  since?: string
): Promise<SyncPullResponse> {
  const sinceDate = since ? new Date(since) : new Date(0);
  const listIds = (
    await prisma.taskList.findMany({
      where: { userId },
      select: { id: true },
    })
  ).map((list) => list.id);

  const [taskLists, tasks, subtasks, notes] = await Promise.all([
    prisma.taskList.findMany({
      where: { userId, updatedAt: { gt: sinceDate } },
    }),
    prisma.task.findMany({
      where: {
        updatedAt: { gt: sinceDate },
        OR: [{ listId: { in: listIds } }, { listId: null }],
      },
    }),
    prisma.subtask.findMany({
      where: {
        updatedAt: { gt: sinceDate },
        task: {
          OR: [{ listId: { in: listIds } }, { listId: null }],
        },
      },
    }),
    prisma.note.findMany({
      where: { userId, updatedAt: { gt: sinceDate } },
    }),
  ]);

  return {
    taskLists: taskLists.map(mapTaskList),
    tasks: tasks.map(mapTask),
    subtasks: subtasks.map(mapSubtask),
    notes: notes.map(mapNote),
    serverTime: new Date().toISOString(),
  };
}

async function applyChange(
  userId: string,
  entity: EntityType,
  action: SyncAction,
  payload: Record<string, unknown>
) {
  const updatedAt = payload.updatedAt
    ? new Date(String(payload.updatedAt))
    : new Date();
  const deletedAt = payload.deletedAt
    ? new Date(String(payload.deletedAt))
    : null;

  switch (entity) {
    case "taskList": {
      const id = String(payload.id);
      if (action === "delete") {
        await prisma.taskList.update({
          where: { id },
          data: { deletedAt: deletedAt ?? new Date(), updatedAt },
        });
        return;
      }
      await prisma.taskList.upsert({
        where: { id },
        create: {
          id,
          userId,
          name: String(payload.name ?? "Список"),
          sortOrder: Number(payload.sortOrder ?? 0),
          updatedAt,
          deletedAt,
        },
        update: {
          name: payload.name !== undefined ? String(payload.name) : undefined,
          sortOrder:
            payload.sortOrder !== undefined
              ? Number(payload.sortOrder)
              : undefined,
          updatedAt,
          deletedAt,
        },
      });
      return;
    }
    case "task": {
      const id = String(payload.id);
      if (action === "delete") {
        await prisma.task.update({
          where: { id },
          data: { deletedAt: deletedAt ?? new Date(), updatedAt },
        });
        return;
      }
      await prisma.task.upsert({
        where: { id },
        create: {
          id,
          listId: payload.listId ? String(payload.listId) : null,
          title: String(payload.title ?? ""),
          completed: Boolean(payload.completed),
          dueDate: payload.dueDate ? new Date(String(payload.dueDate)) : null,
          priority: Number(payload.priority ?? 0),
          sortOrder: Number(payload.sortOrder ?? 0),
          updatedAt,
          deletedAt,
        },
        update: {
          listId:
            payload.listId !== undefined
              ? payload.listId
                ? String(payload.listId)
                : null
              : undefined,
          title: payload.title !== undefined ? String(payload.title) : undefined,
          completed:
            payload.completed !== undefined
              ? Boolean(payload.completed)
              : undefined,
          dueDate:
            payload.dueDate !== undefined
              ? payload.dueDate
                ? new Date(String(payload.dueDate))
                : null
              : undefined,
          priority:
            payload.priority !== undefined
              ? Number(payload.priority)
              : undefined,
          sortOrder:
            payload.sortOrder !== undefined
              ? Number(payload.sortOrder)
              : undefined,
          updatedAt,
          deletedAt,
        },
      });
      return;
    }
    case "subtask": {
      const id = String(payload.id);
      if (action === "delete") {
        await prisma.subtask.update({
          where: { id },
          data: { deletedAt: deletedAt ?? new Date(), updatedAt },
        });
        return;
      }
      await prisma.subtask.upsert({
        where: { id },
        create: {
          id,
          taskId: String(payload.taskId),
          title: String(payload.title ?? ""),
          completed: Boolean(payload.completed),
          sortOrder: Number(payload.sortOrder ?? 0),
          updatedAt,
          deletedAt,
        },
        update: {
          title: payload.title !== undefined ? String(payload.title) : undefined,
          completed:
            payload.completed !== undefined
              ? Boolean(payload.completed)
              : undefined,
          sortOrder:
            payload.sortOrder !== undefined
              ? Number(payload.sortOrder)
              : undefined,
          updatedAt,
          deletedAt,
        },
      });
      return;
    }
    case "note": {
      const id = String(payload.id);
      if (action === "delete") {
        await prisma.note.update({
          where: { id },
          data: { deletedAt: deletedAt ?? new Date(), updatedAt },
        });
        return;
      }
      await prisma.note.upsert({
        where: { id },
        create: {
          id,
          userId,
          title: String(payload.title ?? "Без названия"),
          contentJson: (payload.contentJson as Prisma.InputJsonValue) ?? {},
          updatedAt,
          deletedAt,
        },
        update: {
          title: payload.title !== undefined ? String(payload.title) : undefined,
          contentJson:
            payload.contentJson !== undefined
              ? (payload.contentJson as Prisma.InputJsonValue)
              : undefined,
          updatedAt,
          deletedAt,
        },
      });
    }
  }
}

async function getServerEntity(
  entity: EntityType,
  id: string
): Promise<Record<string, unknown> | null> {
  switch (entity) {
    case "taskList": {
      const row = await prisma.taskList.findUnique({ where: { id } });
      return row
        ? (mapTaskList(row) as unknown as Record<string, unknown>)
        : null;
    }
    case "task": {
      const row = await prisma.task.findUnique({ where: { id } });
      return row ? (mapTask(row) as unknown as Record<string, unknown>) : null;
    }
    case "subtask": {
      const row = await prisma.subtask.findUnique({ where: { id } });
      return row
        ? (mapSubtask(row) as unknown as Record<string, unknown>)
        : null;
    }
    case "note": {
      const row = await prisma.note.findUnique({ where: { id } });
      return row ? (mapNote(row) as unknown as Record<string, unknown>) : null;
    }
  }
}

export async function pushChanges(
  userId: string,
  changes: SyncChange[]
): Promise<SyncPushResult> {
  const applied: string[] = [];
  const conflicts: SyncPushResult["conflicts"] = [];

  for (const change of changes) {
    const entityId = String(change.payload.id);
    const existing = await getServerEntity(change.entity, entityId);
    const clientUpdatedAt = new Date(change.timestamp);

    if (
      existing &&
      existing.updatedAt &&
      new Date(String(existing.updatedAt)) > clientUpdatedAt
    ) {
      conflicts.push({
        changeId: change.id,
        entity: change.entity,
        serverData: existing,
      });
      continue;
    }

    try {
      await applyChange(userId, change.entity, change.action, change.payload);
      await prisma.syncLog.create({
        data: {
          entityType: change.entity,
          entityId,
          clientId: change.clientId,
        },
      });
      applied.push(change.id);
    } catch {
      const serverData = await getServerEntity(change.entity, entityId);
      if (serverData) {
        conflicts.push({
          changeId: change.id,
          entity: change.entity,
          serverData,
        });
      }
    }
  }

  return { applied, conflicts };
}
