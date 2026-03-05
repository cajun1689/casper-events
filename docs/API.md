# API Reference

Base URL: `https://api.casperevents.org/v1`

## Authentication

Authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <cognito_jwt_token>
```

## Endpoints

### Events

#### `GET /events`

List events with optional filters.

Query parameters:
- `orgId` (uuid) - Filter by organization
- `categories` (string) - Comma-separated category slugs
- `status` (string) - Event status filter
- `startAfter` (ISO datetime) - Events starting after this time
- `startBefore` (ISO datetime) - Events starting before this time
- `search` (string) - Full-text search on title
- `page` (number, default: 1)
- `limit` (number, default: 25, max: 100)

Response: `PaginatedResponse<EventWithDetails>`

#### `GET /events/:id`

Get a single event with full details.

#### `POST /events` (Auth required)

Create a new event.

Body:
```json
{
  "title": "Community Potluck",
  "description": "Bring a dish to share!",
  "startAt": "2026-04-15T18:00:00Z",
  "endAt": "2026-04-15T21:00:00Z",
  "allDay": false,
  "venueName": "Community Center",
  "address": "123 Main St",
  "categoryIds": ["uuid1", "uuid2"],
  "cost": "Free",
  "ticketUrl": "https://example.com/tickets"
}
```

#### `PUT /events/:id` (Auth required)

Update an event. Same body as POST, all fields optional.

#### `DELETE /events/:id` (Auth required)

Delete an event.

#### `GET /events/feed.ics`

iCal feed of approved events. Subscribe in any calendar app.

Query parameters:
- `orgId` (uuid) - Filter by organization

### Organizations

#### `GET /organizations`

List all active organizations.

#### `GET /organizations/:slug`

Get organization by slug.

#### `POST /organizations` (Auth required)

Register a new organization.

#### `PUT /organizations/:id` (Auth required)

Update organization details.

#### `POST /organizations/:id/connections` (Auth required)

Request a connection with another organization.

#### `GET /organizations/:id/connections`

List connected organizations.

### Embed

#### `GET /embed/config/:orgId`

Get embed configuration for an organization (public).

#### `GET /embed/events/:orgId`

Get events for the embed widget (public).

Query parameters:
- `includeConnected` (boolean) - Include events from connected orgs
- `categories` (string) - Comma-separated category slugs

### Admin

#### `GET /admin/stats` (Admin required)

Dashboard statistics.

#### `GET /admin/events/pending` (Admin required)

List events pending admin approval.

#### `PUT /admin/events/:id/review` (Admin required)

Approve or reject an event.

Body:
```json
{
  "decision": "approved",
  "notes": "Looks good!"
}
```

#### `POST /admin/events/bulk-review` (Admin required)

Bulk approve/reject events.

#### `GET /admin/organizations` (Admin required)

List all organizations (including inactive).

#### `PUT /admin/organizations/:id/status` (Admin required)

Update organization status.

### Categories

#### `GET /categories`

List all categories (public).

#### `POST /admin/categories` (Admin required)

Create a new category.

#### `PUT /admin/categories/:id` (Admin required)

Update a category.

#### `DELETE /admin/categories/:id` (Admin required)

Delete a category.

### Auth

#### `POST /auth/register` (Auth required)

Register user record after Cognito signup.

#### `GET /auth/me` (Auth required)

Get current user profile and organization.

### Facebook

#### `GET /auth/facebook/connect` (Auth required)

Initiate Facebook OAuth flow. Returns a redirect URL.

#### `GET /auth/facebook/callback`

Facebook OAuth callback (handles token exchange).

#### `POST /events/:id/facebook/share` (Auth required)

Share an event to the organization's Facebook Page.

#### `GET /facebook/pages` (Auth required)

Check if a Facebook Page is connected.

#### `DELETE /facebook/disconnect` (Auth required)

Disconnect Facebook Page.

### Upload

#### `POST /upload/presign` (Auth required)

Get a presigned S3 URL for image upload.

Body:
```json
{
  "filename": "event-photo.jpg",
  "contentType": "image/jpeg"
}
```

Response:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "publicUrl": "/media/events/uuid.jpg"
}
```
