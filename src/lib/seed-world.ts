import "server-only";
import { randomUUID } from "node:crypto";
import { newReceiptCode, newVerifyCode } from "@/lib/codes";
import { db, unwrap } from "@/lib/db";
import type { Difficulty, Exam, MultipleRule, Question, QuestionKind, QuestionOption } from "@/lib/exam-types";
import { buildPaper, seededRandom, type PaperRow } from "@/lib/paper";

export type WorldContext = { ownerId: string; institutionId: string; ayeshaEmail: string; bilalEmail: string };

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const STUDENT_DOMAIN = "students.ravi-college.example";

type BankEntry = {
  key: string;
  topic: string;
  difficulty: Difficulty;
  kind: QuestionKind;
  body: string;
  options?: string[];
  answer?: string[];
  trueAnswer?: string[];
  marks: number;
  rubric?: string;
  multipleRule?: MultipleRule;
};

// `trueAnswer` differs from `answer` only for the Key Doctor's case: the stored key is wrong on purpose.
const BANK: BankEntry[] = [
  { key: "K1", topic: "Kinematics", difficulty: "easy", kind: "single", marks: 2, body: "A car travels 120 km in 2 hours. What is its average speed?", options: ["40 km/h", "60 km/h", "80 km/h", "240 km/h"], answer: ["b"] },
  { key: "K2", topic: "Kinematics", difficulty: "medium", kind: "single", marks: 3, body: "A ball is dropped from rest. Taking g = 10 m/s², how far does it fall in 3 seconds?", options: ["15 m", "30 m", "45 m", "90 m"], answer: ["c"] },
  { key: "K3", topic: "Kinematics", difficulty: "medium", kind: "single", marks: 3, body: "A train speeds up evenly from 10 m/s to 30 m/s in 5 s. What is its acceleration?", options: ["2 m/s²", "4 m/s²", "6 m/s²", "8 m/s²"], answer: ["b"] },
  { key: "K4", topic: "Kinematics", difficulty: "medium", kind: "multiple", marks: 4, body: "Which of these are vector quantities?", options: ["Displacement", "Speed", "Velocity", "Acceleration", "Distance"], answer: ["a", "c", "d"] },
  { key: "K5", topic: "Kinematics", difficulty: "hard", kind: "single", marks: 5, body: "A stone is thrown horizontally at 20 m/s from the top of a 45 m cliff (g = 10 m/s²). How far from the foot of the cliff does it land?", options: ["30 m", "45 m", "60 m", "90 m"], answer: ["c"] },
  { key: "KC", topic: "Kinematics", difficulty: "medium", kind: "single", marks: 3, body: "A body moves in a circle at a constant speed. Which statement is correct?", options: ["Its velocity is constant", "Its acceleration points towards the centre", "It has no acceleration", "Its speed keeps changing"], answer: ["c"], trueAnswer: ["b"] },
  { key: "F1", topic: "Forces", difficulty: "easy", kind: "single", marks: 2, body: "What is the SI unit of force?", options: ["Joule", "Newton", "Watt", "Pascal"], answer: ["b"] },
  { key: "F2", topic: "Forces", difficulty: "medium", kind: "single", marks: 3, body: "A 1,200 kg car accelerates at 2 m/s². What net force acts on it?", options: ["600 N", "1,200 N", "2,400 N", "4,800 N"], answer: ["c"] },
  { key: "F3", topic: "Forces", difficulty: "medium", kind: "single", marks: 3, body: "By Newton's third law, when you push against a wall, the wall…", options: ["pushes back with an equal and opposite force", "pushes back with a smaller force", "does not push back", "moves away from you"], answer: ["a"] },
  { key: "F4", topic: "Forces", difficulty: "hard", kind: "multiple", marks: 4, body: "Which statements about friction are true?", options: ["It opposes relative motion", "Static friction can be greater than kinetic friction", "It always depends on the area of contact", "It turns kinetic energy into heat"], answer: ["a", "b", "d"] },
  { key: "F5", topic: "Forces", difficulty: "medium", kind: "written", marks: 5, body: "Explain, with one everyday example, why passengers lurch forward when a bus brakes suddenly.", rubric: "2 marks: names inertia or Newton's first law. 2 marks: the body keeps moving while the bus slows down. 1 mark: a clear everyday example." },
  { key: "E1", topic: "Energy", difficulty: "easy", kind: "single", marks: 2, body: "Which unit measures energy?", options: ["Joule", "Newton", "Watt", "Volt"], answer: ["a"] },
  { key: "E2", topic: "Energy", difficulty: "medium", kind: "single", marks: 3, body: "A 2 kg ball is lifted through 5 m (g = 10 m/s²). How much potential energy does it gain?", options: ["10 J", "50 J", "100 J", "200 J"], answer: ["c"] },
  { key: "E3", topic: "Energy", difficulty: "medium", kind: "single", marks: 3, body: "A 60 W bulb stays on for 2 hours. How much energy does it use?", options: ["120 J", "7,200 J", "432,000 J", "3,600 J"], answer: ["c"] },
  { key: "E4", topic: "Energy", difficulty: "hard", kind: "single", marks: 4, body: "A 0.5 kg ball moves at 4 m/s. What is its kinetic energy?", options: ["1 J", "2 J", "4 J", "8 J"], answer: ["c"] },
  { key: "E5", topic: "Energy", difficulty: "hard", kind: "written", marks: 5, body: "During load-shedding a UPS runs a 100 W fan from a 12 V battery. Estimate the current drawn and give one way to make the battery last longer.", rubric: "2 marks: I = P / V, about 8.3 A. 2 marks: working shown. 1 mark: a sensible way to save energy, such as a lower fan speed or a more efficient fan." },
  { key: "W1", topic: "Waves", difficulty: "easy", kind: "single", marks: 2, body: "The number of complete waves passing a point each second is the wave's…", options: ["amplitude", "wavelength", "frequency", "speed"], answer: ["c"] },
  { key: "W2", topic: "Waves", difficulty: "medium", kind: "single", marks: 3, body: "A wave has a frequency of 50 Hz and a wavelength of 2 m. What is its speed?", options: ["25 m/s", "52 m/s", "100 m/s", "200 m/s"], answer: ["c"] },
  { key: "W3", topic: "Waves", difficulty: "medium", kind: "single", marks: 3, body: "Sound cannot travel through…", options: ["water", "steel", "air", "a vacuum"], answer: ["d"] },
  { key: "W4", topic: "Waves", difficulty: "medium", kind: "multiple", marks: 4, body: "Which of these are transverse waves?", options: ["Light", "Sound in air", "Ripples on water", "Radio waves"], answer: ["a", "c", "d"] },
  { key: "W5", topic: "Waves", difficulty: "hard", kind: "single", marks: 4, body: "An echo is heard 2 s after a shout towards a cliff. Sound travels at 340 m/s. How far away is the cliff?", options: ["170 m", "340 m", "680 m", "85 m"], answer: ["b"] },
];

