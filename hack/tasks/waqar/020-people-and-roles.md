---
status: done
tier: must
review: yes
---
# Institution admin manages people and roles

## Goal
Sana, the institution admin, sees everyone in Ravi Science College with their roles and can make Bilal an examiner. Covers spec 3.1: admins manage accounts and role assignments, enforced on the server.

## What to build
- `/admin/people`: a table of the institution's members (name, email, roles as plain text, joined date), searchable by name or email. Only `institution_admin`.
- "Change roles" per person: add or remove `examiner`, `candidate`, `institution_admin` through a dialog with checkboxes and one "Save roles" button. Server action: `requireMember("institution_admin")`, Zod-validate, confirm the person is a member of this institution, write `memberships`, then `recordAudit(member, "role.changed", personId, { added, removed })`.
- Guards: an admin cannot remove their own `institution_admin` role (the institution would lose its last admin); the action refuses with "Make someone else an admin first."
- "Add person by email": creates a membership for an existing account; if no account exists, says "Ask them to sign up with this email first."

## Edge cases judges try
A candidate opening `/admin/people` gets "not found", not a blank page. Posting the action with another institution's person id changes nothing and returns "not found". Double-clicking "Save roles" leaves one row per role (the unique key).

## Done when
"Try as admin" → People → Bilal Ahmed → tick Examiner → "Save roles": the row shows "candidate, examiner" and a toast says "Roles saved". Sign in as the demo candidate and open `/admin/people`: the not-found screen. The smoke test covers story step 2.

## Owns
`src/features/people/`, `src/app/(app)/admin/`.

## Stand-ins
None.
