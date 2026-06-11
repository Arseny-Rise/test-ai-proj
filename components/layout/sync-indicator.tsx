"use client";

import { Cloud, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSyncStatus } from "@/lib/offline/hooks";

const labels = {
  saved: "Сохранено",
  syncing: "Синхронизация…",
  offline: "Офлайн",
  conflict: "Обновлено с сервера",
};

export function SyncIndicator() {
  const { status, message, retry } = useSyncStatus();

  const Icon =
    status === "offline"
      ? CloudOff
      : status === "syncing"
        ? Loader2
        : status === "conflict"
          ? RefreshCw
          : Cloud;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon
        className={`h-3.5 w-3.5 ${status === "syncing" ? "animate-spin" : ""}`}
      />
      <span>{message ?? labels[status]}</span>
      {status === "offline" && (
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={retry}>
          Повторить
        </Button>
      )}
    </div>
  );
}
