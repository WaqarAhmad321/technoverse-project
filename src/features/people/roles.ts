import type { Role } from "@/lib/access";

export const ROLE_LABELS: Record<string, string> = {
  institution_admin: "Admin",
  examiner: "Examiner",
  candidate: "Candidate",
};

export const ROLE_CHOICES: { role: Role; label: string; description: string }[] = [
  { role: "examiner", label: "Examiner", description: "Sets questions and exams, marks answers, publishes results." },
  { role: "candidate", label: "Candidate", description: "Sits the exams they are enrolled in and sees their own results." },
  { role: "institution_admin", label: "Admin", description: "Manages people and roles for this institution." },
];
