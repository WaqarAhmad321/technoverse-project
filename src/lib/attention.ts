import "server-only";
import { myCandidateIds, type Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { examPhase } from "@/lib/exam-rules";
import type { Exam } from "@/lib/exam-types";

export type AttentionItem = { id: string; href: string; title: string; detail: string; tone: "live" | "warn" | "ready" };

const RECENT_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// The examiner's to-do list, from real data: what is waiting on them and where to act on it.
export async function examinerAttention(member: Member): Promise<AttentionItem[]> {
  const institutionId = member.institution.id;
  const [exams, disputes, returned]: [Exam[], { id: string }[], { exam_id: string; kind: string; comment: string | null }[]] = await Promise.all([
    db().from("exams").select("*").eq("institution_id", institutionId).then(unwrap),
    db().from("disputes").select("id").eq("institution_id", institutionId).eq("status", "open").then(unwrap),
    db().from("approvals").select("exam_id, kind, comment").eq("institution_id", institutionId).eq("status", "returned").eq("requested_by", member.user.id).then(unwrap),
  ]);
  const now = new Date();
  const items: AttentionItem[] = [];

  const toRelease = exams.filter((exam) => examPhase(exam, now) === "closed" && !exam.results_published_at);
  if (toRelease.length > 0) {
    const examIds = toRelease.map((exam) => exam.id);
    const attempts: { id: string; exam_id: string }[] = unwrap(
      await db().from("attempts").select("id, exam_id").in("exam_id", examIds).eq("is_sandbox", false).neq("status", "in_progress"),
    );
    const attemptIds = attempts.map((row) => row.id);
    const [written, graded]: [{ attempt_id: string; question_id: string }[], { attempt_id: string; question_id: string }[]] =
      attemptIds.length === 0
        ? [[], []]
        : await Promise.all([
            db().from("attempt_questions").select("attempt_id, question_id").in("attempt_id", attemptIds).eq("kind", "written").then(unwrap),
            db().from("grades").select("attempt_id, question_id").in("attempt_id", attemptIds).eq("source", "manual").then(unwrap),
          ]);
    const gradedKeys = new Set(graded.map((row) => `${row.attempt_id}:${row.question_id}`));
    for (const exam of toRelease) {
      const examAttempts = new Set(attempts.filter((row) => row.exam_id === exam.id).map((row) => row.id));
      const unmarked = written.filter((row) => examAttempts.has(row.attempt_id) && !gradedKeys.has(`${row.attempt_id}:${row.question_id}`)).length;
      items.push({
        id: `mark-${exam.id}`,
        href: `/marking/${exam.id}`,
        title: `Mark and release ${exam.title}`,
        detail: `${plural(examAttempts.size, "submission")} · ${unmarked > 0 ? `${plural(unmarked, "written answer")} to mark · ` : ""}check the answer keys, then publish results`,
        tone: "live",
      });
    }
  }

  for (const row of returned) {
    const exam = exams.find((candidate) => candidate.id === row.exam_id);
    if (!exam) continue;
    items.push({
      id: `returned-${row.exam_id}-${row.kind}`,
      href: row.kind === "paper" ? `/manage/${exam.id}?tab=review` : `/marking/${exam.id}`,
      title: `The controller sent back ${exam.title}`,
      detail: row.comment ? `“${row.comment}”` : `Their note is on the ${row.kind === "paper" ? "review" : "marking"} screen.`,
      tone: "warn",
    });
  }

  if (disputes.length > 0) {
    items.push({ id: "disputes", href: "/disputes", title: `${plural(disputes.length, "challenge")} from candidates`, detail: "Decide each one with a reason; an upheld fix reaches every candidate.", tone: "warn" });
  }

  const drafts = exams.filter((exam) => exam.status === "draft");
  for (const exam of drafts.slice(0, 2)) {
    items.push({ id: `draft-${exam.id}`, href: `/manage/${exam.id}?tab=review`, title: `Finish and publish ${exam.title}`, detail: "Run the checklist, then publish or send it for approval.", tone: "ready" });
  }
  return items;
}

export async function controllerAttention(member: Member): Promise<AttentionItem[]> {
  const pending: { id: string; kind: string; exam_id: string }[] = unwrap(
    await db().from("approvals").select("id, kind, exam_id").eq("institution_id", member.institution.id).eq("status", "pending"),
  );
  if (pending.length === 0) return [];
  const exams: { id: string; title: string }[] = unwrap(await db().from("exams").select("id, title").in("id", pending.map((row) => row.exam_id)));
  return pending.map((row) => ({
    id: `approval-${row.id}`,
    href: `/approvals/${row.id}`,
    title: `${row.kind === "paper" ? "Approve the paper" : "Sign off the results"} for ${exams.find((exam) => exam.id === row.exam_id)?.title ?? "an exam"}`,
    detail: "Waiting for your decision.",
    tone: "live",
  }));
}

export async function candidateAttention(member: Member): Promise<AttentionItem[]> {
  const candidateIds = await myCandidateIds(member);
  if (candidateIds.length === 0) return [];
  const since = new Date(Date.now() - RECENT_DAYS * MS_PER_DAY).toISOString();
  const [results, disputes]: [{ id: string; exam_id: string; version: number; reason: string | null }[], { id: string; status: string; decision_reason: string | null; result_id: string }[]] =
    await Promise.all([
      db().from("results").select("id, exam_id, version, reason").in("candidate_id", candidateIds).eq("is_current", true).gte("published_at", since).lte("published_at", new Date().toISOString()).then(unwrap),
      db().from("disputes").select("id, status, decision_reason, result_id").in("candidate_id", candidateIds).neq("status", "open").gte("decided_at", since).then(unwrap),
    ]);
  const examIds = [...new Set(results.map((row) => row.exam_id))];
  const exams: { id: string; title: string }[] = examIds.length === 0 ? [] : unwrap(await db().from("exams").select("id, title").in("id", examIds));
  const items: AttentionItem[] = results.map((row) => ({
    id: `result-${row.id}`,
    href: `/results/${row.id}`,
    title: `${row.version > 1 ? "Updated result" : "New result"}: ${exams.find((exam) => exam.id === row.exam_id)?.title ?? "an exam"}`,
    detail: row.reason ?? "See your marks, the correct answers and download the PDF.",
    tone: row.version > 1 ? "warn" : "ready",
  }));
  for (const dispute of disputes) {
    items.push({
      id: `dispute-${dispute.id}`,
      href: `/results/${dispute.result_id}`,
      title: `Your challenge was ${dispute.status === "upheld" ? "upheld" : "not upheld"}`,
      detail: dispute.decision_reason ?? "See the decision on your result.",
      tone: dispute.status === "upheld" ? "ready" : "warn",
    });
  }
  return items;
}
