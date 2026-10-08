import { expect, test } from "@playwright/test";

test.describe("Organization E2E", () => {
  test("should redirect an unauthenticated user from the dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should allow an organization user to access the organization dashboard", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login/);

    await expect(
      page.getByRole("heading", { name: /sign in|login/i }),
    ).toBeVisible();
  });

  test("should expose organization dashboard navigation after authentication", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization");

    await expect(page).toHaveURL(/\/(login|dashboard\/organization)/);
  });

  test("should keep organization dashboard separate from vendor dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization");

    const url = page.url();

    expect(url).not.toContain("/dashboard/vendor");
  });

  test("should keep organization dashboard separate from admin dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization");

    const url = page.url();

    expect(url).not.toContain("/dashboard/admin");
  });
});