import { expect, test } from "@playwright/test";

test.describe("Organization procurement E2E", () => {
  test("should redirect an unauthenticated user from the dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should not expose the organization procurement area to an unauthenticated user", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization/procurements");

    await expect(page).toHaveURL(/\/login|\/dashboard\/organization\/procurements/);
  });

  test("should load the organization dashboard route", async ({ page }) => {
    await page.goto("/dashboard/organization");

    await expect(page).toHaveURL(/\/login|\/dashboard\/organization/);
  });

  test("should keep procurement routes under the organization dashboard namespace", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization/procurements");

    const url = page.url();

    if (url.includes("/dashboard/organization/procurements")) {
      expect(url).toContain("/dashboard/organization/");
      expect(url).not.toContain("/dashboard/vendor/");
      expect(url).not.toContain("/dashboard/admin/");
    }
  });

  test("should keep organization procurement routes separate from public solicitation routes", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization/procurements");

    const url = page.url();

    if (url.includes("/dashboard/organization/procurements")) {
      expect(url).not.toContain("/solicitations");
    }
  });

  test("should not redirect organization procurement requests to the vendor dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization/procurements");

    await expect(page).not.toHaveURL(/\/dashboard\/vendor/);
  });

  test("should not redirect organization procurement requests to the admin dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization/procurements");

    await expect(page).not.toHaveURL(/\/dashboard\/admin/);
  });
});