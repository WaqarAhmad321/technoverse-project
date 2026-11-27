import Link from "next/link";
import type { Access } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { ROLE_LABELS } from "@/features/people/roles";

type WaitingRequest = { role_requested: string; institution_id: string };

// What a signed-in person with no institution sees: a waiting request, an invitation, or a way to ask.
export async function NoAccessNotice({ access }: { access: Access }) {
  const email = access.profile.email;
  const [requests, invitations]: [WaitingRequest[], { id: string }[]] = await Promise.all([
    db().from("join_requests").select("role_requested, institution_id").eq("member_id", access.user.id).eq("status", "pending").then(unwrap),
    db().from("invitations").select("id").eq("email", email).eq("status", "pending").then(unwrap),
  ]);

  if (requests.length > 0) {
    const institutions: { id: string; name: string }[] = unwrap(
      await db().from("institutions").select("id, name").in("id", requests.map((request) => request.institution_id)),
    );
    return (
      <p className="rounded-3xl bg-card p-6 text-base">
        Your request is waiting.{" "}
        {requests.map((request) => `${ROLE_LABELS[request.role_requested] ?? request.role_requested} at ${institutions.find((institution) => institution.id === request.institution_id)?.name ?? "an institution"}`).join(", ")}
        . An admin there has to approve it. Sign in again once they have.
      </p>
    );
  }
  if (invitations.length > 0) {
    return <p className="rounded-3xl bg-card p-6 text-base">You have an invitation for {email}. Sign out and sign in again to accept it.</p>;
  }
  return (
    <p className="rounded-3xl bg-card p-6 text-base">
      You are not part of an institution yet. If you are staff,{" "}
      <Link href="/join" className="underline underline-offset-4">
        request to join one
      </Link>
      . If you sit exams, your examiner adds {email} to the roster and the exams appear after you sign in again.
    </p>
  );
}
