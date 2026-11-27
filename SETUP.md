# Setup: Supabase and Vercel

One person does parts 1 and 2 once. It takes about ten minutes. Everyone else only does part 3.

## Once per laptop

    pnpm install
    pnpm exec playwright install chromium

## 1. Supabase

1. Create a project at supabase.com on the free plan. Pick the region nearest to you. Keep the Data API switched on with its default settings.
2. Open the SQL editor, paste all of `db/bootstrap.sql` and run it.
3. Authentication > Rate Limits: raise the limit for sign-ups and sign-ins to 300. Every sign-in comes from the server, so the default of 30 per five minutes is shared by all visitors.
4. Copy `.env.example` to `.env.local` and fill it in:
   - The project URL and the keys are under Project Settings > API Keys. Use the publishable key and a secret key. The older anon and service_role keys work too.
   - `DEMO_EMAIL`: an address on a real-looking domain, such as `demo@<your-product>.app`. No email is ever sent to it.
   - `DEMO_PASSWORD`: 8 or more letters and digits. A `#`, `$`, quote or space can be cut off by the file's format.
5. Run `scripts/check`. It creates the tables, builds the app and runs the browser test. It must end with `check: passed`.

## 2. Vercel

1. vercel.com > Add New > Project, and import the GitHub repo. Keep the repo public: the free plan does not support a team on a private repo.
2. Add every variable from `.env.local` under Environment Variables. Leave `DEMO_MODE` empty.
3. Deploy. From now on every push to main deploys by itself.
4. Open the live URL and click "Try the demo". Write the URL into the Live URL line of `CLAUDE.md`.
5. After a teammate's first landing, check the deployment list. Their commit must have deployed too.

## 3. Each teammate

1. Get `.env.local` from the person who did part 1, over a private channel. Never commit it and never paste it into a public chat.
2. Put it in the project folder and run the two commands under "Once per laptop".
3. Run `scripts/check`. It must end with `check: passed`.

## A new key later in the day

Whoever adds it does all of it, without waiting for anyone: the value into their own `.env.local`, into the team's private note, and into Vercel's Environment Variables; the name into `.env.example`. For that, everyone needs the Vercel login. The app keeps running on the other laptops meanwhile, because a feature with a missing key reports itself as unavailable.

## If something is off

- **"the database is not prepared":** part 1, step 2 was skipped.
- **The app says "This app is not connected yet", or the check says "the app is not connected":** a value in `.env.local` is missing or not valid. The message says which one and why.
- **A teammate's push did not deploy:** open the deployment in Vercel. If it says the author has no access, make the repo public, or move the Vercel account to the Pro trial.
- **A changed variable in Vercel has no effect:** it applies from the next deploy. Redeploy.
- **Sign-ins fail for everyone at once:** the sign-in limit was reached. Raise it as in part 1, step 3.
- **Every page is slow:** look at Project Settings > JWT Keys in Supabase. A project still on the legacy JWT secret asks Supabase about the session on every page view. One on the newer signing keys checks it locally.
- **The browser test cannot start a browser:** run `pnpm exec playwright install chromium`.
