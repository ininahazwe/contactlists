/**
 * Icon set matching the mockup's template: viewBox 24, 1.6 stroke,
 * rounded ends, no fill. The .i class carries the style; size is set
 * by context (button, badge, meta...).
 */
type P = { className?: string };

const svg = (children: React.ReactNode) =>
  function Icon({ className = "i" }: P) {
    return (
      <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
        {children}
      </svg>
    );
  };

export const IconSearch = svg(
  <>
    <circle cx="11" cy="11" r="7.1" />
    <path d="M16.3 16.3 20.6 20.6" />
  </>
);

export const IconClose = svg(<path d="M6.6 6.6l10.8 10.8M17.4 6.6 6.6 17.4" />);

export const IconChevron = svg(<path d="M6.6 9.4 12 14.8l5.4-5.4" />);

export const IconArrowUpRight = svg(<path d="M7.4 16.6 16.6 7.4M9.2 7.4h7.4v7.4" />);

export const IconGrid = svg(
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2.2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2.2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2.2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2.2" />
  </>
);

export const IconList = svg(
  <path d="M8.2 7.2h12M4 7.2h.02M8.2 12h12M4 12h.02M8.2 16.8h12M4 16.8h.02" />
);

export const IconUser = svg(
  <>
    <circle cx="12" cy="8.4" r="3.9" />
    <path d="M4.8 20.2c0-3.7 3.2-5.9 7.2-5.9s7.2 2.2 7.2 5.9" />
  </>
);

export const IconUsers = svg(
  <>
    <circle cx="9.4" cy="8.6" r="3.5" />
    <path d="M3 20c0-3.4 2.9-5.4 6.4-5.4s6.4 2 6.4 5.4" />
    <path d="M16.2 5.6a3.4 3.4 0 0 1 0 6.6M17.6 14.9c2.1.5 3.6 1.9 3.6 4.3" />
  </>
);

export const IconBuilding = svg(
  <>
    <rect x="4" y="2.8" width="16" height="18.4" rx="2.4" />
    <path d="M9 7.4h.02M15 7.4h.02M9 12h.02M15 12h.02M9.6 17.4h4.8" />
  </>
);

export const IconCalendar = svg(
  <>
    <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="3.2" />
    <path d="M3.8 10h16.4M8.4 3.4v3.6M15.6 3.4v3.6" />
  </>
);

export const IconFilter = svg(
  <>
    <path d="M8.6 5.2v13.6M15.4 5.2v13.6" />
    <circle cx="8.6" cy="9.2" r="2.1" />
    <circle cx="15.4" cy="14.8" r="2.1" />
  </>
);

export const IconPin = svg(
  <>
    <path d="M12 21.2s6.6-5.4 6.6-10.4a6.6 6.6 0 1 0-13.2 0c0 5 6.6 10.4 6.6 10.4Z" />
    <circle cx="12" cy="10.6" r="2.4" />
  </>
);

export const IconMail = svg(
  <>
    <rect x="2.8" y="5.2" width="18.4" height="13.6" rx="3.4" />
    <path d="M3.6 7.4 12 13l8.4-5.6" />
  </>
);

export const IconPhone = svg(
  <path d="M8.1 3.6H5.8c-1.2 0-2.2 1-2.1 2.2.3 3.6 1.7 7 4 9.7 2.1 2.5 4.9 4.3 8 5.1 1.2.3 2.4-.6 2.4-1.9v-2.2c0-1-.7-1.9-1.7-2.1l-1.9-.4c-.7-.1-1.5.1-2 .7l-.6.6a15 15 0 0 1-4.2-5l.7-.6c.5-.5.8-1.2.7-2l-.4-1.9c-.2-1-1-1.7-2.1-1.7Z" />
);

export const IconGlobe = svg(
  <>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M3.6 12h16.8M12 3.4c2.2 2.3 3.4 5.4 3.4 8.6S14.2 18.3 12 20.6c-2.2-2.3-3.4-5.4-3.4-8.6S9.8 5.7 12 3.4Z" />
  </>
);

export const IconCash = svg(
  <>
    <rect x="2.6" y="6.2" width="18.8" height="11.6" rx="3" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6.2 12h.02M17.8 12h.02" />
  </>
);

export const IconPlus = svg(<path d="M12 5.2v13.6M5.2 12h13.6" />);

export const IconEdit = svg(
  <>
    <path d="M4.4 19.6h3.3L19.2 8.1a2.3 2.3 0 0 0-3.3-3.3L4.4 16.3v3.3Z" />
    <path d="M14.9 5.8l3.3 3.3" />
  </>
);

export const IconHome = svg(
  <path d="M3.7 10.4 12 3.6l8.3 6.8v8.2c0 1-.8 1.8-1.8 1.8H5.5c-1 0-1.8-.8-1.8-1.8v-8.2Z" />
);

export const IconTimeline = svg(
  <>
    <path d="M6.4 3.6v16.8" />
    <circle cx="6.4" cy="7.6" r="2.3" />
    <circle cx="6.4" cy="16.4" r="2.3" />
    <path d="M11 7.6h9M11 16.4h6" />
  </>
);

export const IconLogout = svg(
  <>
    <path d="M9.6 20.4H6.2c-1.2 0-2.2-1-2.2-2.2V5.8c0-1.2 1-2.2 2.2-2.2h3.4" />
    <path d="M15.4 16.2 19.6 12l-4.2-4.2M9.4 12h10" />
  </>
);

export const IconSort = svg(
  <>
    <path d="M7 4.6v14.8M3.8 16.2 7 19.4l3.2-3.2" />
    <path d="M17 19.4V4.6M13.8 7.8 17 4.6l3.2 3.2" />
  </>
);

export const IconBell = svg(
  <>
    <path d="M18.3 15.6V10.7a6.3 6.3 0 0 0-12.6 0v4.9l-1.3 2.1h15.2l-1.3-2.1Z" />
    <path d="M9.7 20.4a2.4 2.4 0 0 0 4.6 0" />
  </>
);

export const IconUpload = svg(
  <>
    <path d="M12 15.6V4.4M7.4 8.8 12 4.2l4.6 4.6" />
    <path d="M4.4 15.6v3.2c0 1 .8 1.8 1.8 1.8h11.6c1 0 1.8-.8 1.8-1.8v-3.2" />
  </>
);

export const IconDownload = svg(
  <>
    <path d="M12 4.4v11.2M7.4 11.2l4.6 4.6 4.6-4.6" />
    <path d="M4.4 15.6v3.2c0 1 .8 1.8 1.8 1.8h11.6c1 0 1.8-.8 1.8-1.8v-3.2" />
  </>
);
