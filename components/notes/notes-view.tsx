"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteEditor } from "./note-editor";
import { useLiveQuery } from "@/lib/offline/hooks";
import { getActiveNotes, upsertNote } from "@/lib/offline/sync";
import type { NoteEntity } from "@/lib/types";
import { generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface NotesViewProps {
  userId: string;
}

const emptyDoc = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function NotesView({ userId }: NotesViewProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileShowEditor, setMobileShowEditor] = useState(false);

  const notes = useLiveQuery(
    () => getActiveNotes(userId, search),
    [userId, search]
  );

  const selectedNote = useMemo(
    () => (notes ?? []).find((n) => n.id === selectedId) ?? null,
    [notes, selectedId]
  );

  const createNote = async () => {
    const now = new Date().toISOString();
    const note: NoteEntity = {
      id: generateId(),
      userId,
      title: "Без названия",
      contentJson: emptyDoc,
      updatedAt: now,
      deletedAt: null,
    };
    await upsertNote(note);
    setSelectedId(note.id);
    setMobileShowEditor(true);
  };

  const updateTitle = async (title: string) => {
    if (!selectedNote) return;
    await upsertNote({
      ...selectedNote,
      title: title.trim() || "Без названия",
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteNote = async (note: NoteEntity) => {
    await upsertNote({
      ...note,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (selectedId === note.id) {
      setSelectedId(null);
      setMobileShowEditor(false);
    }
  };

  return (
    <div className="flex h-full">
      <aside
        className={cn(
          "flex w-full flex-col border-r border-border md:w-80",
          mobileShowEditor && "hidden md:flex"
        )}
      >
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск заметок"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button size="icon" onClick={() => void createNote()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(notes ?? []).length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Нет заметок
            </p>
          ) : (
            (notes ?? []).map((note) => (
              <button
                key={note.id}
                onClick={() => {
                  setSelectedId(note.id);
                  setMobileShowEditor(true);
                }}
                className={cn(
                  "flex w-full items-start justify-between gap-2 border-b border-border px-4 py-3 text-left hover:bg-accent",
                  selectedId === note.id && "bg-accent"
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{note.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(note.updatedAt), "d MMM yyyy, HH:mm", {
                      locale: ru,
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteNote(note);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </button>
            ))
          )}
        </div>
      </aside>

      <section
        className={cn(
          "flex flex-1 flex-col p-4",
          !mobileShowEditor && "hidden md:flex"
        )}
      >
        {selectedNote ? (
          <>
            <Button
              variant="ghost"
              className="mb-2 w-fit md:hidden"
              onClick={() => setMobileShowEditor(false)}
            >
              ← Назад
            </Button>
            <NoteEditor note={selectedNote} onTitleChange={(t) => void updateTitle(t)} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Выберите заметку или создайте новую
          </div>
        )}
      </section>
    </div>
  );
}
