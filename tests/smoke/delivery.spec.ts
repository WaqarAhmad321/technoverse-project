import { expect, test } from "./account";

test("a candidate sees her exams and results, and anyone can verify a result", async ({ page, world }) => {
  const { candidatePage } = world;

  await candidatePage.goto("/exams");
  const openNow = candidatePage.getByRole("region", { name: "Open now" });
  await expect(openNow.getByText("Waves Practice Quiz")).toBeVisible();
  await expect(candidatePage.getByRole("region", { name: "Completed" }).getByText("Physics Pre-test")).toBeVisible();
  await expect(candidatePage.getByText("Physics Midterm")).toHaveCount(0);

  await candidatePage.goto("/results");
  await candidatePage.getByRole("link", { name: /Physics Pre-test/ }).click();
  await expect(candidatePage.getByRole("heading", { level: 1 })).toHaveText("Physics Pre-test");
  const verifyCode = (await candidatePage.getByText(/^[A-Z0-9]{10}$/).textContent()) ?? "";

  await candidatePage.goto("/admin/people");
  await expect(candidatePage.getByRole("heading", { name: "This page does not exist" })).toBeVisible();

  await page.goto("/monitor");
  await page.getByRole("link", { name: /Waves Practice Quiz/ }).click();
  await expect(page.getByRole("cell", { name: "Ayesha Khan" })).toBeVisible();

  await page.goto("/admin/people");
  await expect(page.getByRole("cell", { name: "Ayesha Khan" })).toBeVisible();

  const visitor = await page.context().browser()?.newPage();
  await visitor?.goto(`/verify/${verifyCode}`);
  await expect(visitor!.getByRole("heading", { name: "Valid result" })).toBeVisible();
  await expect(visitor!.getByText("A. K.")).toBeVisible();
  await visitor?.close();
});
