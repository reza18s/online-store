export function LoadingRows() {
  return (
    <div className="space-y-3" aria-label="در حال بارگذاری" role="status">
      {[1, 2, 3, 4].map((row) => (
        <div
          className="motion-safe:animate-pulse motion-reduce:animate-none rounded-panel border border-border bg-background p-4"
          key={row}
        >
          <div className="h-3 w-1/3 rounded bg-secondary" />
          <div className="mt-3 h-3 w-2/3 rounded bg-secondary" />
        </div>
      ))}
      <span className="sr-only">در حال دریافت اطلاعات...</span>
    </div>
  );
}
