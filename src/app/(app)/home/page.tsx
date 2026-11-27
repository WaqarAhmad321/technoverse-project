import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { getAccess } from "@/lib/access";
import { navFor, type NavAudience } from "@/lib/nav";

const HOME = "/home";

export default async function HomePage() {
  const access = await getAccess();
  const firstName = access.profile.display_name;
  const audience: NavAudience[] = [...(access.current?.roles ?? []), ...(access.profile.is_super_admin ? (["super_admin"] as const) : [])];
  const shortcuts = navFor(audience).filter((item) => item.href !== HOME);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={`Welcome, ${firstName}`} description={access.current?.institution.name} />
      {access.suspended && (
        <p className="text-base">Your institution is suspended. Ask the platform admin to reactivate it.</p>
      )}
      {!access.current && !access.suspended && !access.profile.is_super_admin && (
        <p className="text-base">
          You are not on an institution&apos;s roster yet. Ask your examiner to add {access.profile.email}, then sign in
          again.
        </p>
      )}
      {shortcuts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {shortcuts.map((item, index) => (
            <Button key={item.href} asChild size="lg" variant={index === 0 ? "default" : "outline"}>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
