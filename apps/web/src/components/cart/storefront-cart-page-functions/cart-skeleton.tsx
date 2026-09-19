export function CartSkeleton() {
  return (
    <section
      className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]"
      role="status"
      aria-label="در حال بارگذاری سبد خرید"
    >
      <div className="space-y-3">
        {[1, 2].map((item) => (
          <div
            className="h-32 rounded-editorial bg-secondary motion-safe:animate-pulse"
            key={item}
          />
        ))}
      </div>
      <div className="h-72 rounded-editorial bg-secondary motion-safe:animate-pulse" />
    </section>
  );
}
