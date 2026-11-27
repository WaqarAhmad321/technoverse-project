import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireMember } from "@/lib/access";
import { examPhase } from "@/lib/exam-rules";
import { getExam } from "@/features/authoring/exams/data";
import { PHASE_LABEL } from "@/features/authoring/format";

export default async function ManageExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const { examId } = await params;
  const exam = await getExam(member, examId);

  return (
    <div>
      <PageHeader title={exam.title} description={PHASE_LABEL[examPhase(exam)]}>
        <Button asChild size="lg" variant="outline">
          <Link href={`/marking/${exam.id}`}>Open marking</Link>
        </Button>
      </PageHeader>
    </div>
  );
}
