import { type ReactNode } from 'react';

export function ltr(value: ReactNode, className = ''): ReactNode {
  return (
    <span className={`inline-block text-left ${className}`} dir="ltr">
      {value}
    </span>
  );
}
