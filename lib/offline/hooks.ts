"use client";

import { useEffect, useState } from "react";
import { offlineDb } from "./db";
import { runSync, startSyncLoop, subscribeSyncStatus } from "./sync";

export function useOfflineInit() {
  useEffect(() => startSyncLoop(), []);
}

export function useSyncStatus() {
  const [status, setStatus] = useState<"saved" | "syncing" | "offline" | "conflict">(
    typeof navigator !== "undefined" && navigator.onLine ? "saved" : "offline"
  );
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    return subscribeSyncStatus((next, msg) => {
      setStatus(next);
      setMessage(msg);
    });
  }, []);

  return { status, message, retry: () => void runSync() };
}

export function useLiveQuery<T>(
  query: () => Promise<T>,
  deps: unknown[] = []
): T | undefined {
  const [data, setData] = useState<T>();

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await query();
      if (active) setData(result);
    };
    void load();

    const tables = [
      offlineDb.taskLists,
      offlineDb.tasks,
      offlineDb.subtasks,
      offlineDb.notes,
    ];

    const refresh = () => void load();
    tables.forEach((table) => table.hook("creating", refresh));
    tables.forEach((table) => table.hook("updating", refresh));
    tables.forEach((table) => table.hook("deleting", refresh));

    return () => {
      active = false;
      tables.forEach((table) => table.hook("creating").unsubscribe(refresh));
      tables.forEach((table) => table.hook("updating").unsubscribe(refresh));
      tables.forEach((table) => table.hook("deleting").unsubscribe(refresh));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return data;
}
