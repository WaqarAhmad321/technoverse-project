import { Users } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { requireMember } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { enrollSection } from "./enrollment-actions";

// One button per class or section on the roster, with how many of them are not enrolled yet.
export async function SectionEnroll({ examId, enrolledIds }: { examId: string; enrolledIds: string[] }) {
  const member = await requireMember("examiner", "institution_admin");
  const candidates: { id: string; section: string }[] = unwrap(
    await db().from("candidates").select("id, section").eq("institution_id", member.institution.id).neq("section", ""),
  );
  const enrolled = new Set(enrolledIds);
  const sections = [...new Set(candidates.map((row) => row.section))].sort();
  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">Assign it to a class or section</p>
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => {
          const inSection = candidates.filter((row) => row.section === section);
          const missing = inSection.filter((row) => !enrolled.has(row.id)).length;
          return (
            <form key={section} action={enrollSection.bind(null, examId, section)}>
              <SubmitButton variant="outline" disabled={missing === 0}>
                <Users aria-hidden className="size-4" />
                {section} · {missing === 0 ? "all enrolled" : `add ${missing}`}
              </SubmitButton>
            </form>
          );
        })}
      </div>
    </div>
  );
}
