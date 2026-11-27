import { expect, test } from "./account";

test("an examiner adds a question to the bank and edits it", async ({ page, account }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(account.name);
  await page.goto("/questions");
  await expect(page.getByRole("heading", { name: "Question bank" })).toBeVisible();
  await page.getByRole("link", { name: "Add question" }).first().click();

  // The form switches its fields once it has hydrated, so retry the choice until it takes.
  await expect(async () => {
    await page.getByLabel("Kind").selectOption("multiple");
    await expect(page.getByText("max(0, (right − wrong) / keyed) × marks")).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await page.getByLabel("Kind").selectOption("single");

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
  await page.getByLabel(/^Marks out of/).fill("4");
  await page.getByRole("button", { name: "Save and next" }).click();
  await expect(page.getByText("Marking in progress (1 of 30 written answers)")).toBeVisible();
});

test("the key check flags Q7, blocks publishing, and a key change regrades everyone", async ({ page, account }) => {
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
