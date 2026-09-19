import { Icon } from '../../../components/ui/icon';

export function ProfilePanel({
  customer,
}: {
  customer: { email: string | null; phone: string; status: string };
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="account-panel">
        <span className="section-heading__eyebrow">اطلاعات تماس</span>
        <h2>شماره موبایل</h2>
        <p dir="ltr">{customer.phone}</p>
        <h2 className="mt-5">ایمیل</h2>
        <p dir="ltr">{customer.email ?? 'ثبت نشده'}</p>
      </div>
      <div className="account-panel">
        <span className="section-heading__eyebrow">وضعیت حساب</span>
        <h2>{customer.status === 'ACTIVE' ? 'حساب فعال' : 'حساب محدود'}</h2>
        <p>برای تغییر اطلاعات ورود یا کمک درباره حساب، با پشتیبانی نوا در تماس باشید.</p>
        <a className="text-link" href="#support">
          ارتباط با پشتیبانی <Icon name="arrow-left" size={15} />
        </a>
      </div>
    </section>
  );
}
