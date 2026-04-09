"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MonitorPlay,
  PlaySquare,
  BrainCircuit,
  Crosshair,
  Camera,
  History,
  ScanFace,
  Settings2,
  Shield,
  UserCircle2,
  Users,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { API_BASE } from "@/lib/config";

const nav = [
  { href: "/", label: "Control room", icon: LayoutDashboard },
  { href: "/live", label: "Live", icon: MonitorPlay },
  { href: "/playback", label: "Playback", icon: PlaySquare },
  { href: "/roi", label: "ROI zones", icon: Crosshair },
  { href: "/cameras", label: "Cameras", icon: Camera },
  { href: "/history", label: "History", icon: History },
  { href: "/faces", label: "Faces", icon: ScanFace },
  { href: "/settings", label: "Settings", icon: Settings2 },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isAdmin = Boolean(user?.isAdmin);
  const items = [
    ...nav,
    ...(isAdmin ? [{ href: "/train", label: "Train", icon: BrainCircuit }, { href: "/admin/users", label: "User Management", icon: Users }] : []),
  ];

  if (isAuthPage) {
    return <>{children}</>;
  }

  async function logout() {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    router.replace("/login");
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="app-bg" />
      <aside
        style={{ width: 260, height: "100%", position: "fixed", zIndex: 40, top: 0, left: 0, overflowX: "hidden", overflowY: "auto" }}
        className="glass glass-edge glass-shadow flex flex-col border-r border-white/[0.06]"
      >
        <div style={{ padding: "24px 20px 20px" }} className="border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,107,0,0.15)] ring-1 ring-[rgba(255,107,0,0.35)]">
              <Shield className="h-5 w-5 text-[rgb(var(--accent-orange))]" aria-hidden />
            </div>
            <div>
              <p className="font-headline text-sm font-bold leading-tight tracking-tight text-foreground">
                Theft Guard AI
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted">
                Security Dashboard
              </p>
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 20px 6px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }} className="text-muted">
            Navigation
          </p>
        </div>
        <nav className="flex flex-1 flex-col" style={{ paddingBottom: 8 }}>
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 20px",
                  fontSize: 13.5,
                  fontWeight: 500,
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s",
                  borderLeft: active ? "3px solid transparent" : "3px solid transparent",
                }}
                className={active ? "bg-[rgb(var(--accent-orange))] text-white shadow-[0_4px_20px_rgba(255,107,0,0.3)]" : "text-muted hover:bg-white/[0.05] hover:text-foreground"}
              >
                <Icon style={{ width: 17, height: 17, flexShrink: 0, opacity: active ? 1 : 0.65 }} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: "12px 20px", fontSize: 11 }} className="border-t border-white/[0.06] text-muted">
          <div className="flex items-center justify-between">
            <span>API endpoint</span>
            <code className="rounded bg-white/[0.07] px-1.5 py-0.5 text-foreground">
              :8000
            </code>
          </div>
          <button type="button" onClick={logout} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs text-foreground hover:bg-white/10">
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>
      <main style={{ marginLeft: 260 }} className="relative z-10 min-h-screen">
        <div className="mx-auto max-w-[1600px] p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
