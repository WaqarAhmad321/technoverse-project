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
