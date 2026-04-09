import LiveFeeds from "@/components/LiveFeeds";

export default function LivePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Camera feeds</h1>
      </header>
      <LiveFeeds />
    </div>
  );
}
