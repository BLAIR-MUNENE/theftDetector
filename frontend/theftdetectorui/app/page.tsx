import Link from "next/link";
import { fetchStats } from "@/lib/api";

export default async function Home() {
  const stats = await fetchStats();
  const weekly = stats.weekly_data;
  const totalAlerts = weekly.reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Live Surveillance</h1>
      <p className="text-muted">Recreated dashboard connected to Django Ninja Extra backend.</p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-muted">7-day total alerts</p>
          <p className="text-2xl font-semibold">{totalAlerts}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-muted">Today alerts</p>
          <p className="text-2xl font-semibold">{weekly[6] ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-muted">Trend vs yesterday</p>
          <p className="text-2xl font-semibold">{(weekly[6] ?? 0) - (weekly[5] ?? 0)}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Link className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white" href="/live">Open Live View</Link>
        <Link className="rounded-lg border border-white/20 px-4 py-2 text-sm" href="/settings">Open Settings</Link>
      </div>
    </div>
  );
}
