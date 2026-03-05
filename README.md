# Casper Events — Community Calendar

A centralized event calendar platform for county and regional communities. Organizations register, post their events, and get an embeddable calendar widget for their own website — while all events are discoverable on one shared calendar.

**Live at [casperevents.org](https://casperevents.org)**

## Features

- **Central calendar** with month, week, and list views
- **Category filtering** — Indoor, Outdoor, Youth, Adult, Veteran, Pride, Arts, Sports, and more
- **Embeddable widget** — Organizations embed a themed calendar on their own sites
- **Theming** — Embed colors, fonts, and border radius match any website
- **Organization connections** — Orgs can opt-in to show each other's events
- **Admin approval** — Events appear on org embeds immediately, but require admin review for the main community calendar
- **Facebook integration** — Import events from Facebook Pages, post events back to Facebook
- **iCal feeds** — Subscribe to the calendar from Google Calendar, Apple Calendar, Outlook
- **iCal import** — Organizations with existing Google Calendars can sync automatically
- **Image uploads** — Event images via pre-signed S3 uploads
- **Mobile-ready architecture** — API-first design for future React Native apps

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (entire stack) |
| Backend | Fastify on AWS Lambda |
| Database | PostgreSQL (Aurora Serverless v2) |
| Frontend | React 19 + Vite + Tailwind CSS v4 |
| Embed Widget | React in Shadow DOM (standalone IIFE bundle) |
| Auth | AWS Cognito |
| Infrastructure | AWS CDK |
| CI/CD | GitHub Actions |

## Project Structure

```
packages/
  shared/     Shared types, DB schema (Drizzle ORM), Zod validation
  api/        Fastify API (Lambda handler + local dev server)
  web/        Main calendar site + admin dashboard (React SPA)
  embed/      Embeddable calendar widget (standalone JS)
  infra/      AWS CDK infrastructure stacks
docs/         Setup guide, API reference, embedding guide
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Build shared package first
pnpm --filter @cyh/shared build

# Start local database (requires Docker)
docker run -d --name cyh-postgres \
  -e POSTGRES_DB=cyhcalendar \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16

# Configure API
cp packages/api/.env.example packages/api/.env

# Run migrations and seed categories
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Start dev servers (in separate terminals)
pnpm dev:api     # API on port 3001
pnpm dev:web     # Web on port 5173
pnpm dev:embed   # Embed dev server
```

## Deploy to AWS

```bash
# First time: bootstrap CDK
cd packages/infra && npx cdk bootstrap

# Deploy all stacks
pnpm cdk:deploy
```

See [docs/SETUP.md](docs/SETUP.md) for the full deployment guide.

## Embedding

Organizations add this to their website:

```html
<div id="cyh-calendar"></div>
<script src="https://casperevents.org/embed.js"></script>
<script>
  CYHCalendar.init({
    container: '#cyh-calendar',
    orgId: 'YOUR_ORG_ID',
    theme: {
      primaryColor: '#2563eb',
      backgroundColor: '#ffffff',
      textColor: '#1f2937'
    }
  });
</script>
```

See [docs/EMBEDDING.md](docs/EMBEDDING.md) for full configuration options.

## Documentation

- [Setup Guide](docs/SETUP.md) — Local development and AWS deployment
- [API Reference](docs/API.md) — All REST endpoints
- [Embedding Guide](docs/EMBEDDING.md) — Widget configuration and theming

## Roadmap

- [x] Core calendar with filtering
- [x] Embeddable themed widget
- [x] Admin approval workflow
- [x] Facebook integration
- [x] iCal feed output and import
- [ ] Native mobile apps (React Native)
- [ ] Push notifications
- [ ] Event search with full-text indexing
- [ ] Email digests for new events

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
