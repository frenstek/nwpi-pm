# NWPI Project Manager

Construction project management application for Nationwide Projects (NWPI). Full-featured PM tool with Supabase Auth, 20+ database tables, and a client portal.

## Tech Stack

- React 19 + Vite 8 + Tailwind CSS 4
- react-router-dom 7 (multi-page SPA)
- Supabase (PostgreSQL + Auth)
- Vercel serverless functions (portal API)

## Setup

```bash
git clone https://github.com/kraegeronimo-tech/nwpi-pm.git
cd nwpi-pm
npm install
cp .env.example .env  # Then fill in values
npm run dev
```

## Environment Variables

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

- Supabase project ID: `pzzdsphxwpywnqkuxutl`
- `VITE_` prefixed vars are exposed to the client
- `SUPABASE_SERVICE_KEY` is server-only (used by portal API functions)

## Deployment

```bash
npx vercel --prod --yes
```

**Vercel URL:** https://nwpi-pm.vercel.app

## Database

- 20+ tables with `pm_` prefix (shared Supabase instance with the nationwide marketing site)
- Migrations are in `src/db/*.sql` -- run these against Supabase SQL editor for schema setup
- Auth: Supabase Auth (email/password)

## Key Notes

- Tables use the `pm_` prefix to avoid conflicts with the nationwide marketing site tables.
- The portal API uses `SUPABASE_SERVICE_KEY` for elevated access.
- Always use Tailwind utility classes -- never raw CSS for spacing/styling.
