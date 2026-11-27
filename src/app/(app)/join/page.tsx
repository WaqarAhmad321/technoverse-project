import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { JoinForm } from "@/features/people/join-form";
import { getAccess } from "@/lib/access";
import { db, unwrap } from "@/lib/db";

export default async function JoinPage() {
  const access = await getAccess();
  if (access.current) redirect("/home");
  const institutions: { id: string; name: string }[] = unwrap(
    await db().from("institutions").select("id, name").eq("status", "active").order("name", { ascending: true }),
  );
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Request to join" description="Pick the institution and the role you need. Its admin approves or declines." back={{ href: "/home", label: "Home" }} />
      <JoinForm institutions={institutions} />
    </div>
  );
}
