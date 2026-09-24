import type { SVGProps } from "react";

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CartIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M2 3h2l2.4 12.3a2 2 0 0 0 2 1.7h8.7a2 2 0 0 0 2-1.6L21 7H5.1" />
    </svg>
  );
}

export function UserIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  );
}

export function SearchIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function MenuIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}

export function CloseIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function CheckIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function TrashIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function PlusIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function ArrowRightIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function BoltIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
    </svg>
  );
}

export function ShieldIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M12 3 5 6v5c0 4.4 3 8.5 7 10 4-1.5 7-5.6 7-10V6l-7-3z" />
    </svg>
  );
}

export function DiscordIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" {...p}>
      <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.2.5a15 15 0 0 1 4.3 1.4C17 3.7 14.6 3.3 12 3.3s-5 .4-7.5 1.6A15 15 0 0 1 8.8 3.5L8.6 3A19.8 19.8 0 0 0 3.7 4.4C1 8.4.4 12.4.7 16.3a20 20 0 0 0 6 3l.5-1c-.7-.3-1.4-.7-2-1.1l.4-.3a14.3 14.3 0 0 0 12.2 0l.4.3c-.6.4-1.3.8-2 1.1l.5 1a20 20 0 0 0 6-3c.4-4.6-.6-8.5-2.8-11.9ZM8.6 14c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.7 2-1.7 2Zm6.8 0c-.9 0-1.7-.9-1.7-2s.8-2 1.7-2 1.7.9 1.7 2-.7 2-1.7 2Z" />
    </svg>
  );
}

export function GoogleIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" {...p}>
      <path d="M12 11v3.3h5.3c-.2 1.4-1.6 4-5.3 4-3.2 0-5.8-2.6-5.8-5.9S8.8 6.5 12 6.5c1.8 0 3 .8 3.7 1.4l2.5-2.4C16.6 4 14.5 3.2 12 3.2 6.9 3.2 2.8 7.3 2.8 12S6.9 20.8 12 20.8c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.9H12z" />
    </svg>
  );
}

export function ChatIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z" />
    </svg>
  );
}

export function BoxIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
      <path d="m3 8 9 5 9-5M12 21v-8" />
    </svg>
  );
}

export function ChartIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M3 3v18h18" />
      <path d="M7 15l3-4 3 2 4-6" />
    </svg>
  );
}

export function TagIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M20.6 13.4 12 22l-8-8V4h10l6.6 6.6a2 2 0 0 1 0 2.8z" />
      <circle cx="8.5" cy="8.5" r="1.2" />
    </svg>
  );
}

export function UsersIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3 2.9-5.2 6.5-5.2s6.5 2.2 6.5 5.2" />
      <path d="M16 5.2A3 3 0 0 1 16 11M18 20c0-2.2-.9-3.6-2-4.4" />
    </svg>
  );
}

export function ClipboardIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <rect x="7" y="4" width="10" height="4" rx="1" />
      <path d="M9 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" />
    </svg>
  );
}

export function LayersIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="m2 12 10 5 10-5M2 17l10 5 10-5" />
    </svg>
  );
}

export function LogoutIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l-5-5 5-5M5 12h12" />
    </svg>
  );
}

export function ChevronDownIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ClockIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function AlertIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M12 9v4M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  );
}
