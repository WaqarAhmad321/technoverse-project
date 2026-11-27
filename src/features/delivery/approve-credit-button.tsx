import { SubmitButton } from "@/components/submit-button";
import { approveCredit } from "./actions";

export function ApproveCreditButton({ attemptId, examId, seconds }: { attemptId: string; examId: string; seconds: number }) {
  return (
    <form action={approveCredit} className="mt-1">
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="examId" value={examId} />
      <input type="hidden" name="seconds" value={seconds} />
      <SubmitButton variant="outline">Approve {Math.round(seconds / 60)} min back</SubmitButton>
    </form>
  );
}
