"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import type { NoteEntity } from "@/lib/types";
import { upsertNote } from "@/lib/offline/sync";
import { EditorToolbar } from "./editor-toolbar";

interface NoteEditorProps {
  note: NoteEntity;
  onTitleChange: (title: string) => void;
}

export function NoteEditor({ note, onTitleChange }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "Начните писать или добавьте чеклист…" }),
    ],
    content: note.contentJson,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[300px] focus:outline-none px-1",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const json = ed.getJSON() as Record<string, unknown>;
      void upsertNote({
        ...note,
        contentJson: json,
        updatedAt: new Date().toISOString(),
      });

      const firstLine = ed.getText().split("\n").find((line) => line.trim());
      if (firstLine && note.title === "Без названия") {
        onTitleChange(firstLine.slice(0, 80));
      }
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(note.contentJson);
    if (current !== incoming) {
      editor.commands.setContent(note.contentJson);
    }
  }, [editor, note.id, note.contentJson]);

  return (
    <div className="flex h-full flex-col">
      <input
        value={note.title}
        onChange={(e) => onTitleChange(e.target.value)}
        className="mb-4 w-full border-0 bg-transparent text-2xl font-semibold focus:outline-none"
        placeholder="Заголовок"
      />
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} className="flex-1 overflow-y-auto" />
    </div>
  );
}
