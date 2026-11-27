import { EmptyState } from "@/components/states";
import { PageHeader } from "@/components/page-header";
import { AddPersonForm } from "@/features/people/add-person-form";
import { loadJoinRequests, loadPeople, loadPendingInvitations } from "@/features/people/data";
import { InviteForm, JoinRequests, PendingInvitations } from "@/features/people/invite-panels";
import { PeopleTable } from "@/features/people/people-table";
import { requireMember } from "@/lib/access";
import { formatDate } from "@/lib/format";

export default async function PeoplePage() {
  const member = await requireMember("institution_admin");
  const [people, invitations, requests] = await Promise.all([loadPeople(member), loadPendingInvitations(member), loadJoinRequests(member)]);
  const rows = people.map(({ profile, roles, joinedAt }) => ({
    id: profile.id,
    name: profile.display_name,
    email: profile.email,
    roles,
    joined: joinedAt ? formatDate(joinedAt) : "",
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="People" description={`Everyone at ${member.institution.name} and what they can do. Every change is recorded in the audit log.`} />
      <JoinRequests requests={requests} />
      {rows.length === 0 ? (
        <EmptyState message="Nobody has joined yet. People appear here once they sign up and are added." />
      ) : (
        <PeopleTable people={rows} selfId={member.user.id} />
      )}
      <InviteForm />
      <PendingInvitations invitations={invitations} />
      <AddPersonForm />
    </div>
  );
}
