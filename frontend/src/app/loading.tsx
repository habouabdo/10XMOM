export default function Loading() {
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-sea-100 border-t-clay-600" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
