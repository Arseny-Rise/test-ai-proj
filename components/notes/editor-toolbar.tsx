"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Heading2,
  List,
  ListChecks,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const items = [
    {
      icon: Bold,
      label: "Жирный",
      active: editor.isActive("bold"),
      action: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Heading2,
      label: "Заголовок",
      active: editor.isActive("heading", { level: 2 }),
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: List,
      label: "Список",
      active: editor.isActive("bulletList"),
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Нумерованный",
      active: editor.isActive("orderedList"),
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: ListChecks,
      label: "Чеклист",
      active: editor.isActive("taskList"),
      action: () => editor.chain().focus().toggleTaskList().run(),
    },
  ];

  return (
    <div className="mb-3 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/50 p-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.label}
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 px-2", item.active && "bg-accent")}
            onClick={item.action}
            title={item.label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
