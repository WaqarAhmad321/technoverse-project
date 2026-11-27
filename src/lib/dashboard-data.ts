import "server-only";
import { myCandidateIds, type Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { examPhase } from "@/lib/exam-rules";
import type { Exam, Institution } from "@/lib/exam-types";

export const PASS_PERCENT = 33;
const HISTOGRAM_BINS = 10;
const BIN_WIDTH_PERCENT = 100 / HISTOGRAM_BINS;
const HARDEST_QUESTIONS = 5;
const TITLE_MAX_CHARS = 56;

type ResultRow = { exam_id: string; attempt_id: string; candidate_id: string; total: number; max_total: number; published_at: string | null };
type ExamRow = Pick<Exam, "id" | "title" | "status" | "opens_at" | "closes_at" | "results_published_at" | "total_marks">;

const percent = (total: number, max: number): number => (max > 0 ? (Number(total) / max) * 100 : 0);
const round = (value: number): number => Math.round(value);
const shorten = (text: string): string => {
  const plain = text.replace(/\s+/g, " ").trim();
  return plain.length > TITLE_MAX_CHARS ? `${plain.slice(0, TITLE_MAX_CHARS - 1)}…` : plain;
};

async function submittedAttempts(institutionId: string, examIds: string[]): Promise<{ id: string; exam_id: string }[]> {
  if (examIds.length === 0) return [];
  return unwrap(
    await db().from("attempts").select("id, exam_id").eq("institution_id", institutionId).in("exam_id", examIds).eq("is_sandbox", false).neq("status", "in_progress"),
  );
}

async function currentResults(institutionId: string, attemptIds: string[]): Promise<ResultRow[]> {
  if (attemptIds.length === 0) return [];
  return unwrap(
    await db().from("results").select("exam_id, attempt_id, candidate_id, total, max_total, published_at").eq("institution_id", institutionId).eq("is_current", true).in("attempt_id", attemptIds),
  );
}

export type Bin = { from: number; to: number; count: number; passing: boolean };
export type Bar = { label: string; value: number; detail?: string };

export type ExaminerCharts = {
  distribution: { exam: string; bins: Bin[]; total: number; passed: number } | null;
  hardest: { exam: string; bars: Bar[] } | null;
  marking: { marked: number; toMark: number } | null;
};

export async function loadExaminerCharts(member: Member): Promise<ExaminerCharts> {
  const institutionId = member.institution.id;
  const exams: ExamRow[] = unwrap(
    await db().from("exams").select("id, title, status, opens_at, closes_at, results_published_at, total_marks").eq("institution_id", institutionId),
  );
  const now = new Date();
  const closed = exams.filter((exam) => examPhase(exam, now) === "closed").sort((a, b) => b.closes_at.localeCompare(a.closes_at));
  if (closed.length === 0) return { distribution: null, hardest: null, marking: null };

  const attempts = await submittedAttempts(institutionId, closed.map((exam) => exam.id));
  const attemptIds = attempts.map((row) => row.id);
  if (attemptIds.length === 0) return { distribution: null, hardest: null, marking: null };
  const latest = closed.find((exam) => attempts.some((row) => row.exam_id === exam.id)) ?? closed[0];
  const latestAttemptIds = new Set(attempts.filter((row) => row.exam_id === latest.id).map((row) => row.id));

  const [results, questions, grades]: [ResultRow[], { attempt_id: string; question_id: string; body: string; marks: number; kind: string }[], { attempt_id: string; question_id: string; marks_awarded: number }[]] =
    await Promise.all([
      currentResults(institutionId, attemptIds),
      db().from("attempt_questions").select("attempt_id, question_id, body, marks, kind").eq("institution_id", institutionId).in("attempt_id", attemptIds).then(unwrap),
      db().from("grades").select("attempt_id, question_id, marks_awarded").eq("institution_id", institutionId).in("attempt_id", attemptIds).then(unwrap),
    ]);

  let distribution: ExaminerCharts["distribution"] = null;
  const scored = closed.find((exam) => results.some((row) => row.exam_id === exam.id));
  if (scored) {
    const scoredResults = results.filter((row) => row.exam_id === scored.id);
    const bins: Bin[] = Array.from({ length: HISTOGRAM_BINS }, (_, index) => ({
      from: index * BIN_WIDTH_PERCENT,
      to: (index + 1) * BIN_WIDTH_PERCENT,
      count: 0,
      passing: (index + 1) * BIN_WIDTH_PERCENT > PASS_PERCENT,
    }));
    let passed = 0;
    for (const row of scoredResults) {
      const score = percent(row.total, row.max_total);
      if (score >= PASS_PERCENT) passed += 1;
      bins[Math.min(HISTOGRAM_BINS - 1, Math.floor(score / BIN_WIDTH_PERCENT))].count += 1;
    }
    distribution = { exam: scored.title, bins, total: scoredResults.length, passed };
  }

  const gradeByKey = new Map(grades.map((row) => [`${row.attempt_id}:${row.question_id}`, Number(row.marks_awarded)]));
  const perQuestion = new Map<string, { body: string; earned: number; possible: number }>();
  for (const row of questions.filter((item) => latestAttemptIds.has(item.attempt_id) && item.marks > 0)) {
    const awarded = gradeByKey.get(`${row.attempt_id}:${row.question_id}`);
    if (awarded === undefined) continue;
    const entry = perQuestion.get(row.question_id) ?? { body: row.body, earned: 0, possible: 0 };
    entry.earned += awarded;
    entry.possible += row.marks;
    perQuestion.set(row.question_id, entry);
  }
  const bars = [...perQuestion.values()]
    .map((entry) => ({ label: shorten(entry.body), value: round(percent(entry.earned, entry.possible)) }))
    .sort((a, b) => a.value - b.value)
    .slice(0, HARDEST_QUESTIONS);

  const written = questions.filter((row) => row.kind === "written");
  const marked = written.filter((row) => gradeByKey.has(`${row.attempt_id}:${row.question_id}`)).length;
  return {
    distribution,
    hardest: bars.length > 0 ? { exam: latest.title, bars } : null,
    marking: written.length > 0 ? { marked, toMark: written.length - marked } : null,
  };
}

export type CandidateCharts = {
  scores: { exam: string; yours: number; classAverage: number }[];
  topics: Bar[];
};

export async function loadCandidateCharts(member: Member): Promise<CandidateCharts> {
  const empty: CandidateCharts = { scores: [], topics: [] };
  const candidateIds = await myCandidateIds(member);
  if (candidateIds.length === 0) return empty;
  const institutionId = member.institution.id;

  const mine: ResultRow[] = unwrap(
    await db().from("results").select("exam_id, attempt_id, candidate_id, total, max_total, published_at").eq("institution_id", institutionId).in("candidate_id", candidateIds).eq("is_current", true).lte("published_at", new Date().toISOString()).order("published_at"),
  );
  if (mine.length === 0) return empty;
  const examIds = [...new Set(mine.map((row) => row.exam_id))];
  const myAttemptIds = mine.map((row) => row.attempt_id);

  const [exams, everyone, realAttempts, questions, grades]: [
    { id: string; title: string }[],
    ResultRow[],
    { id: string }[],
    { attempt_id: string; question_id: string; topic: string; marks: number }[],
    { attempt_id: string; question_id: string; marks_awarded: number }[],
  ] = await Promise.all([
    db().from("exams").select("id, title").eq("institution_id", institutionId).in("id", examIds).then(unwrap),
    db().from("results").select("exam_id, attempt_id, candidate_id, total, max_total, published_at").eq("institution_id", institutionId).eq("is_current", true).in("exam_id", examIds).then(unwrap),
    db().from("attempts").select("id").eq("institution_id", institutionId).in("exam_id", examIds).eq("is_sandbox", false).then(unwrap),
    db().from("attempt_questions").select("attempt_id, question_id, topic, marks").eq("institution_id", institutionId).in("attempt_id", myAttemptIds).then(unwrap),
    db().from("grades").select("attempt_id, question_id, marks_awarded").eq("institution_id", institutionId).in("attempt_id", myAttemptIds).then(unwrap),
  ]);

  const real = new Set(realAttempts.map((row) => row.id));
  const titles = new Map(exams.map((exam) => [exam.id, exam.title]));

  const classPercents = new Map<string, number[]>();
  for (const row of everyone.filter((item) => real.has(item.attempt_id))) {
    classPercents.set(row.exam_id, [...(classPercents.get(row.exam_id) ?? []), percent(row.total, row.max_total)]);
  }
  const scores = mine
    .filter((row) => real.has(row.attempt_id))
    .map((row) => {
      const peers = classPercents.get(row.exam_id) ?? [];
      const average = peers.length > 0 ? peers.reduce((sum, value) => sum + value, 0) / peers.length : 0;
      return { exam: titles.get(row.exam_id) ?? "Exam", yours: round(percent(row.total, row.max_total)), classAverage: round(average) };
    });

  const gradeByKey = new Map(grades.map((row) => [`${row.attempt_id}:${row.question_id}`, Number(row.marks_awarded)]));
  const byTopic = new Map<string, { earned: number; possible: number }>();
  for (const row of questions.filter((item) => real.has(item.attempt_id) && item.marks > 0)) {
    const awarded = gradeByKey.get(`${row.attempt_id}:${row.question_id}`);
    if (awarded === undefined) continue;
    const entry = byTopic.get(row.topic) ?? { earned: 0, possible: 0 };
    entry.earned += awarded;
    entry.possible += row.marks;
    byTopic.set(row.topic, entry);
  }
  const topics = [...byTopic.entries()]
    .map(([topic, entry]) => ({ label: topic, value: round(percent(entry.earned, entry.possible)) }))
    .sort((a, b) => b.value - a.value);
  return { scores, topics };
}

export type StaffCharts = {
  states: Bar[];
  passRates: Bar[];
  approvals: { paper: number; results: number } | null;
};

export async function loadStaffCharts(member: Member): Promise<StaffCharts> {
  const institutionId = member.institution.id;
  const [exams, approvals]: [ExamRow[], { kind: "paper" | "results" }[]] = await Promise.all([
    db().from("exams").select("id, title, status, opens_at, closes_at, results_published_at, total_marks").eq("institution_id", institutionId).then(unwrap),
    db().from("approvals").select("kind").eq("institution_id", institutionId).eq("status", "pending").then(unwrap),
  ]);
  const now = new Date();
  const count = (test: (exam: ExamRow) => boolean) => exams.filter(test).length;
  const states: Bar[] = [
    { label: "Draft", value: count((exam) => exam.status === "draft") },
    { label: "Scheduled", value: count((exam) => examPhase(exam, now) === "upcoming") },
    { label: "Open now", value: count((exam) => examPhase(exam, now) === "open") },
    { label: "Closed", value: count((exam) => examPhase(exam, now) === "closed" && !exam.results_published_at) },
    { label: "Results released", value: count((exam) => examPhase(exam, now) === "closed" && Boolean(exam.results_published_at)) },
  ];

  const closed = exams.filter((exam) => examPhase(exam, now) === "closed");
  const attempts = await submittedAttempts(institutionId, closed.map((exam) => exam.id));
  const results = await currentResults(institutionId, attempts.map((row) => row.id));
  const passRates: Bar[] = closed
    .map((exam) => {
      const rows = results.filter((row) => row.exam_id === exam.id);
      const passed = rows.filter((row) => percent(row.total, row.max_total) >= PASS_PERCENT).length;
      return { label: exam.title, value: rows.length === 0 ? -1 : round((passed / rows.length) * 100), detail: `${passed} of ${rows.length} passed` };
    })
    .filter((bar) => bar.value >= 0);

  return {
    states: states.some((bar) => bar.value > 0) ? states : [],
    passRates,
    approvals:
      member.roles.includes("controller") || member.roles.includes("institution_admin")
        ? { paper: approvals.filter((row) => row.kind === "paper").length, results: approvals.filter((row) => row.kind === "results").length }
        : null,
  };
}

export type PlatformCharts = {
  statuses: Bar[];
  perInstitution: { name: string; people: number; exams: number }[];
};

export async function loadPlatformCharts(): Promise<PlatformCharts> {
  const [institutions, memberships, exams]: [Pick<Institution, "id" | "name" | "status">[], { institution_id: string; member_id: string }[], { institution_id: string }[]] = await Promise.all([
    db().from("institutions").select("id, name, status").then(unwrap),
    db().from("memberships").select("institution_id, member_id").eq("active", true).then(unwrap),
    db().from("exams").select("institution_id").then(unwrap),
  ]);
  const labels: Record<Institution["status"], string> = { active: "Active", pending: "Waiting for approval", suspended: "Suspended", rejected: "Rejected" };
  const statuses = (Object.keys(labels) as Institution["status"][]).map((status) => ({ label: labels[status], value: institutions.filter((row) => row.status === status).length }));
  const perInstitution = institutions
    .map((row) => ({
      name: row.name,
      people: new Set(memberships.filter((item) => item.institution_id === row.id).map((item) => item.member_id)).size,
      exams: exams.filter((item) => item.institution_id === row.id).length,
    }))
    .sort((a, b) => b.people + b.exams - (a.people + a.exams))
    .slice(0, 8);
  return { statuses: statuses.some((bar) => bar.value > 0) ? statuses : [], perInstitution };
}
