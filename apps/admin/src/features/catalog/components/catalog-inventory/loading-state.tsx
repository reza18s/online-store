export function LoadingState({ label = 'در حال بارگذاری اطلاعات...' }: { label?: string }) {
  return (
    <div className="space-y-3" aria-label={label} role="status">
      {[1, 2, 3].map((row) => (
        <div
          className="motion-safe:animate-pulse motion-reduce:animate-none border border-border bg-surface p-5"
          key={row}
        >
          <div className="h-3 w-1/4 rounded bg-secondary" />
          <div className="mt-3 h-3 w-2/3 rounded bg-secondary" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
