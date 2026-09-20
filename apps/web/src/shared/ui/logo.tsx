export function Logo({ descriptor = 'ATELIER EDITORIAL' }: { descriptor?: string } = {}) {
  return (
    <a
      className="brand-lockup inline-flex w-max flex-col items-center leading-none"
      href="#home"
      aria-label="NOVA، صفحه اصلی"
    >
      <span className="brand-lockup__name">NOVA</span>
      <span className="brand-lockup__descriptor !text-muted-foreground">{descriptor}</span>
    </a>
  );
}
