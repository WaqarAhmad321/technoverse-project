import { NameForm } from "@/features/account/name-form";
import { requireUser } from "@/lib/auth";
import { getDisplayName } from "@/lib/profile";

export default async function AccountPage() {
  const user = await requireUser();
  const userName = await getDisplayName(user);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
        <p className="text-base text-muted-foreground">Signed in as {user.email}</p>
      </div>
      <NameForm currentName={userName} />
    </div>
  );
}
