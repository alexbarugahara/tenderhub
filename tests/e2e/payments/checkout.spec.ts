import { expect, test } from "@playwright/test";

test.describe("Payment checkout E2E", () => {
  test("should redirect an unauthenticated user from the dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect an unauthenticated user from the vendor dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    await expect(page).toHaveURL(/\/login/);
  });

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

  test("should keep public solicitation browsing accessible", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    await expect(page).toHaveURL(/\/solicitations/);
  });

  test("should keep payment functionality outside the public solicitation listing", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    const url = page.url();

    expect(url).not.toContain("/checkout");
    expect(url).not.toContain("/payments");
  });

  test("should keep checkout functionality separate from the vendor dashboard route", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    const url = page.url();

    expect(url).not.toContain("/checkout");
    expect(url).not.toContain("/payments");
  });

  test("should keep checkout functionality separate from the organization dashboard route", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization");

    const url = page.url();

    expect(url).not.toContain("/checkout");
    expect(url).not.toContain("/payments");
  });

  test("should preserve the login route for unauthenticated checkout access", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should not expose checkout through the admin dashboard namespace", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");

    const url = page.url();

    expect(url).not.toContain("/checkout");
    expect(url).not.toContain("/payments");
  });
});