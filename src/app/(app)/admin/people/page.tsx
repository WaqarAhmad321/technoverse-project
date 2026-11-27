import { EmptyState } from "@/components/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/features/delivery/page-header";
import { loadPeople } from "@/features/people/data";
import { ROLE_LABELS } from "@/features/people/roles";
import { requireMember } from "@/lib/access";
import { formatDate } from "@/lib/format";

export default async function PeoplePage() {
  const member = await requireMember("institution_admin");
  const people = await loadPeople(member);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="People" description={`Everyone at ${member.institution.name} and what they can do.`} />
      {people.length === 0 ? (
        <EmptyState message="Nobody has joined yet. People appear here once they sign up and are added." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map(({ profile, roles, joinedAt }) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.display_name}</TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>{roles.map((role) => ROLE_LABELS[role] ?? role).join(", ")}</TableCell>
                <TableCell>{joinedAt ? formatDate(joinedAt) : ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
