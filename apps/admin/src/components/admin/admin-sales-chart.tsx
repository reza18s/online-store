import { Button } from '@nova/ui';

import { Icon } from '../ui/icon';

export function AdminSalesChart() {
  const labels = ['۱ مرداد', '۵ مرداد', '۱۰ مرداد', '۱۵ مرداد', '۲۰ مرداد', '۲۵ مرداد', '۳۰ مرداد'];
  return (
    <section
      className="overflow-hidden border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="sales-chart-title"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="text-right">
          <span className="section-heading__eyebrow">ANALYTICS / ۳۰ روز</span>
          <h2 id="sales-chart-title" className="mt-1 text-lg md:text-xl">
            فروش و درآمد
          </h2>
        </div>
        <Button
          className="inline-flex min-h-10 items-center gap-2 border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          type="button"
        >
          ۳۰ روز گذشته <Icon name="chevron-down" size={14} />
        </Button>
      </header>
      <div className="mt-4 flex flex-wrap justify-end gap-4 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-primary" />
          درآمد (تومان)
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-border" />
          تعداد سفارش
        </span>
      </div>
      <div className="mt-2 overflow-x-auto">
        <svg
          className="h-[180px] min-w-[560px] w-full"
          viewBox="0 0 680 230"
          role="img"
          aria-label="نمودار فروش و درآمد در ۳۰ روز گذشته"
          preserveAspectRatio="none"
        >
          <g stroke="currentColor" className="text-border" strokeWidth="1" opacity="0.7">
            <line x1="34" y1="24" x2="650" y2="24" />
            <line x1="34" y1="67" x2="650" y2="67" />
            <line x1="34" y1="110" x2="650" y2="110" />
            <line x1="34" y1="153" x2="650" y2="153" />
            <line x1="34" y1="196" x2="650" y2="196" />
          </g>
          <path
            d="M34 177 C72 178 74 159 112 158 S145 146 168 142 S202 126 230 132 S268 155 292 145 S330 100 356 108 S391 155 420 146 S458 121 482 131 S518 99 548 110 S600 119 650 94"
            fill="none"
            stroke="#712D42"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M34 188 C72 182 76 175 112 179 S150 166 168 172 S200 160 230 168 S267 183 292 173 S330 145 356 157 S388 181 420 176 S456 158 482 165 S520 144 548 153 S604 158 650 145"
            fill="none"
            stroke="#C9C2BC"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M34 177 C72 178 74 159 112 158 S145 146 168 142 S202 126 230 132 S268 155 292 145 S330 100 356 108 S391 155 420 146 S458 121 482 131 S518 99 548 110 S600 119 650 94 L650 196 L34 196 Z"
            fill="#712D42"
            opacity="0.08"
          />
          <g fill="#712D42">
            <circle cx="34" cy="177" r="4" />
            <circle cx="112" cy="158" r="4" />
            <circle cx="168" cy="142" r="4" />
            <circle cx="230" cy="132" r="4" />
            <circle cx="292" cy="145" r="4" />
            <circle cx="356" cy="108" r="4" />
            <circle cx="420" cy="146" r="4" />
            <circle cx="482" cy="131" r="4" />
            <circle cx="548" cy="110" r="4" />
            <circle cx="650" cy="94" r="4" />
          </g>
        </svg>
      </div>
      <div className="flex justify-between gap-2 pr-8 text-[9px] text-muted-foreground" dir="ltr">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </section>
  );
}
