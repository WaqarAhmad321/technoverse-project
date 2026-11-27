# Code: simple, small, readable in a hurry

A teammate's Claude will read your code at speed today. Write for that reader.

## Scope
- Build what the task says. No options, abstractions or settings "for later". There is no later today.
- Boring beats clever. Use what the stack and the installed packages already give you.
- Look for an existing helper or shared component before writing one. Share a helper once two slices need it, not before.
- Adding a package is fine when it saves real time. Note it in your log.

## Shape
- Small functions with one job. Guard clauses and early returns over nesting.
- Names are specific and carry units: `timeout_seconds`, `price_cents`, `uploaded_at`.
- No magic numbers or strings: name them.
- No dead code, no commented-out code, no unused imports. Git has the history.
- Comments only for a non-obvious why. Never narrate what the code does.

## Errors
- Catch only what you can handle. Never swallow an error silently.
- The user sees plain words and a next step. Stack traces and raw messages go to the log only.
- Validate where data enters: forms, request bodies, outside APIs. Trust your own code inside.

## Config and secrets
- Configuration comes from environment variables. Every variable is listed in `.env.example` by name.
- Never write a key, token or password into code, tests, docs or commands.
- An outside service that is not configured reports itself as unavailable. It does not crash the app.

## Demo mode
- Recorded answers and sample data for the demo sit behind one switch (an environment variable), in one place per service. Never scatter `if demo` checks through the code.
