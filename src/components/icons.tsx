import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

function Svg({ size = 18, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </Svg>
  );
}

export function MedicineIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(45 12 12)" />
      <line x1="9" y1="9" x2="9" y2="15" transform="rotate(45 12 12)" />
    </Svg>
  );
}

export function BatchesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <polygon points="12 3 21 8 12 13 3 8" />
      <polyline points="3 13 12 18 21 13" />
      <polyline points="3 17.5 12 22 21 17.5" />
    </Svg>
  );
}

export function LedgerIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="16" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </Svg>
  );
}

export function CategoriesIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3.24L4 3a1 1 0 0 0-1 1l.24 5.59a2 2 0 0 0 .59 1.41l9.58 9.58a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z" />
      <circle cx="7.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </Svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <line x1="12" y1="3" x2="12" y2="5.5" />
      <line x1="12" y1="18.5" x2="12" y2="21" />
      <line x1="3" y1="12" x2="5.5" y2="12" />
      <line x1="18.5" y1="12" x2="21" y2="12" />
      <line x1="5.6" y1="5.6" x2="7.4" y2="7.4" />
      <line x1="16.6" y1="16.6" x2="18.4" y2="18.4" />
      <line x1="5.6" y1="18.4" x2="7.4" y2="16.6" />
      <line x1="16.6" y1="7.4" x2="18.4" y2="5.6" />
    </Svg>
  );
}

export function PanelToggleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
    </Svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </Svg>
  );
}