type ExamPlan = {
  slug: "midterm" | "waves" | "quiz1" | "pretest";
  title: string;
  instructions: string;
  opensInMs: number;
  closesInMs: number;
  durationMinutes: number;
  totalMarks: number;
  status: Exam["status"];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  questions: string[];
  resultsPublished: boolean;
};

const STANDARD_INSTRUCTIONS =
  "Answer every question. Your answers save as you go, and they are kept on your phone if the connection drops. If an outage stops you from working, you get that time back, up to 10% of the exam. The timer follows the exam server, not your device clock. We note when you leave the exam tab or paste text: these are signals for your examiner to review, never automatic penalties. Multiple-select questions give partial marks: (right choices − wrong choices) ÷ correct choices × marks, never below zero.";

// The Midterm's questions add up to 45 against a total of 50: the publish checklist catches it in demo step 3.
const EXAMS: ExamPlan[] = [
  { slug: "midterm", title: "Physics Midterm", instructions: STANDARD_INSTRUCTIONS, opensInMs: -MS_PER_HOUR, closesInMs: 7 * MS_PER_DAY, durationMinutes: 30, totalMarks: 50, status: "draft", shuffleQuestions: true, shuffleOptions: true, questions: ["K2", "K3", "K4", "F1", "F2", "F4", "F5", "E2", "E3", "E4", "W2", "W4", "W5"], resultsPublished: false },
  { slug: "waves", title: "Waves Practice Quiz", instructions: STANDARD_INSTRUCTIONS, opensInMs: -MS_PER_HOUR, closesInMs: 14 * MS_PER_DAY, durationMinutes: 15, totalMarks: 16, status: "published", shuffleQuestions: true, shuffleOptions: true, questions: ["W1", "W2", "W3", "W4", "W5"], resultsPublished: false },
  { slug: "quiz1", title: "Physics Quiz 1", instructions: STANDARD_INSTRUCTIONS, opensInMs: -2 * MS_PER_DAY, closesInMs: -MS_PER_DAY, durationMinutes: 30, totalMarks: 30, status: "published", shuffleQuestions: true, shuffleOptions: false, questions: ["K1", "K2", "F1", "F2", "E1", "E2", "KC", "F3", "E4", "F5"], resultsPublished: false },
  { slug: "pretest", title: "Physics Pre-test", instructions: STANDARD_INSTRUCTIONS, opensInMs: -8 * MS_PER_DAY, closesInMs: -7 * MS_PER_DAY, durationMinutes: 20, totalMarks: 14, status: "published", shuffleQuestions: false, shuffleOptions: false, questions: ["K1", "F1", "E1", "W1", "W2", "E2"], resultsPublished: true },
];

