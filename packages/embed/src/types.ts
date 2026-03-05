export interface CYHCalendarConfig {
  container: string;
  orgId: string;
  apiUrl?: string;
  showConnectedOrgs?: boolean;
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    fontFamily?: string;
    borderRadius?: string;
  };
  defaultView?: "month" | "week" | "list";
  categories?: string[];
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
}
