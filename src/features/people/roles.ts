import type { Role } from "@/lib/access";

export const ROLE_LABELS: Record<string, string> = {
  institution_admin: "Admin",
  examiner: "Examiner",
  candidate: "Candidate",
  controller: "Controller of Examinations",
  invigilator: "Invigilator",
  observer: "Observer",
};

export const ROLE_CHOICES: { role: Role; label: string; description: string }[] = [
  { role: "examiner", label: "Examiner", description: "Sets questions and exams, marks answers, publishes results." },
  { role: "candidate", label: "Candidate", description: "Sits the exams they are enrolled in and sees their own results." },
  { role: "institution_admin", label: "Admin", description: "Manages people and roles for this institution." },
  { role: "controller", label: "Controller of Examinations", description: "Approves results before they go out and oversees every exam. Cannot approve their own." },
  { role: "invigilator", label: "Invigilator", description: "Watches live exams on the monitor. Sees no answers and no marks." },
  { role: "observer", label: "Observer", description: "Reads the audit log, read-only. Changes nothing." },
];

// Roles a person may ask for themselves. Admin is given by an admin, and candidates join by roster or link.
export const REQUESTABLE_ROLES = ["examiner", "controller", "invigilator", "observer"] as const;
