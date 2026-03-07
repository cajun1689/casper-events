export interface CYHCalendarConfig {
  container: string;
  orgId: string;
  apiUrl?: string;
  showConnectedOrgs?: boolean;
  /** When true, poster CTA opens external URL directly. Default: false (click goes to event detail) */
  ctaOpensExternal?: boolean;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: string;
    borderRadius?: string;
  };
  defaultView?: "month" | "week" | "list" | "poster";
  categories?: string[];
  hiddenCategories?: string[];
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
