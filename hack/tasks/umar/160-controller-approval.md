---
status: todo
tier: extra
review: yes
---
# Controller approves results before they go out

## Goal
Results need a second person: the examiner requests publication and the controller of examinations approves it. Separation of duties from `hack/research/governance-roles-transparency.md`.

## What to build
- When the institution has a member with the `controller` role (delivery's task 180 adds the role), "Publish results" becomes "Request publication". The controller sees requests on `/marking/[examId]` and approves or returns them with a reason; approval publishes. `can(member, "results.approve", exam)` decides, and the requester can never approve their own request.
- Audit both steps.

## Done when
Make Sana a controller; as Kamran request publication of Quiz 1; as Sana approve: results publish; Kamran alone cannot.

## Owns
`src/features/authoring/`, `src/app/(app)/marking/`.

## Stand-ins
Until the controller role lands, skip the request step (current behaviour).
