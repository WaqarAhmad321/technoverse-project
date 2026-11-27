# Stack: Next.js 16, Supabase, Vercel

One Next.js app (App Router, TypeScript, Tailwind, shadcn/ui) deployed on Vercel. Supabase holds the database and the accounts. The package manager is pnpm.

This Next.js is newer than most examples you remember. Its own docs are in `node_modules/next/dist/docs/`. Read the matching guide before using an API you are not sure of. Known differences: the request hook is `src/proxy.ts`, not `middleware.ts`; `cookies()`, `params` and `searchParams` are awaited; an error screen receives `retry`, not `reset`.

## Where a slice lives

A slice owns four places and builds only there:

- `src/app/(app)/<route>/`: its screens. A page stays thin: get the user, load the data, render.
- `src/features/<slice>/`: its components, `data.ts` (queries), `actions.ts` (server actions) and `sample-data.ts`.
- `db/migrations/`: its own SQL files, started with `scripts/db new`.
- `tests/smoke/<slice>.spec.ts`: its steps of the demo story.

Slices never import from each other's `features/` folder. Shared code is in `src/lib/` and `src/components/`.

Two lists get one line from every slice: `src/lib/nav.ts` (navigation) and `src/lib/sample-data.ts` (sample data). Put your line on a line of its own. Git keeps everyone's lines without a conflict.

## Data

- All data access happens on the server, through `db()` from `@/lib/db`. Never create a Supabase client in the browser. Never import `db` into a client component.
- `db()` skips the database's own access rules. So every query filters by the signed-in person: `.eq("user_id", user.id)`. An action that changes a row checks the owner again.
- Wrap every call in `unwrap(...)`. It throws when the request failed, and the error screen takes over.
- Name the row type where the data lands: `const orders: Order[] = unwrap(await db().from("orders").select("*").eq("user_id", user.id));`
- `src/lib/profile.ts` is the model for a data file.

## Tables

- `scripts/db new <short-name>` starts a SQL file. Write a plain `create table` in it. `scripts/db push` applies it. The check runs the push too.
- Every table has `user_id uuid not null references auth.users (id) on delete cascade`, unless it holds fixed reference data. That is what lets a test account or the demo account be wiped cleanly.
- Never edit a file that was already pushed. The edit is ignored. Add a new file.
- Add only. Do not rename or drop a column or a table today.
- Access rules and grants are set for you after each push. Do not write policies.
- Every laptop and the live site share one database. A push is live for everyone at once.

## Signing in

- Every page and every server action starts with `const user = await requireUser()`. The check in the layout does not protect an action.
- Validate what an action receives with Zod. Return a message for the form. Never throw at the person.
- `src/features/account/` is the model for a form with a server action: `useActionState`, `SubmitButton`, `FormMessage`.

## Screens

- Components come from `src/components/ui/` (shadcn). Add another with `pnpm dlx shadcn@latest add <name>`.
- The tokens are shadcn's, in `src/app/globals.css`. In the words of `ui-design.md`: page is `background`, surface is `card`, line is `border`, ink is `foreground`, ink-soft is `muted-foreground`, and the accent is `primary`. shadcn's own `accent` is only a hover tint.
- Main actions use `size="lg"`, which is 44px tall. Body text is `text-base`.
- The four states: a `loading.tsx` beside the page with a `Skeleton` in the shape of the content; `EmptyState` and `ErrorState` from `@/components/states`; `FormMessage` or a toast (`toast` from `sonner`) for done.
- The product name, its one-line promise and the demo person's name are in `src/lib/site.ts`.
- Fonts come from an installed package, never from `next/font/google`. The build must not need the network.

## Sample data and the demo account

- Each slice exports a seeder from its `sample-data.ts` and adds it to `src/lib/sample-data.ts`. It runs for every new account, so a new person and the demo account both start with a lively product.
- "Try the demo" signs in the shared demo account, and creates it on first use.
- `scripts/db reset-demo` removes the demo account and its data. The next click on "Try the demo" makes a fresh one.

## Common needs

- **Outside services:** one function per service, built with `liveOrRecorded` from `@/lib/demo`. With `DEMO_MODE=1` it returns the recorded answer. The check always runs with `DEMO_MODE=1`.
- **A new key or setting:** the value goes in `.env.local`, which is never committed, and in Vercel's Environment Variables. The name goes in `.env.example`. Read it with `process.env.NAME` where it is used, and make the feature say it is unavailable while the key is missing. Do not add it to `src/lib/env-rules.ts`: the app must still start on a laptop that does not have the key yet.
- **AI:** call the Claude API from a server action or a route handler with `@anthropic-ai/sdk`. The key is `ANTHROPIC_API_KEY`. Wrap the call in `liveOrRecorded`.
- **Live updates:** refresh on a timer with `router.refresh()` in a small client component. It needs no database rules.
- **File uploads:** make a signed upload URL on the server with `db().storage`, and send the file from the browser straight to that URL. A server action cannot carry more than a few megabytes.

## The smoke test

- Import `test` and `expect` from `./account`. A test that takes `account` starts signed in as a brand-new person with fresh sample data. That person is deleted when the test ends.
- Never write to the demo account in a test. Every laptop shares it.
- `scripts/check` is the whole check: install, database push, lint, build, smoke.

## Commands

- `pnpm dev`: the app on localhost. A second worktree takes the next free port by itself.
- `scripts/check`: everything `scripts/land` will run.
- `pnpm build && pnpm smoke`: only the build and the browser test.
- `pnpm-lock.yaml` conflicts, or the check says the lockfile is out of date: run `pnpm install` and commit `pnpm-lock.yaml`.

## Do not

- Turn on `cacheComponents` or add `"use cache"`. Every screen renders per request.
- Use `getSession()`. `getUser()` and `requireUser()` from `@/lib/auth` are the only way to know who is signed in.
- Put a secret in a variable whose name starts with `NEXT_PUBLIC_`.