type RosterEntry = { name: string; roll: string; ability: number; extraTimePct?: number };

// Ayesha first; Kashif, last, sits neither past exam.
const ROSTER: RosterEntry[] = [
  { name: "Ayesha Khan", roll: "0231", ability: 0.85 },
  { name: "Bilal Ahmed", roll: "0232", ability: 0.55 },
  { name: "Hamza Tariq", roll: "0233", ability: 0.92 },
  { name: "Fatima Zahra", roll: "0234", ability: 0.88 },
  { name: "Usman Ali", roll: "0235", ability: 0.4 },
  { name: "Zainab Hussain", roll: "0236", ability: 0.75 },
  { name: "Ali Raza", roll: "0237", ability: 0.3 },
  { name: "Maryam Javed", roll: "0238", ability: 0.95 },
  { name: "Hassan Mehmood", roll: "0239", ability: 0.5 },
  { name: "Hira Shahid", roll: "0240", ability: 0.7, extraTimePct: 25 },
  { name: "Saad Qureshi", roll: "0241", ability: 0.35 },
  { name: "Amna Rafiq", roll: "0242", ability: 0.82 },
  { name: "Omer Farooq", roll: "0243", ability: 0.45 },
  { name: "Iqra Nadeem", roll: "0244", ability: 0.9 },
  { name: "Danish Akhtar", roll: "0246", ability: 0.25 },
  { name: "Rabia Aslam", roll: "0247", ability: 0.65 },
  { name: "Talha Butt", roll: "0248", ability: 0.38 },
  { name: "Mahnoor Saleem", roll: "0249", ability: 0.78 },
  { name: "Abdullah Khalid", roll: "0250", ability: 0.6 },
  { name: "Areeba Imran", roll: "0251", ability: 0.86 },
  { name: "Haris Chaudhry", roll: "0252", ability: 0.42 },
  { name: "Noor Fatima", roll: "0253", ability: 0.72 },
  { name: "Waleed Anwar", roll: "0254", ability: 0.33 },
  { name: "Komal Sheikh", roll: "0255", ability: 0.68 },
  { name: "Fahad Mirza", roll: "0256", ability: 0.52 },
  { name: "Laiba Yousaf", roll: "0257", ability: 0.8 },
  { name: "Shahzaib Riaz", roll: "0258", ability: 0.28 },
  { name: "Eman Zafar", roll: "0259", ability: 0.62 },
  { name: "Junaid Iqbal", roll: "0260", ability: 0.48 },
  { name: "Ayan Siddiqui", roll: "0261", ability: 0.58 },
  { name: "Kashif Nawaz", roll: "0262", ability: 0.5 },
];

const SAT_PAST_EXAMS = ROSTER.length - 1;

const WRITTEN_ANSWERS = [
  "Because of inertia. By Newton's first law a body keeps moving unless a force acts on it. When the bus brakes, our feet stop with the bus but the upper body keeps moving forward. The same happens when a rickshaw stops suddenly.",
  "Inertia keeps our body moving forward while the bus slows down, so we lean forward. Seat belts in cars stop this.",
  "The brakes push us forward because the bus stops.",
  "Newton's first law. The body wants to stay in motion.",
];

const DIFFICULTY_PENALTY: Record<Difficulty, number> = { easy: -0.1, medium: 0.05, hard: 0.2 };
const SKIP_CHANCE = 0.04;
const MISCONCEPTION_CHANCE = 0.6;

function optionIds(count: number): string[] {
  return Array.from({ length: count }, (_, index) => String.fromCharCode("a".charCodeAt(0) + index));
}

function cnicFor(index: number): string {
  return `35202-•••••••-${(index * 7 + 3) % 10}`;
}

