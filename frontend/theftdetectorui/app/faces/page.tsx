import { fetchFaces } from "@/lib/api";

export default async function FacesPage() {
  const faces = await fetchFaces();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Face Registry</h1>
      {faces.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-muted">No faces found.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {faces.map((f) => (
            <div key={f.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold">{f.name}</p>
              <p className="text-sm text-muted">{f.type}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
