import { requireUser } from "@/lib/auth";
import { getDisplayName } from "@/lib/profile";
import { site } from "@/lib/site";

export default async function HomePage() {
  const user = await requireUser();
  const userName = await getDisplayName(user);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome, {userName}</h1>
      <p className="text-base text-muted-foreground">{site.promise}</p>
    </div>
  );
}
