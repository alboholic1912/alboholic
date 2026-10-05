import type { ReactNode } from "react";
import type { CitationType } from "@/lib/content/types";

function Icon({ size = 16, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

type IconProps = { size?: number };

export function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3L12 3z" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <Icon size={10}>
      <path d="M9 6l6 6-6 6" />
    </Icon>
  );
}

export function PinIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  );
}

export function UserIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </Icon>
  );
}

function CalendarIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Icon>
  );
}

function HourglassIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M6 3h12M6 21h12M7 3v3.5a4 4 0 0 0 1.5 3.1L12 12l3.5-2.4A4 4 0 0 0 17 6.5V3M7 21v-3.5a4 4 0 0 1 1.5-3.1L12 12l3.5 2.4a4 4 0 0 1 1.5 3.1V21" />
    </Icon>
  );
}

function ClockIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </Icon>
  );
}

function InstitutionIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" />
    </Icon>
  );
}

function MapIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M9 4 3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4zM9 4v13.5M15 6.5V20" />
    </Icon>
  );
}

function DiamondIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M12 3l9 9-9 9-9-9 9-9z" />
    </Icon>
  );
}

function BookIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM5 17a3 3 0 0 1 3-3h11" />
    </Icon>
  );
}

function ArchiveIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M3 5h18v4H3zM5 9v10h14V9M10 13h4" />
    </Icon>
  );
}

function AcademicIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M2 9l10-5 10 5-10 5L2 9zM6 11.5V16c1.5 1.5 3.6 2.2 6 2.2s4.5-.7 6-2.2v-4.5M22 9v6" />
    </Icon>
  );
}

function GlobeIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z" />
    </Icon>
  );
}

function DocumentIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M7 3h7l5 5v13H7V3zM14 3v5h5M10 13h6M10 17h6" />
    </Icon>
  );
}

function BookmarkIcon({ size }: IconProps) {
  return (
    <Icon size={size}>
      <path d="M7 3h10v18l-5-4-5 4V3z" />
    </Icon>
  );
}

// "At a glance" labels are free text, so the icon is picked by what the label mentions.
const FACT_ICONS: [RegExp, (props: IconProps) => ReactNode][] = [
  [/place|region|country|origin|location|area|homeland/, MapIcon],
  [/born|birth/, CalendarIcon],
  [/died|death|killed|fell|executed/, HourglassIcon],
  [/active|years|period|reign|era|term/, ClockIcon],
  [/affiliation|organi[sz]ation|party|army|movement|unit|member|order/, InstitutionIcon],
  [/role|occupation|profession|title|rank|position/, UserIcon],
  [/work|book|writing|publication/, BookIcon],
];

export function FactIcon({ label, size = 18 }: { label: string; size?: number }) {
  const match = FACT_ICONS.find(([pattern]) => pattern.test(label.toLowerCase()));
  const Match = match ? match[1] : DiamondIcon;
  return <Match size={size} />;
}

const SOURCE_ICONS: Record<CitationType, (props: IconProps) => ReactNode> = {
  book: BookIcon,
  archive: ArchiveIcon,
  academic: AcademicIcon,
  website: GlobeIcon,
  document: DocumentIcon,
  institution: InstitutionIcon,
  other: BookmarkIcon,
};

export function SourceIcon({ type, size = 16 }: { type: CitationType; size?: number }) {
  const Match = SOURCE_ICONS[type];
  return <Match size={size} />;
}
