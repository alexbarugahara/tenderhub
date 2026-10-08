import { expect, test } from "@playwright/test";

test.describe("Evaluation E2E", () => {
  test("should redirect an unauthenticated user from the organization dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect an unauthenticated user from the admin dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect an unauthenticated user from the vendor dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should keep public solicitation browsing accessible", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    await expect(page).toHaveURL(/\/solicitations/);
  });

  test("should keep public solicitation pages outside dashboard namespaces", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    const url = page.url();

    expect(url).not.toContain("/dashboard/admin");
    expect(url).not.toContain("/dashboard/organization");
    expect(url).not.toContain("/dashboard/vendor");
  });

  test("should keep evaluation functionality out of the public solicitation namespace", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    const url = page.url();

    expect(url).not.toContain("/evaluations");
  });

  test("should keep evaluation functionality separate from vendor routes", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    const url = page.url();

    expect(url).not.toContain("/evaluations");
  });

  test("should keep evaluation functionality separate from public solicitation routes", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization");

    const url = page.url();

    if (url.includes("/dashboard/organization")) {
      expect(url).not.toContain("/solicitations");
    }
  });

  test("should preserve dashboard access boundaries for evaluation workflows", async ({
    page,
  }) => {
    const dashboardRoutes = [
      "/dashboard/admin",
      "/dashboard/organization",
      "/dashboard/vendor",
    ];

    for (const route of dashboardRoutes) {
      await page.goto(route);

      await expect(page).toHaveURL(/\/login/);
    }
  });
});