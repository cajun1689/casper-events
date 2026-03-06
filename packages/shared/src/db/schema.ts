import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  real,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const orgStatusEnum = pgEnum("org_status", [
  "pending",
  "active",
  "suspended",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "approved",
  "rejected",
  "cancelled",
]);

export const eventSourceEnum = pgEnum("event_source", [
  "manual",
  "facebook_import",
  "ical_import",
  "google_calendar_import",
]);

export const userRoleEnum = pgEnum("user_role", ["owner", "editor", "viewer"]);

export const connectionStatusEnum = pgEnum("connection_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const reviewDecisionEnum = pgEnum("review_decision", [
  "approved",
  "rejected",
]);

// ── Tables ──────────────────────────────────────────────────────────

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    website: varchar("website", { length: 500 }),
    logoUrl: varchar("logo_url", { length: 500 }),
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 255 }),
    address: text("address"),
    facebookPageId: varchar("facebook_page_id", { length: 255 }),
    facebookPageToken: text("facebook_page_token"),
    fbTokenExpiresAt: timestamp("fb_token_expires_at", { withTimezone: true }),
    icalFeedUrl: varchar("ical_feed_url", { length: 500 }),
    googleRefreshToken: text("google_refresh_token"),
    googleCalendarId: varchar("google_calendar_id", { length: 500 }),
    googleTokenExpiresAt: timestamp("google_token_expires_at", {
      withTimezone: true,
    }),
    status: orgStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("organizations_slug_idx").on(table.slug),
    index("organizations_status_idx").on(table.status),
  ]
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    allDay: boolean("all_day").default(false).notNull(),
    venueName: varchar("venue_name", { length: 255 }),
    address: text("address"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    imageUrl: varchar("image_url", { length: 500 }),
    ticketUrl: varchar("ticket_url", { length: 500 }),
    cost: varchar("cost", { length: 100 }),
    isOnline: boolean("is_online").default(false).notNull(),
    onlineEventUrl: varchar("online_event_url", { length: 500 }),
    status: eventStatusEnum("status").default("draft").notNull(),
    facebookEventId: varchar("facebook_event_id", { length: 255 }),
    publishToFacebook: boolean("publish_to_facebook").default(false).notNull(),
    googleCalendarEventId: varchar("google_calendar_event_id", { length: 500 }),
    source: eventSourceEnum("source").default("manual").notNull(),
    recurrenceRule: varchar("recurrence_rule", { length: 255 }),
    recurrenceParentId: uuid("recurrence_parent_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("events_org_id_idx").on(table.orgId),
    index("events_status_idx").on(table.status),
    index("events_start_at_idx").on(table.startAt),
    index("events_org_status_start_idx").on(
      table.orgId,
      table.status,
      table.startAt
    ),
  ]
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    icon: varchar("icon", { length: 50 }),
    color: varchar("color", { length: 7 }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)]
);

export const eventCategories = pgTable(
  "event_categories",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("event_categories_pk").on(table.eventId, table.categoryId),
  ]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    cognitoSub: varchar("cognito_sub", { length: 255 }),
    role: userRoleEnum("role").default("viewer").notNull(),
    isAdmin: boolean("is_admin").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_idx").on(table.email),
    uniqueIndex("users_cognito_sub_idx").on(table.cognitoSub),
  ]
);

export const orgConnections = pgTable(
  "org_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    connectedOrgId: uuid("connected_org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    status: connectionStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("org_connections_pair_idx").on(table.orgId, table.connectedOrgId),
  ]
);

export const embedConfigs = pgTable("embed_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 100 }).default("Default").notNull(),
  primaryColor: varchar("primary_color", { length: 7 }).default("#2563eb").notNull(),
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#64748b").notNull(),
  backgroundColor: varchar("background_color", { length: 7 }).default("#ffffff").notNull(),
  textColor: varchar("text_color", { length: 7 }).default("#1f2937").notNull(),
  accentColor: varchar("accent_color", { length: 7 }).default("#f59e0b").notNull(),
  fontFamily: varchar("font_family", { length: 100 }).default("inherit").notNull(),
  borderRadius: varchar("border_radius", { length: 10 }).default("8px").notNull(),
  defaultView: varchar("default_view", { length: 20 }).default("month").notNull(),
  categoryFilter: jsonb("category_filter").$type<string[]>().default([]),
  showConnectedOrgs: boolean("show_connected_orgs").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    usageCount: integer("usage_count").default(1).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("venues_name_idx").on(table.name),
    index("venues_usage_count_idx").on(table.usageCount),
  ]
);

export const adminReviews = pgTable(
  "admin_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    reviewedBy: uuid("reviewed_by")
      .notNull()
      .references(() => users.id),
    decision: reviewDecisionEnum("decision").notNull(),
    notes: text("notes"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("admin_reviews_event_idx").on(table.eventId)]
);

// ── Relations ───────────────────────────────────────────────────────

export const organizationsRelations = relations(organizations, ({ many }) => ({
  events: many(events),
  users: many(users),
  embedConfigs: many(embedConfigs),
  connections: many(orgConnections, { relationName: "orgConnections" }),
  connectedBy: many(orgConnections, { relationName: "connectedByOrgs" }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [events.orgId],
    references: [organizations.id],
  }),
  eventCategories: many(eventCategories),
  reviews: many(adminReviews),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  eventCategories: many(eventCategories),
}));

export const eventCategoriesRelations = relations(eventCategories, ({ one }) => ({
  event: one(events, {
    fields: [eventCategories.eventId],
    references: [events.id],
  }),
  category: one(categories, {
    fields: [eventCategories.categoryId],
    references: [categories.id],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
}));

export const orgConnectionsRelations = relations(orgConnections, ({ one }) => ({
  org: one(organizations, {
    fields: [orgConnections.orgId],
    references: [organizations.id],
    relationName: "orgConnections",
  }),
  connectedOrg: one(organizations, {
    fields: [orgConnections.connectedOrgId],
    references: [organizations.id],
    relationName: "connectedByOrgs",
  }),
}));

export const embedConfigsRelations = relations(embedConfigs, ({ one }) => ({
  organization: one(organizations, {
    fields: [embedConfigs.orgId],
    references: [organizations.id],
  }),
}));

export const adminReviewsRelations = relations(adminReviews, ({ one }) => ({
  event: one(events, {
    fields: [adminReviews.eventId],
    references: [events.id],
  }),
  reviewer: one(users, {
    fields: [adminReviews.reviewedBy],
    references: [users.id],
  }),
}));
