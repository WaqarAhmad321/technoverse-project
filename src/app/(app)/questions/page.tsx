import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireMember } from "@/lib/access";
import type { Difficulty, QuestionKind } from "@/lib/exam-types";
import { BankFiltersForm, BankList } from "@/features/authoring/questions/bank-list";
import { listQuestions, listTopics, type BankFilters } from "@/features/authoring/questions/data";
import { DIFFICULTIES, KINDS } from "@/features/authoring/questions/schema";
import { plural } from "@/features/authoring/format";

type Search = { topic?: string; difficulty?: string; kind?: string; q?: string; added?: string };

function parseFilters(search: Search): BankFilters {
  return {
    topic: search.topic || undefined,
    difficulty: DIFFICULTIES.includes(search.difficulty as Difficulty) ? (search.difficulty as Difficulty) : undefined,
    kind: KINDS.includes(search.kind as QuestionKind) ? (search.kind as QuestionKind) : undefined,
    q: search.q?.trim() || undefined,
  };
}

export default async function QuestionBankPage({ searchParams }: { searchParams: Promise<Search> }) {
  const member = await requireMember("examiner", "institution_admin");
  const search = await searchParams;
  const filters = parseFilters(search);
  const [rows, topics] = await Promise.all([listQuestions(member, filters), listTopics(member)]);
  const isFiltered = Object.values(filters).some(Boolean);

  return (
    <div>
      <PageHeader title="Question bank" description={`${plural(rows.length, "question")} you can reuse in any exam.`}>
        <Button asChild size="lg">
          <Link href="/questions/new">Add question</Link>
        </Button>
      </PageHeader>
      <BankFiltersForm filters={filters} topics={topics} />
      <BankList rows={rows} highlightId={search.added} isFiltered={isFiltered} />
    </div>
  );
}
