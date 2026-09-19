import { Icon } from '../ui/icon';

export function AdminCampaignBanner() {
  return (
    <a
      className="relative isolate flex min-h-[120px] items-center overflow-hidden bg-primary-hover p-5 text-primary-foreground shadow-card md:min-h-[132px] md:px-8"
      href="#campaign"
    >
      <img
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40"
        src="/assets/nova-women-lifestyle.webp"
        alt=""
      />
      <span className="absolute inset-0 -z-10 bg-primary-hover/65" />
      <div className="relative ml-auto max-w-lg text-right">
        <span className="section-heading__eyebrow !text-primary-foreground/75">
          NOVA / AUTUMN ۱۴۰۵
        </span>
        <h2 className="mt-1 text-xl md:text-2xl">مجموعه پاییز ۱۴۰۵</h2>
        <p className="mt-1 text-xs leading-7 text-primary-foreground/80">
          الهام از سادگی، ساخته برای زندگی امروز
        </p>
      </div>
      <span className="relative hidden min-h-10 items-center gap-2 border border-primary-foreground/50 bg-primary-foreground px-4 text-xs text-primary-hover md:inline-flex">
        مشاهده و ویرایش <Icon name="arrow-left" size={15} />
      </span>
    </a>
  );
}
