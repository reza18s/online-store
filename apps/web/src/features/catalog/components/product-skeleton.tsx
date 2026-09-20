export function ProductSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
      role="status"
      aria-label="در حال بارگذاری محصولات"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="min-w-0 motion-safe:animate-pulse" key={index}>
          <div className="aspect-square rounded-editorial bg-secondary" />
          <div className="mt-3 h-3 w-2/5 rounded bg-secondary" />
          <div className="mt-2 h-4 w-4/5 rounded bg-secondary" />
          <div className="mt-3 h-3 w-1/2 rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}
