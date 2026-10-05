import type { ReactNode } from "react";

function Icon({ size = 18, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type IconProps = { size?: number };

export function BackIcon({ size = 22 }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Icon>
  );
}

export function ArrowIcon({ size = 16 }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function ChevronIcon({ size = 16 }: IconProps) {
  return (
    <Icon size={size}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

export function SearchIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.35-4.35" />
    </Icon>
  );
}

export function CloseIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function CalendarIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Icon>
  );
}

export function PinIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </Icon>
  );
}

/** Two crossed blades: the one battle motif on the site, used for "who fought" and the Battles tab. */
export function VersusIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M5 4l11 11M5 4h3M5 4v3M19 4 8 15M19 4h-3M19 4v3" />
      <path d="M13 17l4-4M11 17l-4-4M16.5 16.5 19 19M7.5 16.5 5 19" />
    </Icon>
  );
}

export function FlagIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M5 21V4M5 4.5h12.5l-2.5 4 2.5 4H5" />
    </Icon>
  );
}

export function PeopleIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5M15.5 5.5a3.2 3.2 0 0 1 0 6.2M17.5 14.3c2 .5 3.5 2.3 3.5 4.7" />
    </Icon>
  );
}

export function PersonIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </Icon>
  );
}

export function BookIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2ZM12 6.5v14" />
    </Icon>
  );
}

export function ListIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </Icon>
  );
}

export function PlusIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function MinusIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M5 12h14" />
    </Icon>
  );
}

/** A reticle: "bring the whole map back into view". */
export function RecenterIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    </Icon>
  );
}
