"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, MonitorPlay, Camera, History, ScanFace, Settings2, LogOut, Shield } from "lucide-react";
import { API_BASE } from "@/lib/config";

const nav = [
  { href: "/", label: "Control room", icon: LayoutDashboard },
  { href: "/live", label: "Live", icon: MonitorPlay },
  { href: "/cameras", label: "Cameras", icon: Camera },
  { href: "/history", label: "History", icon: History },
  { href: "/faces", label: "Faces", icon: ScanFace },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  async function logout() {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <aside className="fixed left-0 top-0 z-40 h-full w-[260px] border-r border-white/10 bg-black/30 p-4 backdrop-blur">
        <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="rounded-xl bg-orange-500/20 p-2">
            <Shield className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-bold">Theft Guard AI</p>
            <p className="text-xs text-muted">Security Dashboard</p>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-orange-500 text-white" : "text-muted hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white/90 hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>
      <main className="ml-[260px] min-h-screen p-6">{children}</main>
    </div>
  );
}
