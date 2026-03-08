export interface ContentToggles {
  showEventImages: boolean;
  showVenue: boolean;
  showOrganizer: boolean;
  showCategories: boolean;
  showTicketLink: boolean;
  showCost: boolean;
}

export interface LayoutOptions {
  layoutDensity: "compact" | "comfortable";
  firstDayOfWeek: "sunday" | "monday";
  timeFormat: "12h" | "24h";
  maxEventsShown: number | null;
}

export interface CYHCalendarConfig {
  container: string;
  orgId: string;
  apiUrl?: string;
  showConnectedOrgs?: boolean;
  /** When true, poster CTA opens external URL directly. Default: false (click goes to event detail) */
  ctaOpensExternal?: boolean;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: string;
    borderRadius?: string;
    borderColor?: string;
    headerBgColor?: string;
    linkColor?: string;
    backgroundGradient?: string;
    boxShadow?: "none" | "subtle" | "medium";
  };
  defaultView?: "month" | "week" | "list" | "poster";
  categories?: string[];
  hiddenCategories?: string[];
  /** Layout options */
  layoutDensity?: "compact" | "comfortable";
  firstDayOfWeek?: "sunday" | "monday";
  timeFormat?: "12h" | "24h";
  maxEventsShown?: number | null;
  /** Content toggles */
  showEventImages?: boolean;
  showVenue?: boolean;
  showOrganizer?: boolean;
  showCategories?: boolean;
  showTicketLink?: boolean;
  showCost?: boolean;
  /** Header & footer */
  headerTitle?: string;
  showHeader?: boolean;
  showPoweredBy?: boolean;
}

export interface EmbedEvent {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  venueName: string | null;
  address: string | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  cost: string | null;
  categories: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  }[];
  organization?: {
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
  color: string | null;
  subtitle: string | null;
  externalUrl: string | null;
  externalUrlText: string | null;
  externalUrlCaption: string | null;
  recurrenceRule: string | null;
  featured: boolean;
  sponsors: {
    name: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    level: string;
  }[];
}
