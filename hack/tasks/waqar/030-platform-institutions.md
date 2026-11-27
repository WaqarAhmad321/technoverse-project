---
status: todo
tier: must
review: yes
---
# Super admin creates institutions

## Goal
The platform admin sees every institution, creates a new one and names its first institution admin. This is the level above the spec's administrator, so many colleges and boards can run on one platform.

## What to build
- `/platform`: institutions with name, kind, city, status, member count, exam count. `requireSuperAdmin()`.
- "Add institution": name, kind (university, college, board, test body), city, first admin's email (must be an existing account). Creates the institution and an `institution_admin` membership; audit `institution.created`.
- "Suspend" / "Reactivate": `status`. `requireMember` treats a suspended institution as no membership, so its people see "Your institution is suspended" on `/home`.
- The super admin cannot see exam content from here: counts only. (Research: `governance-roles-transparency.md` §3.2.)

## Done when
Click "Platform admin" on the landing page → Institutions lists Ravi Science College → "Add institution" with "Punjab Group of Colleges, Gujranwala", college, Gujranwala, Sana's email → it appears with 1 member; Sana now has two memberships. Suspend it and reactivate it.

## Owns
`src/features/people/`, `src/app/(app)/platform/`.

## Stand-ins
None.
