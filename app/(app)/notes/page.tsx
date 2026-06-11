"use client";

import { NotesView } from "@/components/notes/notes-view";
import { useUserId } from "@/components/providers/user-provider";

export default function NotesPage() {
  const userId = useUserId();
  return <NotesView userId={userId} />;
}
