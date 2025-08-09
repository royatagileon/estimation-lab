## Estimation Lab

Collaborative estimation with real-time sessions, profiles, hidden votes, reasons, objections, revotes, and suggestions from history.

### Tech
- Next.js (App Router, TypeScript), Tailwind
- Prisma + PostgreSQL (Neon or Supabase)
- Auth.js (Email magic link + Google)
- tRPC for typed API
- WebSocket (Edge handler) for realtime fan-out per session
- Vitest + Playwright

### Local setup
1. Copy `.env.example` to `.env.local` and fill in values.
2. Install bun and deps: `curl -fsSL https://bun.sh/install | bash` then `bun install`.
3. Prisma: `bunx prisma migrate dev --name init` then `bunx prisma generate`.
4. Dev: `bun dev`.
5. Tests: unit `bun test` and e2e `bunx playwright test`.

### Deploy
- Vercel + Neon/Supabase. Set env vars in the dashboard. Run seed command on first deploy.

### MVP features
- Auth & profiles
- Create/join sessions (share link + 6-digit code)
- Add work item, run one round with hidden votes and reveal
- Finalize decision, export CSV
- Similar items & suggestion (local embeddings)
- Audit events scaffold

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
