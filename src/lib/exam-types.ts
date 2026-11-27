// One type per table in hack/architecture.md. Columns every exam table shares come first.

export type Owned = { id: string; user_id: string; created_at: string };
export type InInstitution = Owned & { institution_id: string };

export type Difficulty = "easy" | "medium" | "hard";
export type QuestionKind = "single" | "multiple" | "written";
export type MultipleRule = "all_or_nothing" | "partial";
export type QuestionOption = { id: string; text: string };
export type AnswerKey = string[];

export type Profile = {
  id: string;
  display_name: string;
  email: string;
  is_super_admin: boolean;
  created_at: string;
};

export type InstitutionKind = "university" | "college" | "board" | "test_body";

export type Institution = Owned & {
  name: string;
  kind: InstitutionKind;
  city: string;
  status: "active" | "pending" | "suspended" | "rejected";
  review_note?: string | null;
  reviewed_at?: string | null;
};

export type Membership = InInstitution & {
  member_id: string;
  role: string;
  active: boolean;
};

export type Candidate = InInstitution & {
  full_name: string;
  roll_number: string;
  email: string;
  cnic_masked: string;
  extra_time_pct: number;
};

export type Question = InInstitution & {
  topic: string;
  difficulty: Difficulty;
  kind: QuestionKind;
  body: string;
  options: QuestionOption[];
  answer_key: AnswerKey | null;
  marks: number;
  multiple_rule: MultipleRule;
  rubric: string | null;
  version: number;
};

export type Exam = InInstitution & {
  title: string;
  instructions: string;
  opens_at: string;
  closes_at: string;
  duration_minutes: number;
  total_marks: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  status: "draft" | "published";
  published_at: string | null;
  results_published_at: string | null;
  settings: Record<string, unknown>;
};

export type ExamQuestion = InInstitution & { exam_id: string; question_id: string; position: number };

export type Enrollment = InInstitution & { exam_id: string; candidate_id: string };

export type AttemptStatus = "in_progress" | "submitted" | "auto_submitted";

export type Attempt = InInstitution & {
  exam_id: string;
  candidate_id: string | null;
  is_sandbox: boolean;
  status: AttemptStatus;
  seed: number;
  started_at: string;
  deadline_at: string;
  credit_seconds: number;
  submitted_at: string | null;
  receipt_code: string | null;
  last_seen_at: string | null;
};

export type AttemptQuestion = InInstitution & {
  attempt_id: string;
  question_id: string;
  position: number;
  kind: QuestionKind;
  body: string;
  topic: string;
  difficulty: Difficulty;
  marks: number;
  multiple_rule: MultipleRule;
  rubric: string | null;
  options: QuestionOption[];
  answer_key: AnswerKey | null;
};

export type AnswerResponse = { choices?: string[]; text?: string };

export type Answer = InInstitution & {
  attempt_id: string;
  question_id: string;
  response: AnswerResponse;
  marked_for_review: boolean;
  client_seq: number;
  saved_offline: boolean;
  received_at: string;
};

export type Scratchpad = InInstitution & { attempt_id: string; question_id: string; body: string; updated_at: string };

export type IncidentKind = "offline" | "resumed" | "tab_hidden" | "paste" | "late_answer";

export type Incident = InInstitution & {
  attempt_id: string;
  kind: IncidentKind;
  details: Record<string, unknown>;
  occurred_at: string;
};

export type Announcement = InInstitution & { exam_id: string; body: string; question_position: number | null };

export type Preferences = Owned & {
  font_scale: "normal" | "large" | "larger";
  contrast: "normal" | "high";
  layout: "one_at_a_time" | "all_on_one_page";
  updated_at: string;
};

export type Grade = InInstitution & {
  attempt_id: string;
  question_id: string;
  marks_awarded: number;
  source: "auto" | "manual";
  feedback: string | null;
  graded_by: string | null;
};

export type ResultLine = { position: number; question_id: string; marks_awarded: number; marks: number };

export type Result = InInstitution & {
  exam_id: string;
  attempt_id: string;
  candidate_id: string;
  version: number;
  total: number;
  max_total: number;
  breakdown: ResultLine[];
  reason: string | null;
  is_current: boolean;
  verify_code: string;
  published_at: string | null;
};

export type KeyFixDecision = "change_key" | "accept_both" | "full_marks" | "drop";

export type KeyFix = InInstitution & {
  exam_id: string;
  question_id: string;
  decision: KeyFixDecision;
  old_key: AnswerKey | null;
  new_key: AnswerKey | null;
  reason: string;
};

export type Dispute = InInstitution & {
  result_id: string;
  candidate_id: string;
  question_id: string | null;
  body: string;
  status: "open" | "upheld" | "rejected";
  decision_reason: string | null;
  decided_by: string | null;
  decided_at: string | null;
};

export type AuditEvent = InInstitution & {
  actor_id: string;
  action: string;
  entity_id: string | null;
  payload: Record<string, unknown>;
  prev_hash: string;
  hash: string;
};
