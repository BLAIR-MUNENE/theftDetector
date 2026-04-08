import { fetchHistory } from "@/lib/api";

export default async function HistoryPage() {
  const rows = await fetchHistory();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Alert History</h1>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-muted">No alerts yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium">{row.message}</p>
              <p className="text-xs text-muted">{row.timestamp}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
