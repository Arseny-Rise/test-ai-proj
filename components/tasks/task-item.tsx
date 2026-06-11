"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Priority, SubtaskEntity, TaskEntity } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { getSubtasksForTask, upsertSubtask, upsertTask } from "@/lib/offline/sync";
import { useLiveQuery } from "@/lib/offline/hooks";
import { cn } from "@/lib/utils";

const priorityColors: Record<Priority, string> = {
  0: "border-l-transparent",
  1: "border-l-amber-400",
  2: "border-l-red-500",
};

interface TaskItemProps {
  task: TaskEntity;
}

export function TaskItem({ task }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");
  const subtasks = useLiveQuery(
    () => getSubtasksForTask(task.id),
    [task.id]
  );

  const updateTask = async (patch: Partial<TaskEntity>) => {
    await upsertTask({
      ...task,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  };

  const addSubtask = async () => {
    const title = newSubtask.trim();
    if (!title) return;

    const now = new Date().toISOString();
    const subtask: SubtaskEntity = {
      id: generateId(),
      taskId: task.id,
      title,
      completed: false,
      sortOrder: (subtasks?.length ?? 0),
      updatedAt: now,
      deletedAt: null,
    };
    await upsertSubtask(subtask);
    setNewSubtask("");
    setExpanded(true);
  };

  const toggleSubtask = async (subtask: SubtaskEntity) => {
    await upsertSubtask({
      ...subtask,
      completed: !subtask.completed,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteSubtask = async (subtask: SubtaskEntity) => {
    await upsertSubtask({
      ...subtask,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteTask = async () => {
    await upsertTask({
      ...task,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border border-l-4 bg-card p-3",
        priorityColors[task.priority]
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={(checked) =>
            updateTask({ completed: checked === true })
          }
        />
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={task.title}
            onChange={(e) => updateTask({ title: e.target.value })}
            className={cn(
              "border-0 bg-transparent px-0 shadow-none focus-visible:ring-0",
              task.completed && "text-muted-foreground line-through"
            )}
          />
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="date"
              value={task.dueDate ? task.dueDate.slice(0, 10) : ""}
              onChange={(e) =>
                updateTask({
                  dueDate: e.target.value
                    ? new Date(e.target.value).toISOString()
                    : null,
                })
              }
              className="rounded border border-input bg-background px-2 py-1"
            />
            {task.dueDate && (
              <span className="text-muted-foreground">
                {format(new Date(task.dueDate), "d MMM", { locale: ru })}
              </span>
            )}
            <select
              value={task.priority}
              onChange={(e) =>
                updateTask({ priority: Number(e.target.value) as Priority })
              }
              className="rounded border border-input bg-background px-2 py-1"
            >
              <option value={0}>Обычный</option>
              <option value={1}>Средний</option>
              <option value={2}>Высокий</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={deleteTask}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 space-y-2 border-t border-border pt-3 pl-8">
          {(subtasks ?? []).map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-2">
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={() => toggleSubtask(subtask)}
              />
              <Input
                value={subtask.title}
                onChange={(e) =>
                  upsertSubtask({
                    ...subtask,
                    title: e.target.value,
                    updatedAt: new Date().toISOString(),
                  })
                }
                className={cn(
                  "h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0",
                  subtask.completed && "line-through text-muted-foreground"
                )}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => deleteSubtask(subtask)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Подзадача"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void addSubtask();
              }}
              className="h-8"
            />
          </div>
        </div>
      )}
    </div>
  );
}
