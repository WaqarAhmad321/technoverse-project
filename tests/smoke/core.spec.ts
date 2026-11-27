import { expect, test } from "./account";

// The very first click builds the shared demo institution, which takes a few seconds.
const FIRST_DEMO_SIGN_IN_MS = 30_000;

const DEMO_ROLES = [
  { button: "Try as examiner", name: "Kamran Siddiqui" },
  { button: "Try as candidate", name: "Ayesha Khan" },
  { button: "Try as admin", name: "Sana Iqbal" },
];

test("each demo role gets into Ravi Science College with one click", async ({ page }) => {
  for (const { button, name } of DEMO_ROLES) {
    await page.goto("/");
    await page.getByRole("button", { name: button }).click();

    await expect(page).toHaveURL(/\/home$/, { timeout: FIRST_DEMO_SIGN_IN_MS });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(name);
    await expect(page.getByRole("main").getByText("Ravi Science College, Lahore")).toBeVisible();

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/$/);
  }
});

test("a signed-out visitor is sent to sign in", async ({ page }) => {
  await page.goto("/home");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("a new person creates an account, changes their name and signs out", async ({ page, account }) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(account.name);

  await page.goto("/account");
  await page.getByLabel("Your name").fill("Hana Idris-Khan");
  await page.getByRole("button", { name: "Save name" }).click();
  await expect(page.getByRole("status")).toHaveText("Your name is saved.");

  await page.goto("/home");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hana Idris-Khan");

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.goto("/home");
  await expect(page).toHaveURL(/\/login$/);
});
