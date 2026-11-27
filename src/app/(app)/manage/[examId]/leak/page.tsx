import { ScanSearch } from "lucide-react";
import { FeatureSpotlight } from "@/components/feature-spotlight";
import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { getExam } from "@/features/authoring/exams/data";
import { traceLeak } from "@/features/authoring/leak/actions";
import { LeakForm } from "@/features/authoring/leak/leak-form";

export default async function LeakPage({ params }: { params: Promise<{ examId: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const { examId } = await params;
  const exam = await getExam(member, examId);
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        title={`Trace a leak: ${exam.title}`}
        description="Paste the text of a leaked paper from WhatsApp, a photo or a PDF."
      />
      <FeatureSpotlight
        icon={ScanSearch}
        title="Every paper carries a fingerprint"
        problem="When a paper leaks, boards cancel the exam for everyone and still cannot say where it came from."
        answer="Each candidate gets the questions in their own order. A leaked copy keeps that order, so Imtihaan names the paper it was taken from in seconds."
      />
      <section className="rounded-3xl bg-card p-4 md:p-6">
        <LeakForm action={traceLeak.bind(null, exam.id)} />
      </section>
    </div>
  );
}
