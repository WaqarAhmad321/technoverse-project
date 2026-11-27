import { expect, test } from "./account";

test("a visitor gets into the product with one click on the demo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).click();

  await expect(page).toHaveURL(/\/home$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome");
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
