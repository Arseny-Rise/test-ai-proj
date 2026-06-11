"use client";

import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext<string | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.userId) setUserId(data.userId);
      });
  }, []);

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Загрузка…
      </div>
    );
  }

  return <UserContext.Provider value={userId}>{children}</UserContext.Provider>;
}

export function useUserId() {
  const userId = useContext(UserContext);
  if (!userId) throw new Error("User not loaded");
  return userId;
}
