import { NextResponse } from "next/server";
import { z } from "zod";
import { renderResultPdf } from "@/features/delivery/result-pdf";
import { memberOrNull, myCandidateIds } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { Result } from "@/lib/exam-types";

function notFound(): NextResponse {
  return NextResponse.json({ error: "We could not find that result." }, { status: 404 });
}

// The candidate gets their own published result; an examiner or admin gets any of their institution's.
export async function GET(request: Request, { params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = await params;
  if (!z.uuid().safeParse(resultId).success) return notFound();
  const member = await memberOrNull();
  if (!member) return notFound();

  const result: Result | null = unwrap(
    await db().from("results").select("*").eq("id", resultId).eq("institution_id", member.institution.id).maybeSingle(),
  );
  if (!result?.published_at) return notFound();
  const isStaff = member.roles.includes("examiner") || member.roles.includes("institution_admin");
  if (!isStaff && !(await myCandidateIds(member)).includes(result.candidate_id)) return notFound();

  const [exam, candidate]: [{ title: string } | null, { full_name: string; roll_number: string } | null] = await Promise.all([
    db().from("exams").select("title").eq("id", result.exam_id).maybeSingle().then(unwrap),
    db().from("candidates").select("full_name, roll_number").eq("id", result.candidate_id).maybeSingle().then(unwrap),
  ]);

  const pdf = await renderResultPdf({
    institutionName: member.institution.name,
    examTitle: exam?.title ?? "Exam",
    candidateName: candidate?.full_name ?? "",
    rollNumber: candidate?.roll_number ?? "",
    total: result.total,
    maxTotal: result.max_total,
    version: result.version,
    reason: result.reason,
    publishedAt: result.published_at,
    verifyCode: result.verify_code,
    verifyUrl: `${new URL(request.url).origin}/verify/${result.verify_code}`,
    lines: result.breakdown,
  });

  const fileName = `${(exam?.title ?? "result").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-result.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${fileName}"` },
  });
}
