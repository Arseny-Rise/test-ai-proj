"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CheckSquare, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SyncIndicator } from "./sync-indicator";
import { ThemeToggle } from "./theme-toggle";
import { useOfflineInit } from "@/lib/offline/hooks";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/tasks", label: "Задачи", icon: CheckSquare },
  { href: "/notes", label: "Заметки", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useOfflineInit();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold">Мой Todo</h1>
          <ThemeToggle />
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-border p-4">
          <SyncIndicator />
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <h1 className="font-semibold">Мой Todo</h1>
          <div className="flex items-center gap-1">
            <SyncIndicator />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-hidden">{children}</main>

        <nav className="flex border-t border-border bg-card md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-xs",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