function emailFor(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${STUDENT_DOMAIN}`;
}

function at(base: number, offsetMs: number): string {
  return new Date(base + offsetMs).toISOString();
}

type SeedQuestion = Question & { trueAnswer: string[] | null; bankKey: string };

function buildQuestions(context: WorldContext, nowMs: number): SeedQuestion[] {
  return BANK.map((entry, index) => {
    const options: QuestionOption[] = (entry.options ?? []).map((text, optionIndex) => ({
      id: optionIds(entry.options?.length ?? 0)[optionIndex] ?? "a",
      text,
    }));
    return {
      id: randomUUID(),
      user_id: context.ownerId,
      institution_id: context.institutionId,
      created_at: at(nowMs, -30 * MS_PER_DAY + index * MS_PER_MINUTE),
      topic: entry.topic,
      difficulty: entry.difficulty,
      kind: entry.kind,
      body: entry.body,
      options,
      answer_key: entry.answer ?? null,
      marks: entry.marks,
      multiple_rule: entry.multipleRule ?? "partial",
      rubric: entry.rubric ?? null,
      version: 1,
      variants: [],
      trueAnswer: entry.trueAnswer ?? entry.answer ?? null,
      bankKey: entry.key,
    };
  });
}

const SEED_ONLY_FIELDS = new Set(["trueAnswer", "bankKey"]);

function questionRow(question: SeedQuestion): Question {
  return Object.fromEntries(Object.entries(question).filter(([field]) => !SEED_ONLY_FIELDS.has(field))) as Question;
}

type ChosenAnswer = { choices?: string[]; text?: string } | null;

function chooseAnswer(row: PaperRow, truth: string[] | null, ability: number, random: () => number, isAyesha: boolean): ChosenAnswer {
  if (random() < SKIP_CHANCE && !isAyesha) return null;
  if (row.kind === "written") {
    const index = Math.min(WRITTEN_ANSWERS.length - 1, Math.floor((1 - ability) * WRITTEN_ANSWERS.length));
    return { text: WRITTEN_ANSWERS[index] ?? WRITTEN_ANSWERS[0] };
  }
  const correct = truth ?? [];
  const ids = row.options.map((option) => option.id);
  const isKeyDoctorCase = JSON.stringify(row.answer_key) !== JSON.stringify(truth);
  if (isKeyDoctorCase && isAyesha) return { choices: correct };

  const knows = random() < ability - DIFFICULTY_PENALTY[row.difficulty];
  if (knows) return { choices: correct };
  if (isKeyDoctorCase && random() < MISCONCEPTION_CHANCE) return { choices: row.answer_key ?? [] };

  const wrong = ids.filter((id) => !correct.includes(id));
  if (row.kind === "multiple") return { choices: [...correct.slice(1), ...wrong.slice(0, 1)] };
  return { choices: [wrong[Math.floor(random() * wrong.length)] ?? ids[0] ?? "a"] };
}

function objectiveMarks(row: PaperRow, response: ChosenAnswer): number {
  const choices = response?.choices ?? [];
  const key = row.answer_key ?? [];
  if (row.kind === "single") return choices.length === 1 && key.includes(choices[0] ?? "") ? row.marks : 0;
  const right = choices.filter((choice) => key.includes(choice)).length;
  const wrong = choices.length - right;
  if (row.multiple_rule === "all_or_nothing") return right === key.length && wrong === 0 ? row.marks : 0;
  return Math.round(Math.max(0, (right - wrong) / key.length) * row.marks * 100) / 100;
}

async function insertAll(table: string, rows: object[]): Promise<void> {
  if (rows.length === 0) return;
  unwrap(await db().from(table).insert(rows));
}

// Fills one institution with the world in hack/architecture.md "Sample data".
export async function seedWorld(context: WorldContext): Promise<void> {
  const nowMs = Date.now();
  const owned = { user_id: context.ownerId, institution_id: context.institutionId };

  const candidates = ROSTER.map((entry, index) => ({
    ...owned,
    id: randomUUID(),
    full_name: entry.name,
    roll_number: entry.roll,
    email: index === 0 ? context.ayeshaEmail.toLowerCase() : index === 1 ? context.bilalEmail.toLowerCase() : emailFor(entry.name),
    cnic_masked: cnicFor(index),
    extra_time_pct: entry.extraTimePct ?? 0,
  }));
  const questions = buildQuestions(context, nowMs);
  const questionByKey = new Map(questions.map((question) => [question.bankKey, question]));
  const paperItems = (plan: ExamPlan) =>
    plan.questions.flatMap((key, index) => {
      const question = questionByKey.get(key);
      return question ? [{ position: index + 1, question: questionRow(question) }] : [];
    });

  const exams = EXAMS.map((plan) => ({
    plan,
    row: {
      ...owned,
      id: randomUUID(),
      title: plan.title,
      instructions: plan.instructions,
      opens_at: at(nowMs, plan.opensInMs),
      closes_at: at(nowMs, plan.closesInMs),
      duration_minutes: plan.durationMinutes,
      total_marks: plan.totalMarks,
      shuffle_questions: plan.shuffleQuestions,
      shuffle_options: plan.shuffleOptions,
      status: plan.status,
      published_at: plan.status === "published" ? at(nowMs, plan.opensInMs - MS_PER_DAY) : null,
      results_published_at: plan.resultsPublished ? at(nowMs, plan.closesInMs + MS_PER_DAY) : null,
      settings: {},
    },
  }));

  await Promise.all([insertAll("candidates", candidates), insertAll("questions", questions.map(questionRow))]);
  await insertAll("exams", exams.map(({ row }) => row));

  const examQuestions = exams.flatMap(({ plan, row }) =>
    paperItems(plan).map(({ position, question }) => ({ ...owned, exam_id: row.id, question_id: question.id, position })),
  );
  const enrollments = exams.flatMap(({ plan, row }) => {
    const enrolled = plan.slug === "quiz1" || plan.slug === "pretest" ? candidates.slice(0, SAT_PAST_EXAMS) : candidates;
    return enrolled.map((candidate) => ({ ...owned, exam_id: row.id, candidate_id: candidate.id }));
  });

  const attempts: object[] = [];
  const attemptQuestions: object[] = [];
  const answers: object[] = [];
  const grades: object[] = [];
  const results: object[] = [];

  for (const { plan, row: exam } of exams.filter(({ plan }) => plan.slug === "quiz1" || plan.slug === "pretest")) {
    const items = paperItems(plan);

    candidates.slice(0, SAT_PAST_EXAMS).forEach((candidate, index) => {
      const entry = ROSTER[index];
      if (!entry) return;
      const attemptId = randomUUID();
      const seed = (index + 1) * 7919 + plan.questions.length;
      const random = seededRandom(seed);
      const startedMs = new Date(exam.opens_at).getTime() + MS_PER_HOUR + index * 2 * MS_PER_MINUTE;
      const usedMinutes = Math.min(plan.durationMinutes - 1, Math.round(plan.durationMinutes * (0.55 + random() * 0.4)));
      const submittedMs = startedMs + usedMinutes * MS_PER_MINUTE;
      const paper = buildPaper(exam, items, seed);

      attempts.push({
        ...owned,
        id: attemptId,
        exam_id: exam.id,
        candidate_id: candidate.id,
        is_sandbox: false,
        status: "submitted",
        seed,
        started_at: at(startedMs, 0),
        deadline_at: at(startedMs, plan.durationMinutes * (1 + (entry.extraTimePct ?? 0) / 100) * MS_PER_MINUTE),
        credit_seconds: 0,
        submitted_at: at(submittedMs, 0),
        receipt_code: newReceiptCode(),
        last_seen_at: at(submittedMs, 0),
      });

      const breakdown: { position: number; question_id: string; marks_awarded: number; marks: number }[] = [];
      paper.forEach((paperRow, paperIndex) => {
        attemptQuestions.push({ ...owned, attempt_id: attemptId, ...paperRow });
        const truth = questions.find((question) => question.id === paperRow.question_id)?.trueAnswer ?? null;
        const response = chooseAnswer(paperRow, truth, entry.ability, random, index === 0);
        if (response) {
          answers.push({
            ...owned,
            attempt_id: attemptId,
            question_id: paperRow.question_id,
            response,
            marked_for_review: false,
            client_seq: paperIndex + 1,
            saved_offline: false,
            received_at: at(startedMs, ((paperIndex + 1) / paper.length) * usedMinutes * MS_PER_MINUTE),
          });
        }
        if (!plan.resultsPublished) return;
        const marksAwarded = objectiveMarks(paperRow, response);
        grades.push({ ...owned, attempt_id: attemptId, question_id: paperRow.question_id, marks_awarded: marksAwarded, source: "auto" });
        breakdown.push({ position: paperRow.position, question_id: paperRow.question_id, marks_awarded: marksAwarded, marks: paperRow.marks });
      });

      if (!plan.resultsPublished) return;
      results.push({
        ...owned,
        exam_id: exam.id,
        attempt_id: attemptId,
        candidate_id: candidate.id,
        version: 1,
        total: breakdown.reduce((sum, line) => sum + line.marks_awarded, 0),
        max_total: plan.totalMarks,
        breakdown,
        reason: null,
        is_current: true,
        verify_code: newVerifyCode(),
        published_at: exam.results_published_at,
      });
    });
  }

  await Promise.all([insertAll("exam_questions", examQuestions), insertAll("enrollments", enrollments), insertAll("attempts", attempts)]);
  await Promise.all([insertAll("attempt_questions", attemptQuestions), insertAll("answers", answers), insertAll("grades", grades)]);
  await insertAll("results", results);
}
