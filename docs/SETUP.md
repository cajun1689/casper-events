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
6. Set these environment variables on your Lambda:
   - `FACEBOOK_APP_ID`
   - `FACEBOOK_APP_SECRET`
   - `FACEBOOK_REDIRECT_URI`

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
| `CORS_ORIGIN` | Allowed CORS origin |
| `FACEBOOK_APP_ID` | Facebook app ID |
| `FACEBOOK_APP_SECRET` | Facebook app secret |
| `FACEBOOK_REDIRECT_URI` | Facebook OAuth callback URL |

### Web Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL (defaults to `/api` with proxy in dev) |
