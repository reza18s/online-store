export function AdminOperationsLogo({ mobile = false }: { mobile?: boolean } = {}) {
  return (
    <a
      className={`flex w-max flex-col leading-none ${mobile ? 'items-end' : 'items-center'}`}
      href="#admin"
      aria-label="نوا، فضای مدیریت"
    >
      <span className={`${mobile ? 'text-xl' : 'text-[30px]'} font-display tracking-[0.16em]`}>
        نوا
      </span>
      <span className="mt-2 text-[8px] tracking-[0.2em] text-[#e7ded2]/70">ATELIER EDITORIAL</span>
    </a>
  );
}
