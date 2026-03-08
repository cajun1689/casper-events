export interface EventWithDetails {
  id: string;
  orgId: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  allDay: boolean;
  venueName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
  ticketUrl: string | null;
  cost: string | null;
  isOnline: boolean;
  onlineEventUrl: string | null;
  status: "draft" | "published" | "approved" | "rejected" | "cancelled";
  facebookEventId: string | null;
  source: "manual" | "facebook_import" | "ical_import" | "google_calendar_import";
  recurrenceRule: string | null;
  color: string | null;
  subtitle: string | null;
  externalUrl: string | null;
  externalUrlText: string | null;
  externalUrlCaption: string | null;
  featured: boolean;
  publishAt: string | null;
  createdAt: string;
  updatedAt: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  categories: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
  }[];
  orgCategories?: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
    parentCategoryId: string;
  }[];
  sponsors: {
    id: string;
    name: string;
    logoUrl: string | null;
    websiteUrl: string | null;
    level: "presenting" | "gold" | "silver" | "bronze" | "community";
  }[];
}

export interface EventSponsorPublic {
  id: string;
  eventId: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  level: "presenting" | "gold" | "silver" | "bronze" | "community";
  sortOrder: number;
}

export interface OrganizationPublic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
}

export interface CategoryPublic {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
}

export interface OrgCategoryPublic {
  id: string;
  orgId: string;
  parentCategoryId: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  parentCategory?: CategoryPublic;
}

export interface EmbedConfigPublic {
  id: string;
  orgId: string;
  label: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  borderRadius: string;
  defaultView: string;
  categoryFilter: string[];
  /** Per parent slug: "parent" | "subs" | "both" */
  categoryDisplayMode?: Record<string, "parent" | "subs" | "both">;
  showConnectedOrgs: boolean;
  ctaOpensExternal: boolean;
  borderColor?: string | null;
  headerBgColor?: string | null;
  linkColor?: string | null;
  backgroundGradient?: string | null;
  boxShadow: string;
  layoutDensity: string;
  firstDayOfWeek: string;
  timeFormat: string;
  maxEventsShown?: number | null;
  showEventImages: boolean;
  showVenue: boolean;
  showOrganizer: boolean;
  showCategories: boolean;
  showTicketLink: boolean;
  showCost: boolean;
  headerTitle: string;
  showHeader: boolean;
  showPoweredBy: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
}
