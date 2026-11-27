import "server-only";
import Link from "next/link";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { Exam, Question } from "@/lib/exam-types";
import { buildPaper, type PaperItem, type PaperRow } from "@/lib/paper";
import { firstLine } from "../questions/schema";

const SAMPLE_SEED = 1;
const SEEDS_TO_TRY = 60;

async function loadItems(member: Member, examId: string): Promise<PaperItem[]> {
  const links: { question_id: string; position: number }[] = unwrap(
    await db().from("exam_questions").select("question_id, position").eq("institution_id", member.institution.id).eq("exam_id", examId),
  );
  if (links.length === 0) return [];
  const questions: Question[] = unwrap(
    await db().from("questions").select("*").eq("institution_id", member.institution.id).in("id", links.map((link) => link.question_id)),
  );
  const byId = new Map(questions.map((question) => [question.id, question]));
  return links.flatMap((link) => {
    const question = byId.get(link.question_id);
    return question ? [{ position: link.position, question }] : [];
  });
}

function differences(a: PaperRow[], b: PaperRow[]): number {
  const formOf = new Map(b.map((row) => [row.question_id, row.variant_key]));
  return a.filter((row) => formOf.get(row.question_id) !== row.variant_key).length;
}

// Shows the sample pair that differs most, so the examiner sees what variants do to real papers.
function samplePair(exam: Exam, items: PaperItem[]): [PaperRow[], PaperRow[]] {
  const first = buildPaper(exam, items, SAMPLE_SEED);
  let best = buildPaper(exam, items, SAMPLE_SEED + 1);
  for (let seed = SAMPLE_SEED + 2; seed < SAMPLE_SEED + SEEDS_TO_TRY; seed += 1) {
    const candidate = buildPaper(exam, items, seed);
    if (differences(first, candidate) > differences(first, best)) best = candidate;
  }
  return [first, best];
}

function countForms(items: PaperItem[]): number {
  return items.reduce((total, { question }) => {
    const approved = (question.variants ?? []).filter((v) => v.status === "approved" && v.source_version === question.version).length;
    return total * (approved + 1);
  }, 1);
}

function PaperColumn({ title, rows, other }: { title: string; rows: PaperRow[]; other: PaperRow[] }) {
  const formOf = new Map(other.map((row) => [row.question_id, row.variant_key]));
  const byQuestion = [...rows].sort((a, b) => a.question_id.localeCompare(b.question_id));
  return (
    <section aria-label={title} className="flex flex-col gap-2 rounded-3xl bg-card p-4 md:p-6">
      <h3 className="text-xl font-medium">{title}</h3>
      <ol className="flex flex-col gap-2">
        {byQuestion.map((row) => {
          const isDifferent = formOf.get(row.question_id) !== row.variant_key;
          return (
            <li key={row.question_id} className={`flex flex-col gap-1 rounded-xl px-3 py-2 ${isDifferent ? "bg-primary/10" : "bg-muted"}`}>
              <span className="text-base">{firstLine(row.body)}</span>
              <span className="text-sm text-muted-foreground">
                {row.topic} · {row.marks} marks · {row.variant_key ? "AI variant" : "Original"}
                {isDifferent && " · different from the other paper"}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export async function PapersPanel({ member, exam }: { member: Member; exam: Exam }) {
  const items = await loadItems(member, exam.id);
  const forms = countForms(items);
  if (forms === 1) {
    return (
      <section className="flex flex-col gap-3 rounded-3xl bg-card p-4 md:p-6">
        <h2 className="text-xl font-medium">Everyone gets the same questions</h2>
        <p className="text-base text-muted-foreground">
          Open a question in the{" "}
          <Link href="/questions" className="text-foreground underline underline-offset-4">
            question bank
          </Link>{" "}
          and write variants for it. Approved variants are shared out between candidates, so one leaked paper fits nobody else.
        </p>
      </section>
    );
  }
  const [first, second] = samplePair(exam, items);
  const changed = differences(first, second);
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-3xl bg-card p-4 md:p-6">
        <h2 className="text-xl font-medium">{forms.toLocaleString("en-PK")} different papers are possible</h2>
        <p className="text-base text-muted-foreground">
          Two sample candidates differ on {changed} of {items.length} questions. The marks and the topics are the same; each AI variant
          was solved twice without its key before you approved it.
        </p>
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <PaperColumn title="Candidate A" rows={first} other={second} />
        <PaperColumn title="Candidate B" rows={second} other={first} />
      </div>
    </div>
  );
}
