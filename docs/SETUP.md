# Setup Guide

This guide walks you through deploying the CYH Community Calendar from scratch.

## Prerequisites

- **Node.js** 20+
- **pnpm** 10+ (`npm install -g pnpm`)
- **AWS CLI** configured with credentials (`aws configure`)
- **AWS CDK CLI** (`npm install -g aws-cdk`)
- **PostgreSQL** (for local development, or use the deployed Aurora instance)

## Local Development

### 1. Install dependencies

```bash
pnpm install
```

### 2. Build the shared package

```bash
pnpm --filter @cyh/shared build
```

### 3. Set up the database

Start a local PostgreSQL instance (Docker recommended):

```bash
docker run -d --name cyh-postgres \
  -e POSTGRES_DB=cyhcalendar \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16
```

Create your API `.env` file:

```bash
cp packages/api/.env.example packages/api/.env
```

Edit `packages/api/.env` with your local database URL:

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/cyhcalendar
```

### 4. Run database migrations

```bash
pnpm db:generate   # Generate migration SQL from schema
pnpm db:migrate    # Apply migrations
pnpm db:seed       # Seed default categories
```

### 5. Start development servers

In separate terminals:

```bash
# API server (port 3001)
pnpm dev:api

# Web frontend (port 5173)
pnpm dev:web

# Embed widget dev server
pnpm dev:embed
```

The web app proxies API requests to `localhost:3001` automatically.

## AWS Deployment

### 1. Bootstrap CDK

First-time only per AWS account/region:

```bash
cd packages/infra
npx cdk bootstrap
```

### 2. Deploy all stacks

```bash
pnpm cdk:deploy
```

This creates:
- VPC with public, private, and isolated subnets
- Aurora Serverless v2 PostgreSQL cluster
- Cognito user pool
- S3 buckets for static assets and media
- CloudFront distribution
- API Gateway + Lambda functions
- EventBridge scheduled rules

### 3. Run migrations on deployed database

Connect to the database using the credentials in AWS Secrets Manager, then run:

```bash
DATABASE_URL="postgres://..." pnpm db:migrate
DATABASE_URL="postgres://..." pnpm db:seed
```

### 4. Deploy frontend

```bash
pnpm --filter @cyh/web build
aws s3 sync packages/web/dist s3://casperevents-static-285633211360 --delete

pnpm --filter @cyh/embed build
aws s3 cp packages/embed/dist/embed.js s3://casperevents-static-285633211360/embed.js

# Invalidate CloudFront cache
DIST_ID=$(aws cloudformation describe-stacks --stack-name CyhStorage \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)
aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
```

### 5. Set up your admin user

1. Sign up through the web interface
2. Connect to the database and set `is_admin = true` on your user record:
   ```sql
   UPDATE users SET is_admin = true WHERE email = 'your@email.com';
   ```

## Facebook Integration Setup

1. Go to [developers.facebook.com](https://developers.facebook.com) and create a new app
2. Set the app type to "Business"
3. Add the Facebook Login product
4. Configure the OAuth redirect URI to your API's callback URL
5. Submit for App Review with these permissions:
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
6. Set these environment variables on your Lambda (or in `.env` for local dev):
   - `FACEBOOK_APP_ID`
   - `FACEBOOK_APP_SECRET`
   - `FACEBOOK_REDIRECT_URI`

## Google Calendar Integration Setup

Allows organizations to connect a Google Calendar and automatically import events (including image attachments).

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project (or use an existing one)
2. Enable the **Google Calendar API** and **Google Drive API** under APIs & Services
3. Configure the **OAuth consent screen**:
   - Add scopes: `calendar.readonly`, `drive.readonly`
   - Set publishing status to **Production** (or add test users while in Testing mode)
4. Create **OAuth 2.0 credentials** (Web application type):
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://api.yourdomain.com/v1/auth/google/callback`
5. Set these environment variables on your Lambda (or in `.env` for local dev):
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
6. For CI/CD, add these as GitHub Secrets: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

Once configured, users connect their Google Calendar from **Dashboard > Google Calendar** in the web app. A scheduled Lambda syncs events every hour automatically.

### Google OAuth troubleshooting (production)

The CDK injects Google credentials from SSM at deploy time. Verify:

```bash
# Check SSM parameters exist (us-east-1)
aws ssm get-parameter --name /cyh/google-client-id --query Parameter.Value --output text
aws ssm get-parameter --name /cyh/google-client-secret --query Parameter.Value --output text
```

The Lambda receives `GOOGLE_REDIRECT_URI` from CDK (not SSM): `https://api.casperevents.org/v1/auth/google/callback`. This must match exactly in Google Cloud Console → Credentials → OAuth client → Authorized redirect URIs.

If you see "Unauthorized" or token exchange errors, check CloudWatch logs for the API Lambda; the callback now logs the exact Google error.

## Environment Variables Reference

### API (Lambda / local)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (local only) |
| `DB_SECRET_ARN` | AWS Secrets Manager ARN (production) |
| `DB_HOST` | Database host (production) |
| `DB_NAME` | Database name |
| `COGNITO_USER_POOL_ID` | Cognito user pool ID |
| `AWS_REGION` | AWS region |
| `MEDIA_BUCKET` | S3 bucket for media uploads |
| `CDN_DOMAIN` | CloudFront/CDN domain for media URLs |
| `CORS_ORIGIN` | Allowed CORS origin |
| `FACEBOOK_APP_ID` | Facebook app ID |
| `FACEBOOK_APP_SECRET` | Facebook app secret |
| `FACEBOOK_REDIRECT_URI` | Facebook OAuth callback URL |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL |

### Web Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL (defaults to `/api` with proxy in dev) |
