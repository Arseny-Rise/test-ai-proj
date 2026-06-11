import { AppShell } from "@/components/layout/app-shell";
import { UserProvider } from "@/components/providers/user-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
