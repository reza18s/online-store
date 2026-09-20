export function AdminSessionLoading() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4" dir="rtl">
      <section className="w-full max-w-md bg-surface p-8 text-right shadow-float" role="status">
        <span className="section-heading__eyebrow">NOVA / ADMIN ACCESS</span>
        <h1 className="mt-2 text-2xl leading-relaxed">در حال بررسی دسترسی</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">
          نشست مدیریت شما در حال بررسی است.
        </p>
      </section>
    </main>
  );
}
