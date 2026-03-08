import { z } from "zod";

// ── Organization Schemas ────────────────────────────────────────────

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z
    .string()
    .min(2)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  website: z.string().url().max(500).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  address: z.string().max(500).optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

// ── Event Schemas ───────────────────────────────────────────────────

export const createEventSchema = z
  .object({
    title: z.string().min(2).max(500),
    description: z.string().max(5000).nullish(),
    startAt: z.string().min(1),
    endAt: z.string().nullish(),
    allDay: z.boolean().default(false),
    venueName: z.string().max(255).nullish(),
    address: z.string().max(500).nullish(),
    latitude: z.number().min(-90).max(90).nullish(),
    longitude: z.number().min(-180).max(180).nullish(),
    imageUrl: z.string().max(500).nullish(),
    ticketUrl: z.string().max(500).nullish(),
    cost: z.string().max(100).nullish(),
    isOnline: z.boolean().default(false),
    onlineEventUrl: z.string().max(500).nullish(),
    publishToFacebook: z.boolean().default(false),
    categoryIds: z.array(z.string().uuid()).default([]),
    recurrenceRule: z.string().max(255).nullish(),
    color: z.string().max(25).nullish(),
    subtitle: z.string().max(255).nullish(),
    externalUrl: z.string().max(500).nullish(),
    externalUrlText: z.string().max(100).nullish(),
    externalUrlCaption: z.string().max(255).nullish(),
    featured: z.boolean().default(false),
    publishAt: z.string().datetime().nullish(),
  })
  .refine(
    (data) => {
      if (data.endAt && data.startAt) {
        return new Date(data.endAt) > new Date(data.startAt);
      }
      return true;
    },
    { message: "End time must be after start time", path: ["endAt"] }
  );

export const updateEventSchema = createEventSchema.innerType().partial();

export const publicEventSubmissionSchema = z.object({
  title: z.string().min(2).max(500),
  description: z.string().max(5000).nullish(),
  startAt: z.string().min(1),
  endAt: z.string().nullish(),
  allDay: z.boolean().default(false),
  venueName: z.string().max(255).nullish(),
  address: z.string().max(500).nullish(),
  cost: z.string().max(100).nullish(),
  ticketUrl: z.string().url().max(500).nullish(),
  categoryIds: z.array(z.string().uuid()).default([]),
  submitterName: z.string().min(1).max(255),
  submitterEmail: z.string().email(),
}).refine(
  (data) => {
    if (data.endAt && data.startAt) {
      return new Date(data.endAt) > new Date(data.startAt);
    }
    return true;
  },
  { message: "End time must be after start time", path: ["endAt"] }
);

export const digestSubscribeSchema = z.object({
  email: z.string().email(),
  categories: z.array(z.string()).optional(),
});

export const rsvpEventSchema = z.object({
  email: z.string().email().max(255).optional(),
});

export const listEventsSchema = z.object({
  orgId: z.string().uuid().optional(),
  categories: z
    .string()
    .optional()
    .transform((v) => v?.split(",")),
  status: z.enum(["draft", "published", "approved", "rejected", "cancelled"]).optional(),
  startAfter: z.string().datetime().optional(),
  startBefore: z.string().datetime().optional(),
  featured: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

// ── Review Schemas ──────────────────────────────────────────────────

export const reviewEventSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().max(1000).optional(),
});

// ── Category Schemas ────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  sortOrder: z.number().int().default(0),
});

// ── Embed Config Schemas ────────────────────────────────────────────

export const createEmbedConfigSchema = z.object({
  label: z.string().min(1).max(100).default("Default"),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#2563eb"),
  secondaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#64748b"),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#ffffff"),
  textColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#1f2937"),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#f59e0b"),
  fontFamily: z.string().max(100).default("inherit"),
  borderRadius: z.string().max(10).default("8px"),
  defaultView: z.enum(["month", "week", "list", "poster"]).default("month"),
  categoryFilter: z.array(z.string()).default([]),
  showConnectedOrgs: z.boolean().default(true),
  ctaOpensExternal: z.boolean().default(false),
  borderColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  headerBgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  linkColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  boxShadow: z.enum(["none", "subtle", "medium"]).default("subtle"),
  layoutDensity: z.enum(["compact", "comfortable"]).default("comfortable"),
  firstDayOfWeek: z.enum(["sunday", "monday"]).default("sunday"),
  timeFormat: z.enum(["12h", "24h"]).default("12h"),
  maxEventsShown: z.number().int().min(1).max(500).nullable().optional(),
  showEventImages: z.boolean().default(true),
  showVenue: z.boolean().default(true),
  showOrganizer: z.boolean().default(true),
  showCategories: z.boolean().default(true),
  showTicketLink: z.boolean().default(true),
  showCost: z.boolean().default(true),
  headerTitle: z.string().max(100).default("Events"),
  showHeader: z.boolean().default(true),
  showPoweredBy: z.boolean().default(true),
});

export const updateEmbedConfigSchema = createEmbedConfigSchema.partial();

// ── Sponsor Schemas ──────────────────────────────────────────────────

export const createSponsorSchema = z.object({
  name: z.string().min(1).max(255),
  logoUrl: z.string().max(500).nullish(),
  websiteUrl: z.string().max(500).nullish(),
  level: z.enum(["presenting", "gold", "silver", "bronze", "community"]).default("community"),
  sortOrder: z.number().int().default(0),
});

export const updateSponsorSchema = createSponsorSchema.partial();

// ── Org Connection Schemas ──────────────────────────────────────────

export const createConnectionSchema = z.object({
  connectedOrgId: z.string().uuid(),
});

// ── Auth Schemas ────────────────────────────────────────────────────

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(255),
  organizationName: z.string().min(2).max(255),
  organizationSlug: z
    .string()
    .min(2)
    .max(255)
    .regex(/^[a-z0-9-]+$/),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ── Type Exports ────────────────────────────────────────────────────

export type CreateOrganization = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>;
export type CreateEvent = z.infer<typeof createEventSchema>;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsSchema>;
export type ReviewEvent = z.infer<typeof reviewEventSchema>;
export type CreateCategory = z.infer<typeof createCategorySchema>;
export type CreateEmbedConfig = z.infer<typeof createEmbedConfigSchema>;
export type UpdateEmbedConfig = z.infer<typeof updateEmbedConfigSchema>;
export type CreateConnection = z.infer<typeof createConnectionSchema>;
export type CreateSponsor = z.infer<typeof createSponsorSchema>;
export type UpdateSponsor = z.infer<typeof updateSponsorSchema>;
export type SignUp = z.infer<typeof signUpSchema>;
export type SignIn = z.infer<typeof signInSchema>;
