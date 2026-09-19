import { Icon } from '../ui/icon';

export function AdminOrderStatus() {
  const statuses = [
    { label: 'در حال پردازش', value: 'نمونه', color: 'bg-[#d9d1c8]' },
    { label: 'ارسال شده', value: 'نمونه', color: 'bg-primary' },
    { label: 'تحویل شده', value: 'نمونه', color: 'bg-[#989492]' },
    { label: 'لغو شده', value: 'نمونه', color: 'bg-[#ef7a9d]' },
    { label: 'بازگشت', value: 'نمونه', color: 'bg-[#e5ddd5]' },
  ];
  return (
    <section
      className="border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="order-status-title"
    >
      <header className="flex items-center justify-between">
        <h2 id="order-status-title" className="text-lg md:text-xl">
          وضعیت سفارش‌ها
        </h2>
        <Icon name="package" size={18} className="text-muted-foreground" />
      </header>
      <div className="mt-5 flex items-center justify-center gap-5">
        <div className="relative h-40 w-40 shrink-0">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 120 120"
            role="img"
            aria-label="داده نمایشی سفارش‌ها"
          >
            <circle cx="60" cy="60" r="42" fill="none" stroke="#f1ece6" strokeWidth="16" />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#712D42"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="45 55"
              strokeDashoffset="0"
            />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#989492"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="18 82"
              strokeDashoffset="-45"
            />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#d9d1c8"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="28 72"
              strokeDashoffset="-63"
            />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#ef7a9d"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="6 94"
              strokeDashoffset="-91"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-muted-foreground">کل سفارش‌ها</span>
            <strong className="mt-1 font-display text-2xl">نمونه</strong>
          </div>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col gap-3 text-[10px] text-muted-foreground">
          {statuses.map((status) => (
            <li className="flex items-center justify-between gap-3" key={status.label}>
              <span className="inline-flex items-center gap-2">
                <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.color}`} />
                {status.label}
              </span>
              <strong className="text-foreground">{status.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
