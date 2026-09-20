import { type ReactNode } from 'react';

export function ltr(value: ReactNode, className = ''): ReactNode {
  return (
    <span dir="ltr" className={`inline-block text-left ${className}`}>
      {value}
    </span>
  );
}
