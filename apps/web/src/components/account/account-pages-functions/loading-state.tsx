export function LoadingState({ label, rows = 2 }: { label: string; rows?: number }) {
  return (
    <section className="mx-auto max-w-4xl animate-pulse space-y-4" role="status" aria-label={label}>
      <div className="h-4 w-36 rounded bg-secondary" />
      <div className="h-8 w-64 rounded bg-secondary" />
      <div className="h-4 w-full max-w-md rounded bg-secondary" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: rows }, (_, index) => (
          <div className="h-36 rounded-editorial bg-secondary" key={index} />
        ))}
      </div>
    </section>
  );
}
