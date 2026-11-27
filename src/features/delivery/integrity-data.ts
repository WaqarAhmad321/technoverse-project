import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { assessIntegrity, type IntegrityLevel, type IntegritySignal } from "@/lib/integrity";

export type IntegrityStatus = "open" | "dismissed" | "reported" | "voided";

export type IntegrityRow = {
  attemptId: string;
  candidateName: string;
  rollNumber: string;
  level: IntegrityLevel;
  reasons: string[];
  signals: IntegritySignal[];
  status: IntegrityStatus;
  decisionNote: string;
};

type CaseRow = { attempt_id: string; status: IntegrityStatus; decision_note: string };

// Candidates with a low or review level, each with a neutral timeline of their signals. A decided case keeps its status.
export async function loadIntegrityRows(member: Member, examId: string): Promise<IntegrityRow[]> {
  const rawAttempts: { id: string; candidate_id: string | null }[] = unwrap(
    await db()
      .from("attempts")
      .select("id, candidate_id")
      .eq("institution_id", member.institution.id)
      .eq("exam_id", examId)
      .eq("is_sandbox", false),
  );
  if (rawAttempts.length === 0) return [];
  const candidates: { id: string; full_name: string; roll_number: string }[] = unwrap(
    await db()
      .from("candidates")
      .select("id, full_name, roll_number")
      .in("id", rawAttempts.flatMap((attempt) => (attempt.candidate_id ? [attempt.candidate_id] : []))),
  );
  const attempts = rawAttempts.map((attempt) => ({ id: attempt.id, candidate: candidates.find((row) => row.id === attempt.candidate_id) ?? null }));
  const ids = attempts.map((attempt) => attempt.id);
  const [incidents, cases]: [(IntegritySignal & { attempt_id: string })[], CaseRow[]] = await Promise.all([
    db()
      .from("incidents")
      .select("attempt_id, kind, details, occurred_at")
      .in("attempt_id", ids)
      .order("occurred_at", { ascending: true })
      .then(unwrap),
    db().from("integrity_cases").select("attempt_id, status, decision_note").in("attempt_id", ids).then(unwrap),
  ]);

  const rows: IntegrityRow[] = [];
  for (const attempt of attempts) {
    const signals = incidents.filter((incident) => incident.attempt_id === attempt.id);
    const assessment = assessIntegrity(signals);
    const decided = cases.find((row) => row.attempt_id === attempt.id);
    if (assessment.level === "none" && !decided) continue;
    rows.push({
      attemptId: attempt.id,
      candidateName: attempt.candidate?.full_name ?? "Unknown candidate",
      rollNumber: attempt.candidate?.roll_number ?? "",
      level: assessment.level,
      reasons: assessment.reasons,
      signals,
      status: decided?.status ?? "open",
      decisionNote: decided?.decision_note ?? "",
    });
  }
  return rows.sort((a, b) => Number(b.level === "review") - Number(a.level === "review"));
}
