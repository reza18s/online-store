import { Icon } from '../ui/icon';

export function AdminNewCustomers() {
  const customers = [
    {
      name: 'کاربر نمونه ۱',
      email: 'demo-customer-1@example.test',
      time: 'زمان نمونه ۱',
      image: '/assets/nova-hero-men.webp',
    },
    {
      name: 'کاربر نمونه ۲',
      email: 'demo-customer-2@example.test',
      time: 'زمان نمونه ۲',
      image: '/assets/nova-women-lifestyle.webp',
    },
    {
      name: 'کاربر نمونه ۳',
      email: 'demo-customer-3@example.test',
      time: 'زمان نمونه ۳',
      image: '/assets/nova-children-lifestyle.webp',
    },
    {
      name: 'کاربر نمونه ۴',
      email: 'demo-customer-4@example.test',
      time: 'زمان نمونه ۴',
      image: '/assets/nova-materials.webp',
    },
    {
      name: 'کاربر نمونه ۵',
      email: 'demo-customer-5@example.test',
      time: 'زمان نمونه ۵',
      image: '/assets/nova-product-oxford-shirt.webp',
    },
  ];
  return (
    <section
      className="border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="new-customers-title"
    >
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h2 id="new-customers-title" className="text-base md:text-lg">
          مشتریان جدید
        </h2>
        <a className="text-link text-xs" href="#admin/customers">
          مشاهده همه <Icon name="arrow-left" size={14} />
        </a>
      </header>
      <div className="mt-1">
        {customers.map((customer) => (
          <div
            className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
            key={customer.email}
          >
            <img
              className="h-9 w-9 shrink-0 rounded-full object-cover"
              src={customer.image}
              alt=""
            />
            <div className="min-w-0 flex-1 text-right">
              <strong className="block truncate text-xs font-medium">{customer.name}</strong>
              <small className="mt-1 block truncate text-[9px] text-muted-foreground" dir="ltr">
                {customer.email}
              </small>
            </div>
            <time className="shrink-0 text-[9px] text-muted-foreground">{customer.time}</time>
          </div>
        ))}
      </div>
    </section>
  );
}
