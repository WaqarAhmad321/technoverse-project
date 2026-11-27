import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";

export type ExaminerOversight = {
  id: string;
  name: string;
  drafts: number;
  published: number;
  closed: number;
  toMark: number;
  resultsReleased: number;
  keyFixes: number;
  disputesOpen: number;
  disputesUpheld: number;
  disputesRejected: number;
  integrityDecided: number;
  lastActionAt: string | null;
};

type ExamLite = { id: string; user_id: string; status: string; closes_at: string; results_published_at: string | null };
type AttemptQuestion = { attempt_id: string; question_id: string };

function tally<T>(rows: T[], key: (row: T) => string | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const id = key(row);
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export async function loadExaminerOversight(member: Member): Promise<ExaminerOversight[]> {
  const institutionId = member.institution.id;
  const memberships: { member_id: string }[] = unwrap(
    await db().from("memberships").select("member_id").eq("institution_id", institutionId).eq("role", "examiner").eq("active", true),
  );
  const exams: ExamLite[] = unwrap(
    await db().from("exams").select("id, user_id, status, closes_at, results_published_at").eq("institution_id", institutionId),
  );
  const examinerIds = [...new Set([...memberships.map((row) => row.member_id), ...exams.map((exam) => exam.user_id)])];
  if (examinerIds.length === 0) return [];
  const ownerByExam = new Map(exams.map((exam) => [exam.id, exam.user_id]));
  const examIds = exams.map((exam) => exam.id);

  const [profiles, fixes, disputes, integrity, events, attempts]: [
    { id: string; display_name: string }[],
    { exam_id: string }[],
    { status: string; result_id: string }[],
    { exam_id: string }[],
    { actor_id: string; created_at: string }[],
    { id: string; exam_id: string }[],
  ] = await Promise.all([
    db().from("profiles").select("id, display_name").in("id", examinerIds).then(unwrap),
    db().from("key_fixes").select("exam_id").eq("institution_id", institutionId).then(unwrap),
    db().from("disputes").select("status, result_id").eq("institution_id", institutionId).then(unwrap),
    db().from("integrity_cases").select("exam_id").eq("institution_id", institutionId).neq("status", "open").then(unwrap),
    db()
      .from("audit_events")
      .select("actor_id, created_at")
      .eq("institution_id", institutionId)
      .in("actor_id", examinerIds)
      .order("created_at", { ascending: false })
      .limit(2000)
      .then(unwrap),
    examIds.length === 0
      ? Promise.resolve([])
      : db().from("attempts").select("id, exam_id").in("exam_id", examIds).eq("is_sandbox", false).neq("status", "in_progress").then(unwrap),
  ]);
  const results: { id: string; exam_id: string }[] =
    disputes.length === 0 ? [] : unwrap(await db().from("results").select("id, exam_id").in("id", disputes.map((row) => row.result_id)));
  const examByResult = new Map(results.map((row) => [row.id, row.exam_id]));

  const attemptIds = attempts.map((row) => row.id);
  const [written, graded]: [AttemptQuestion[], AttemptQuestion[]] =
    attemptIds.length === 0
      ? [[], []]
      : await Promise.all([
          db().from("attempt_questions").select("attempt_id, question_id").in("attempt_id", attemptIds).eq("kind", "written").then(unwrap),
          db().from("grades").select("attempt_id, question_id").in("attempt_id", attemptIds).eq("source", "manual").then(unwrap),
        ]);
  const examByAttempt = new Map(attempts.map((row) => [row.id, row.exam_id]));
  const gradedKeys = new Set(graded.map((row) => `${row.attempt_id}:${row.question_id}`));
  const unmarked = written.filter((row) => !gradedKeys.has(`${row.attempt_id}:${row.question_id}`));

  const owner = (examId: string | undefined) => (examId ? (ownerByExam.get(examId) ?? null) : null);
  const toMark = tally(unmarked, (row) => owner(examByAttempt.get(row.attempt_id)));
  const keyFixes = tally(fixes, (row) => owner(row.exam_id));
  const integrityDecided = tally(integrity, (row) => owner(row.exam_id));
  const disputesBy = (status: string) =>
    tally(disputes.filter((row) => row.status === status), (row) => owner(examByResult.get(row.result_id)));
  const open = disputesBy("open");
  const upheld = disputesBy("upheld");
  const rejected = disputesBy("rejected");
  const lastAction = new Map<string, string>();
  for (const event of events) if (!lastAction.has(event.actor_id)) lastAction.set(event.actor_id, event.created_at);

  const now = Date.now();
  return examinerIds
    .map((id) => {
      const mine = exams.filter((exam) => exam.user_id === id);
      const live = mine.filter((exam) => exam.status !== "draft");
      return {
        id,
        name: profiles.find((profile) => profile.id === id)?.display_name ?? "Someone",
        drafts: mine.length - live.length,
        published: live.filter((exam) => new Date(exam.closes_at).getTime() > now).length,
        closed: live.filter((exam) => new Date(exam.closes_at).getTime() <= now).length,
        toMark: toMark.get(id) ?? 0,
        resultsReleased: mine.filter((exam) => exam.results_published_at).length,
        keyFixes: keyFixes.get(id) ?? 0,
        disputesOpen: open.get(id) ?? 0,
        disputesUpheld: upheld.get(id) ?? 0,
        disputesRejected: rejected.get(id) ?? 0,
        integrityDecided: integrityDecided.get(id) ?? 0,
        lastActionAt: lastAction.get(id) ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
