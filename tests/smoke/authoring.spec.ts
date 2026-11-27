import { expect, test } from "./account";

test("an examiner adds a question to the bank and edits it", async ({ page, account }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(account.name);
  await page.goto("/questions");
  await expect(page.getByRole("heading", { name: "Question bank" })).toBeVisible();
  await page.getByRole("link", { name: "Add question" }).first().click();

  // The form switches its fields once it has hydrated, so retry the choice until it takes.
  await expect(async () => {
    await page.getByLabel("Kind").click({ timeout: 2_000 });
    await page.getByRole("option", { name: /multiple/i }).click({ timeout: 2_000 });
    await expect(page.getByText("max(0, (right − wrong) / keyed) × marks")).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByLabel("Kind").click();
  await page.getByRole("option", { name: /single/i }).click();

  await page.getByLabel("Marks").fill("5");
  await page.getByLabel("Topic").fill("Kinematics");
  await page.getByLabel("Question", { exact: true }).fill("A cyclist covers 300 m in 60 s. What is her average speed?");
  const answers = ["2 m/s", "5 m/s", "10 m/s", "18 m/s"];
  for (const [index, text] of answers.entries()) {
    await page.getByLabel(`Option ${"ABCD"[index]}`, { exact: true }).fill(text);
  }
  await page.getByLabel("Option A is correct").check();
  await page.getByLabel("Option B is correct").check();
  await expect(page.getByLabel("Option A is correct")).not.toBeChecked();

  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page).toHaveURL(/\/questions\?added=/);
  await page.getByRole("link", { name: /A cyclist covers 300 m/ }).click();
  await expect(page.getByText("Version 1.")).toBeVisible();

  await page.getByLabel("Marks").fill("0");
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(page.getByText("Marks must be a whole number")).toBeVisible();

  await page.getByLabel("Marks").fill("4");
  await page.getByRole("button", { name: "Save question" }).click();
  await expect(page.getByText("Saved as version 2.")).toBeVisible();
});

test("an examiner creates an exam and builds its paper from the bank", async ({ page, account }) => {
  test.setTimeout(90_000);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(account.name);
  await page.goto("/manage/new");
  await page.getByLabel("Title").fill("Physics Final");
  await page.getByLabel("Duration in minutes").fill("60");
  await page.getByLabel("Total marks").fill("50");
  await page.getByLabel("Closes (Pakistan time)").fill("2020-01-01T09:00");
  await page.getByRole("button", { name: "Create exam" }).click();
  await expect(page.getByText("The closing time must be after the opening time.")).toBeVisible();

  await page.reload();
  await page.getByLabel("Title").fill("Physics Final");
  await page.getByRole("button", { name: "Create exam" }).click();
  await expect(page.getByRole("heading", { name: "Physics Final" })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("0 of 50 marks")).toBeVisible();

  const addButtons = page.getByRole("button", { name: /^Add to exam:/ });
  const paper = page.getByRole("list", { name: "Questions on this paper" });
  for (let added = 0; added < 5; added += 1) {
    await addButtons.first().click();
    await expect(paper.getByRole("listitem")).toHaveCount(added + 1, { timeout: 15_000 });
  }
  const paperMarks = await paper.getByText(/· \d+ marks?$/).allInnerTexts();
  const sum = paperMarks.reduce((total, line) => total + Number(line.match(/(\d+) marks?$/)?.[1] ?? 0), 0);
  await expect(page.getByText(`${sum} of 50 marks`)).toBeVisible();

  await page.goto("/manage");
  await expect(page.getByRole("link", { name: /Physics Final/ })).toContainText("Draft");
});

test("an examiner adds a candidate to the roster and enrolls them", async ({ page, account }) => {
  test.setTimeout(90_000);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(account.name);
  await page.goto("/roster");
  await page.getByText("Add candidate").first().click();

  const fillCandidate = async (roll: string, cnic: string) => {
    await page.getByLabel("Full name").fill("Hamza Riaz");
    await page.getByLabel("Roll number").fill(roll);
    await page.getByLabel("Email").fill("Hamza.Riaz@example.pk");
    await page.getByLabel("CNIC").fill(cnic);
    await page.getByRole("button", { name: "Add candidate" }).click();
  };

  await fillCandidate("0245", "35202-123");
  await expect(page.getByText("CNIC must have 13 digits")).toBeVisible();
  await fillCandidate("0231", "35202-1234567-3");
  await expect(page.getByText("Roll number 0231 is already on the roster.")).toBeVisible({ timeout: 15_000 });
  await fillCandidate("0245", "35202-1234567-3");
  await expect(page.getByText("Hamza Riaz is on the roster.")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("list", { name: "Roster" })).toContainText("hamza.riaz@example.pk");
  await expect(page.getByRole("list", { name: "Roster" })).toContainText("35202-•••••••-3");

  await page.goto("/manage");
  await page.getByRole("link", { name: /Physics Midterm/ }).click();
  await page.getByRole("link", { name: "Candidates" }).click();
  await expect(page.getByRole("heading", { name: "31 enrolled" })).toBeVisible();
  await page.getByRole("button", { name: "Enroll Hamza Riaz" }).click();
  await expect(page.getByRole("heading", { name: "32 enrolled" })).toBeVisible({ timeout: 15_000 });
});

test("the publish checklist blocks a wrong total, then the candidate sees the published exam", async ({ page, accountCandidate }) => {
  test.setTimeout(90_000);
  await page.goto("/manage");
  await page.getByRole("link", { name: /Physics Midterm/ }).click();
  const examSections = page.getByRole("navigation", { name: "Exam sections" });
  await examSections.getByRole("link", { name: "Review and publish" }).click();

  const checklist = page.getByRole("list", { name: "Publish checklist" });
  await expect(checklist).toContainText("Questions add up to 45 marks, the exam says 50");
  await expect(page.getByRole("button", { name: "Publish exam" })).toBeDisabled();

  await examSections.getByRole("link", { name: "Questions" }).click();
  await page.getByRole("button", { name: /^Add to exam: A stone is thrown horizontally/ }).click();
  await expect(page.getByText("50 of 50 marks")).toBeVisible({ timeout: 15_000 });

  await examSections.getByRole("link", { name: "Review and publish" }).click();
  await expect(checklist).toContainText("Questions add up to 50 marks");
  await expect(checklist.getByLabel("Fails")).toHaveCount(0);
  await page.getByRole("button", { name: "Publish exam" }).click();
  await expect(page.getByRole("heading", { name: "Published" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/^Open now ·/)).toBeVisible();

  await accountCandidate.goto("/exams");
  await expect(accountCandidate.getByRole("region", { name: "Open now" })).toContainText("Physics Midterm");
});

test("opening a closed exam marks every objective answer, and marking again changes nothing", async ({ page, account }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(account.name);
  await page.goto("/manage");
  await page.getByRole("link", { name: /Physics Quiz 1/ }).click();
  await page.getByRole("link", { name: "Open marking" }).click();
  await expect(page.getByText(/^30 attempts · \d+ objective answers marked/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("list", { name: "Question analytics" })).toContainText("Q7");
  const attempts = page.getByRole("list", { name: "Attempts" });
  const before = await attempts.innerText();
  await page.getByRole("button", { name: "Mark objective answers" }).click();
  await page.reload();
  await expect(attempts).toBeVisible();
  expect(await attempts.innerText()).toBe(before);
});

test("an examiner marks a written answer and cannot go over the question's marks", async ({ page, account }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(account.name);
  await page.goto("/manage");
  await page.getByRole("link", { name: /Physics Quiz 1/ }).click();
  await page.getByRole("link", { name: "Open marking" }).click();
  await expect(page.getByText("Marking in progress (0 of 30 written answers)")).toBeVisible({ timeout: 20_000 });
  await page.getByLabel(/^Marks out of/).fill("7");
  await page.getByRole("button", { name: "Save and next" }).click();
  await expect(page.getByText("This question is worth 5 marks.")).toBeVisible();
  await expect(page.getByLabel("AI second marker")).toContainText("AI second marker: 2.5 of 5.");
  await page.getByLabel(/^Marks out of/).fill("4");
  await page.getByRole("button", { name: "Save and next" }).click();
  await expect(page.getByText("Marking in progress (1 of 30 written answers)")).toBeVisible();
  await expect(page.getByRole("list", { name: "Needs a second look" })).toContainText("you gave 4, the AI gave 2.5 of 5");
});

test("the key check flags Q7, blocks publishing, and a key change regrades everyone", async ({ page, freshAccount: account }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(account.name);
  await page.goto("/manage");
  await page.getByRole("link", { name: /Physics Quiz 1/ }).click();
  await page.getByRole("link", { name: "Open marking" }).click();
  const flags = page.getByRole("list", { name: "Flagged questions" });
  await expect(flags).toContainText(/Q7: \d+% of the top scorers chose B, the key says C\./, { timeout: 20_000 });
  await expect(page.getByRole("button", { name: "Publish results" })).toBeDisabled();
  const ayesha = page.getByRole("list", { name: "Attempts" }).getByRole("listitem").filter({ hasText: "Ayesha Khan" });
  const before = Number((await ayesha.innerText()).match(/([\d.]+) of \d+ marks/)?.[1]);

  await page.getByLabel("Reason (shown on results)").fill("Top scorers chose B; B is correct");
  await page.getByRole("button", { name: "Change key to B" }).click();
  await expect(page.getByText("No answer key looks wrong.")).toBeVisible({ timeout: 20_000 });
  const after = Number((await ayesha.innerText()).match(/([\d.]+) of \d+ marks/)?.[1]);
  expect(after).toBeGreaterThan(before);

  await expect(page.getByText("Exam summary")).toBeVisible();
  await page.getByRole("button", { name: "Publish results" }).click();
  await expect(page.getByText(/^Results published/)).toBeVisible({ timeout: 20_000 });
});

test("a candidate import lists bad rows and saves nothing until the file is clean", async ({ page, account }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(account.name);
  await page.goto("/roster/import");
  const rows = page.getByLabel("Rows (you can paste or fix them here)");
  const header = "full_name,roll_number,email,cnic,extra_time_pct";
  await rows.fill(`${header}\nZainab Malik,0301,not-an-email,35202-4567890-2,0\nUsman Ghani,0231,usman@example.pk,35201-7654321-5,0`);
  await page.getByRole("button", { name: "Check file" }).click();
  await expect(page.getByText("0 rows ready, 2 rows with problems")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("list", { name: "Import problems" })).toContainText("Row 3: Roll number 0231 is already on the roster.");

  await rows.fill(`${header}\nZainab Malik,0301,zainab@example.pk,35202-4567890-2,0\nUsman Ghani,0302,usman@example.pk,35201-7654321-5,25`);
  await page.getByRole("button", { name: "Check file" }).click();
  await page.getByRole("button", { name: "Import 2 candidates" }).click();
  await expect(page.getByText("Imported 2 candidates.")).toBeVisible({ timeout: 15_000 });
});

test("a question import reports a key outside the options, then imports an Urdu question", async ({ page, account }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(account.name);
  await page.goto("/questions/import");
  const urdu = "توانائی کی بچت کے دو طریقے لکھیں۔";
  const file = (answer: string) =>
    JSON.stringify([
      { topic: "Waves", difficulty: "easy", kind: "single", marks: 2, body: "What is the unit of frequency?", options: ["Hertz", "Metre"], answer: [answer] },
      { topic: "Energy", difficulty: "medium", kind: "written", marks: 5, body: urdu, rubric: "2.5 marks for each sensible way." },
    ]);
  const rows = page.getByLabel("Questions (you can paste or fix them here)");
  await rows.fill(file("e"));
  await page.getByRole("button", { name: "Check file" }).click();
  await expect(page.getByRole("list", { name: "Import problems" })).toContainText("Question 1: A single-answer question needs exactly one correct option.", { timeout: 15_000 });
  await rows.fill(file("a"));
  await page.getByRole("button", { name: "Check file" }).click();
  await page.getByRole("button", { name: "Import 2 questions" }).click();
  await expect(page.getByText("Imported 2 questions.")).toBeVisible({ timeout: 15_000 });
  await page.goto("/questions");
  await expect(page.getByText(urdu)).toBeVisible();
});

test("a candidate challenges a question and the examiner decides it", async ({ page, world }) => {
  const { candidatePage } = world;
  await candidatePage.goto("/results");
  await candidatePage.getByRole("link", { name: /Physics Pre-test/ }).click();
  await candidatePage.getByRole("link", { name: "Challenge a question" }).click();
  await candidatePage.getByLabel("Question").click();
  await candidatePage.getByRole("option").first().click();
  await candidatePage.getByLabel("What is wrong with it?").fill("Two of the options say the same thing in different words.");
  await candidatePage.getByRole("button", { name: "Send challenge" }).click();
  await expect(candidatePage).toHaveURL(/\/results\//, { timeout: 15_000 });

  await page.goto("/disputes");
  await page.getByRole("list", { name: "Challenges" }).getByRole("link").first().click();
  await page.getByLabel("Reason (the candidate sees it)").fill("The options are clearly different; the key stands.");
  await page.getByRole("button", { name: "Reject" }).click();
  await expect(page.getByRole("list", { name: "Challenges" })).toContainText("Rejected", { timeout: 15_000 });
});
