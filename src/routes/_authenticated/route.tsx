import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/fb/AppShell";
import { projectAccessUser } from "@/lib/offline";
import { PROJECT_ID } from "@/lib/db";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const user = await projectAccessUser(PROJECT_ID);
    if (!user) {
      if (location.pathname === "/") throw redirect({ to: "/home" });
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: () => <AppShell><Outlet /></AppShell>,
});
