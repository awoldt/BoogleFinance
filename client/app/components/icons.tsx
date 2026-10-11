import type { SVGProps } from "react";
import type { TrendIcon } from "~/data/markets";

type IconProps = SVGProps<SVGSVGElement>;

export function SpinnerIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...props}
      className={`animate-spin ${props.className ?? ""}`}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.2"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 16.5 20 20.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 11v5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 6.5v11M6.5 12h11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M6.5 12.5 10.2 16 17.5 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M15 5.5 8.5 12l6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M8 7h11M8 12h11M8 17h11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="4.5" cy="7" r="1" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" />
      <circle cx="4.5" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 3.5v4M16 3.5v4M4 10h16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M15.5 3.8A7.8 7.8 0 1 0 20.2 14 6.2 6.2 0 0 1 15.5 3.8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PortfolioIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M5 16.5 9.2 11l3 3.2L19 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.5 7.5H19V12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendGlyph({ icon }: { icon: TrendIcon }) {
  const common = "h-4 w-4";
  switch (icon) {
    case "indexes":
      return (
        <svg viewBox="0 0 24 24" className={`${common} text-muted`} fill="none" aria-hidden="true">
          <path d="M4 16.5 9 11l3.2 3L20 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "active":
      return (
        <svg viewBox="0 0 24 24" className={`${common} text-link`} fill="none" aria-hidden="true">
          <path d="M6 16V10M12 16V7M18 16v-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "gainers":
      return (
        <svg viewBox="0 0 24 24" className={`${common} text-up`} fill="none" aria-hidden="true">
          <path d="M5 15.5 10 10l3 2.5L19 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 7h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "losers":
      return (
        <svg viewBox="0 0 24 24" className={`${common} text-down`} fill="none" aria-hidden="true">
          <path d="M5 8.5 10 14l3-2.5L19 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 17h5v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "climate":
      return (
        <svg viewBox="0 0 24 24" className={`${common} text-up`} fill="none" aria-hidden="true">
          <path d="M12 20s6-3.4 6-8.2A6 6 0 0 0 12 6a6 6 0 0 0-6 5.8C6 16.6 12 20 12 20Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 20V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "crypto":
      return (
        <svg viewBox="0 0 24 24" className={`${common} text-[#f7931a]`} fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
          <path d="M10 8.2h3.1a1.8 1.8 0 0 1 0 3.6H10m0 0h3.4a1.8 1.8 0 0 1 0 3.6H10M10 8.2V7m0 8.4V17M11.2 8.2V7m0 10v-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "currencies":
      return (
        <svg viewBox="0 0 24 24" className={`${common} text-muted`} fill="none" aria-hidden="true">
          <ellipse cx="9" cy="10" rx="4.2" ry="4.2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12.2 12.4a4.2 4.2 0 1 0 4.6 4.6" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
  }
}

export function ArrowIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
      {direction === "up" ? (
        <path d="M6 9.5V2.5M6 2.5 3 5.5M6 2.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 2.5v7M6 9.5 3 6.5M6 9.5l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}
