import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'bag'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'dress'
  | 'edit'
  | 'eye'
  | 'filter'
  | 'grid'
  | 'heart'
  | 'home'
  | 'info'
  | 'instagram'
  | 'layers'
  | 'mail'
  | 'menu'
  | 'more-vertical'
  | 'package'
  | 'plus'
  | 'refresh'
  | 'rotate'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
  | 'shirt'
  | 'sparkles'
  | 'tag'
  | 'truck'
  | 'user'
  | 'users'
  | 'warehouse'
  | 'warning';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const iconPaths: Record<IconName, ReactNode> = {
  'arrow-left': <path d="m9 5 7 7-7 7" />,
  'arrow-right': <path d="m15 5-7 7 7 7" />,
  bag: (
    <>
      <path d="M5 8.5h14l-1 11H6l-1-11Z" />
      <path d="M8.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
      <path d="M10 21h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7 3v4M17 3v4M3.5 9h17" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  dress: (
    <>
      <path d="M9 4.5a3 3 0 0 0 6 0" />
      <path d="m9 6-2 4 2 1-3 8h8l-3-8 2-1-2-4" />
      <path d="m15 6 2 4-2 1 3 8h-8" />
    </>
  ),
  edit: (
    <>
      <path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5 4 16.5Z" />
      <path d="m13.5 7 3.5 3.5M4 20.5l3.5-3.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  heart: (
    <path d="M20.8 8.8c0 5.2-8.8 10.4-8.8 10.4S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z" />
  ),
  home: (
    <>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5v10h13v-10M9 19.5v-5h6v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5M12 7.5h.01" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  'more-vertical': (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  package: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.6-5.7L4 7.5" />
      <path d="M4 4v3.5h3.5M4 13a8 8 0 0 0 13.6 5.7l2.4-2.2" />
      <path d="M20 20v-3.5h-3.5" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 12a8 8 0 0 1 13.6-5.7L20 8.5" />
      <path d="M20 5v3.5h-3.5M20 12a8 8 0 0 1-13.6 5.7L4 15.5" />
      <path d="M4 19v-3.5h3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  send: <path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shield: <path d="M12 3.5 19 6v5.5c0 4.3-2.7 7.7-7 9-4.3-1.3-7-4.7-7-9V6l7-2.5Z" />,
  shirt: (
    <>
      <path d="m8 5 4 2 4-2 4 3-2.5 4-2-1v9h-7v-9l-2 1L4 8l4-3Z" />
      <path d="M10 6.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sparkles: (
    <>
      <path d="m8 3 1.2 3.8L13 8l-3.8 1.2L8 13l-1.2-3.8L3 8l3.8-1.2L8 3Z" />
      <path d="m17 12 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM17 3v3M18.5 4.5h-3" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h7l9 9-7 7-9-9V4Z" />
      <circle cx="8" cy="8" r="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7V9Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  warehouse: (
    <>
      <path d="m3 9 9-5 9 5v11H3V9Z" />
      <path d="M7 20v-6h10v6M7 10h.01M12 10h.01M17 10h.01" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 9 16H3l9-16Z" />
      <path d="M12 9v4M12 16h.01" />
    </>
  ),
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}
