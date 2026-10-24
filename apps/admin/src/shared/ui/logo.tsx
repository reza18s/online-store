export function Logo({
  descriptor = 'ATELIER EDITORIAL',
  href = '/admin',
  ariaLabel = 'NOVA، داشبورد مدیریت',
}: {
  descriptor?: string;
  href?: string;
  ariaLabel?: string;
} = {}) {
  return (
    <a
      className="brand-lockup inline-flex w-max flex-col items-center leading-none"
      href={href}
      aria-label={ariaLabel}
    >
      <span className="brand-lockup__name">NOVA</span>
      <span className="brand-lockup__descriptor !text-muted-foreground">{descriptor}</span>
    </a>
  );
}
