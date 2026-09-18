import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(({ className, ...props }, ref) => (
  <input
    {...props}
    ref={ref}
    type="radio"
    className={cn(
      'nova-radio h-5 w-5 shrink-0 appearance-none rounded-full border border-border bg-background align-middle transition-[background-color,border-color,box-shadow] duration-[140ms] checked:border-[6px] checked:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
      className,
    )}
  />
));

Radio.displayName = 'Radio';
