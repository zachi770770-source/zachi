export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-clay-500">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sand-300 border-t-clay-500" />
        <p className="text-sm">טוען…</p>
      </div>
    </div>
  );
}
