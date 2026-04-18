# Attendency

Attendency is a shared attendance planning app for team availability, reporting, feedback, and admin-controlled scheduling settings.

## Features

- authenticated sign-in with role-aware access
- calendar-based attendance entry for two waves per day
- reports for saved attendance and calendar info
- rolling attendance change feed for upcoming planning work
- team management and profile controls
- feedback feed with moderation actions

## Tech Stack

- React
- TypeScript
- Vite
- Hono
- Cloudflare Workers
- Cloudflare D1
- Tailwind CSS

## Development

Install dependencies:

```bash
npm install
```

Start the app locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Database

Local reset commands:

```bash
npm run db:reset:local
npm run db:reset:local:clean
```

Remote reset commands also exist, but they should only be used intentionally. Forward-only migration files in the db folder are the safer path for release updates.

## Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

Dry-run the release bundle first if needed:

```bash
npm run check
```

## Notes

- local and remote D1 environments are both supported
- the app is optimized around the current team attendance workflow
- Admin Controls govern shared project-wide behavior
