# Ardean CMS

Ardean CMS is a full-stack Next.js content and commerce platform designed around a YouTube-inspired experience. It combines a content publishing workflow, a creator studio, community interactions, resource delivery, and digital product ordering in one codebase.

The project is built with the App Router, TypeScript, Drizzle ORM, Better Auth, Redis, and a PostgreSQL database. It is designed for a modern creator-centric publishing model where members can publish, moderate, monetize, and manage content from a studio dashboard.

## Project Goals

- Provide a YouTube-style shell and content experience for a creator platform
- Support publishing workflows with moderation and approval
- Enable community features such as comments, likes, follows, notifications, and feed subscriptions
- Support downloadable resource files with access control and entitlement checks
- Support digital product sales with Midtrans integration
- Offer a studio dashboard for content, moderation, analytics, and settings management

## High-Level Architecture

The application is organized into a few major layers:

- App Router frontend: routes under `app/`
- Shared UI and reusable components: `components/`
- Business logic and server-side data access: `lib/`
- Database schema and migrations: `db/`
- Static assets and uploads: `public/`, `storage/`

The codebase uses a hybrid model:

- Next.js App Router for routing and rendering
- Drizzle for database access and schema management
- Better Auth for authentication and session management
- Redis for caching, rate limiting, and view-related operations
- Local disk storage for development, with cloud-style object storage in mind for production

## Tech Stack

### Core

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

### Data and auth

- PostgreSQL
- Drizzle ORM
- Drizzle Kit
- Better Auth
- Redis via `ioredis`

### Content and editing

- Tiptap
- Shiki
- Mermaid
- KaTeX

### Commerce and integrations

- Midtrans Snap
- Postgres and Redis-backed business logic

### Tooling

- Bun
- Prettier
- oxlint
- TypeScript compiler

## Key Features

### Content platform

- Content publishing with review and approval lifecycle
- Custom content types and structured post data
- Rich text editing using Tiptap
- Code blocks and syntax-highlighted rendering
- SEO and OG-ready page structure

### Community features

- Threaded comments
- Likes
- Follow/subscribe behavior
- Notification system for content and moderation events
- Subscription-based feed experience

### Studio dashboard

- Studio shell inspired by YouTube Studio
- Content management screens
- Language management and translation editing
- Moderation and user management views
- Analytics presentation for content performance

### Resources and digital delivery

- Uploadable resource files
- Versioned resource metadata
- File hashing and integrity checks
- Access-controlled download routes
- Entitlement-based delivery for paid files

### Commerce

- Digital product support
- Order flow with Midtrans snapshot checkout
- Entitlement grant on successful payment
- Checkout-related UI and payment state handling

## Main Route Structure

The route tree is organized around app-shell and studio shells:

- `app/(shell)/` for the main public experience
- `app/(studio)/studio/` for creator and admin dashboards
- `app/(auth)/` for authentication flows
- `app/api/` for backend endpoints, uploads, download, and webhooks

Representative public routes include:

- `/` home feed
- `/watch` content viewing page
- `/@handle` public creator profile page
- `/feed/subscriptions` follow feed
- `/results` search results
- `/store` product storefront
- `/c/[category]` category browse pages

## Project Structure

```text
app/
  (auth)/
  (shell)/
  (studio)/
  api/
components/
  auth/
  cards/
  content/
  detail/
  playlist/
  post/
  studio/
  ui/
lib/
  analytics.ts
  auth.ts
  community.ts
  content.ts
  db.ts
  notifications.ts
  products.ts
  resources.ts
  search-history.ts
  settings.ts
  storage.ts
  threads.ts
  translate.ts
  validation logic and helpers...
db/
  schema.ts
  migrations and maintenance scripts...
public/
storage/
```

## Directory Notes

### `app/`

Contains Next.js App Router pages and route handlers.

### `components/`

Houses reusable UI, feature-specific components, and shell structures.

### `lib/`

Contains server-side helpers, business logic, data access wrappers, and integrations.

### `db/`

Holds Drizzle schema, migration utilities, and repo maintenance scripts used to validate and migrate the database.

### `public/`

Static public assets and runtime-generated assets intended for browser access.

### `storage/`

Local storage for resources and related non-public content data.

## Environment Setup

Use the existing [ .env.example ] file as the starting point.

A typical environment file contains:

```env
DATABASE_URL="postgresql://postgres@127.0.0.1:5432/ardean"
DIRECT_URL="postgresql://postgres@127.0.0.1:5432/ardean"
BETTER_AUTH_SECRET="change-me"
BETTER_AUTH_URL="http://localhost:3000"
REDIS_URL="redis://127.0.0.1:6379"
MIDTRANS_SERVER_KEY=""
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION="false"
```

### Important environment notes

- Database credentials should be configured for your PostgreSQL instance.
- Redis should be available locally or via a managed environment.
- Midtrans keys are required for payment-related flows.
- Secrets must never be committed into source control.

## Development Workflow

This project uses Bun as the package manager and task runner.

### Install dependencies

```sh
bun install
```

### Start the development server

```sh
bun run dev
```

### Build for production

```sh
bun run build
```

### Start the production server

```sh
bun run start
```

### Lint and format

```sh
bun run lint
bun run format
bun run format:check
```

### Database commands

```sh
bun run db:push
bun run db:generate
bun run db:migrate
bun run db:studio
bun run db:seed
```

## Database and ORM

The project uses Drizzle as the primary ORM and migration tool.

Relevant database configuration is handled through:

- `drizzle.config.ts`
- `db/schema.ts`
- `db/` migration and validation scripts

The schema covers:

- authentication tables
- user and profile data
- posts and categories
- comments and interactions
- resources and file metadata
- orders, payments, and entitlements
- notifications and settings

## Domain Model Summary

The application revolves around a creator-first content model. Core entities include:

- `User`
- `Session`
- `Account`
- `Verification`
- `Post`
- `Category`
- `Comment`
- `Like`
- `Follow`
- `Notification`
- `ResourceFile`
- `Order`
- `Payment`
- `Entitlement`
- `SiteSetting`

The content model supports multiple content-facing concepts using a shared post system and role-aware moderation.

## Security Model

The platform uses a layered security approach:

- Protected endpoints and role-based studio access
- Payment webhook verification
- Access controls for downloadable resources
- Entitlement checks before allowing paid file delivery
- Avoidance of committing sensitive values to the repository

Files for paid or restricted delivery are not served from the public web root. They are routed through application-controlled download endpoints.

## Current Status Notes

This repository is an active, feature-rich Next.js codebase with a broad set of capabilities already wired in. The blueprint documentation in the `docs/` folder captures the implementation history, major decisions, feature phases, and backlog direction.

The project is designed with a staged rollout mindset, where foundational platform capabilities are implemented first and feature expansion continues in later phases.

## Recommended Development Notes

- Prefer Bun for all package and script execution
- Keep environment variables in a local `.env` file
- Run formatting before committing changes
- Use the existing database migration flow whenever the schema changes
- Review the docs in `docs/BLUEPRINT.md` for project history and architecture decisions

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for the full text.
