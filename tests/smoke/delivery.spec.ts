import { expect, test } from "./account";

const SYNC_AFTER_OUTAGE_MS = 20_000;
// Starting builds the candidate's paper: several database round trips, slow from a laptop far from the database.
const START_EXAM_MS = 15_000;
// A save runs several database round trips plus a re-render: seconds from a laptop, not a fault.
const SAVE_MS = 15_000;

test("a candidate sits an exam: answers survive a reload and an outage, and one submit gives one receipt", async ({ world }) => {
  const { candidatePage: page } = world;

  await page.goto("/exams");
  await page.getByRole("region", { name: "Open now" }).getByRole("link", { name: "Start exam" }).click();
  await page.getByRole("button", { name: "Start exam" }).click();
  await expect(page).toHaveURL(/\/take$/, { timeout: START_EXAM_MS });

  const options = page.getByRole("group", { name: "Options" });
  await options.locator("label").first().click();
  await expect(page.getByText("All answers saved")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("group", { name: "Options" }).locator("input").first()).toBeChecked();
  await expect(page.getByRole("button", { name: /^Question 1, answered/ })).toBeVisible();

  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("group", { name: "Options" }).locator("label").first().click();
  await expect(page.getByText(/^Offline: 1 answer kept on this phone/)).toBeVisible();
  await page.context().setOffline(false);
  await expect(page.getByText("All answers saved")).toBeVisible({ timeout: SYNC_AFTER_OUTAGE_MS });

  await page.getByRole("button", { name: /^Question 5,/ }).click();
  await page.getByRole("button", { name: "Finish exam" }).click();
  await page.getByRole("button", { name: "Submit exam" }).dblclick();
  await expect(page).toHaveURL(/\/receipt$/, { timeout: START_EXAM_MS });
  const receiptCode = await page.getByText(/^IMT-[A-Z0-9]{6}$/).textContent();
  await expect(page.getByText("2 of 5 questions")).toBeVisible();

  await page.reload();
  await expect(page.getByText(/^IMT-[A-Z0-9]{6}$/)).toHaveText(receiptCode ?? "");
  await page.goto("/exams");
  await expect(page.getByRole("region", { name: "Completed" }).getByText("Waves Practice Quiz")).toBeVisible();
});

test("a candidate sees only her published results, and anyone can verify one", async ({ page, world }) => {
  const { candidatePage } = world;

  await candidatePage.goto("/results");
  await candidatePage.getByRole("link", { name: /Physics Pre-test/ }).click();
  await expect(candidatePage.getByRole("heading", { level: 1 })).toHaveText("Physics Pre-test");
  const verifyCode = (await candidatePage.locator("span.font-mono").first().textContent()) ?? "";
  const pdf = await candidatePage.request.get(`${new URL(candidatePage.url()).pathname}/pdf`);
  expect(pdf.headers()["content-type"]).toBe("application/pdf");

  await candidatePage.goto("/admin/people");
  await expect(candidatePage.getByRole("heading", { name: "This page does not exist" })).toBeVisible();

  await page.goto("/monitor");
  await page.getByRole("link", { name: /Waves Practice Quiz/ }).click();
  await expect(page.getByRole("cell", { name: "Ayesha Khan" })).toBeVisible();
  await page.getByLabel("Message").fill("Q2: take the speed of sound as 340 m/s.");
  await page.getByRole("button", { name: "Send announcement" }).click();
  await expect(page.getByText("Sent. Candidates see it within a few seconds.")).toBeVisible();

  const visitor = await page.context().browser()?.newPage();
  if (!visitor) throw new Error("Could not open a signed-out page.");
  await visitor.goto(`/verify/${verifyCode}`);
  await expect(visitor.getByRole("heading", { name: "Valid result" })).toBeVisible();
  await expect(visitor.getByText("A. K.")).toBeVisible();
  await visitor.close();
});

test("the institution admin makes a candidate an examiner, but cannot drop her own admin role", async ({ page, world }) => {
  await page.goto("/admin/people");
  await page.getByRole("button", { name: "Change roles for Ayesha Khan" }).click();
  await page.getByRole("checkbox", { name: /^Examiner/ }).check();
  await page.getByRole("button", { name: "Save roles" }).click();
  await expect(page.getByRole("row", { name: /Ayesha Khan/ }).getByText("Candidate, Examiner")).toBeVisible({ timeout: SAVE_MS });

  await page.getByRole("button", { name: `Change roles for ${world.examiner.name}` }).click();
  await page.getByRole("checkbox", { name: /^Admin/ }).uncheck();
  await page.getByRole("button", { name: "Save roles" }).click();
  await expect(page.getByRole("alert")).toContainText("Make someone else an admin first", { timeout: SAVE_MS });
  await page.getByRole("button", { name: "Cancel" }).click();

  // The world's accounts are shared by every test on this worker: put Ayesha back as she was.
  await page.getByRole("button", { name: "Change roles for Ayesha Khan" }).click();
  await page.getByRole("checkbox", { name: /^Examiner/ }).uncheck();
  await page.getByRole("button", { name: "Save roles" }).click();
  await expect(page.getByRole("row", { name: /Ayesha Khan/ }).getByText("Candidate", { exact: true })).toBeVisible({ timeout: SAVE_MS });

  await page.goto("/admin/audit");
  await expect(page.getByText("Changed someone's roles").first()).toBeVisible();
  await page.getByRole("button", { name: "Verify chain" }).click();
  await expect(page.getByText(/events verified/)).toBeVisible({ timeout: SAVE_MS });
});

test("an examiner previews a draft exam as a candidate, and it is not recorded", async ({ page, world }) => {
  expect(world.examiner.email).toContain("@");
  await page.goto("/manage");
  await page.getByRole("link", { name: /Physics Midterm/ }).first().click();
  await page.getByRole("link", { name: "Preview as candidate" }).click();
  await expect(page.getByText("Preview: nothing you do here is recorded as a real attempt.")).toBeVisible();
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Question 13,/ })).toBeVisible();
});
