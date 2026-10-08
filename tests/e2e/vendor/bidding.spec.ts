import { expect, test } from "@playwright/test";

test.describe("Vendor bidding E2E", () => {
  test("should redirect an unauthenticated user away from the vendor dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should keep vendor dashboard access separate from organization access", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    const url = page.url();

    expect(url).not.toContain("/dashboard/organization");
  });

  test("should keep vendor dashboard access separate from admin access", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    const url = page.url();

    expect(url).not.toContain("/dashboard/admin");
  });

  test("should allow public access to solicitation listings", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    await expect(page).toHaveURL(/\/solicitations/);
  });

  test("should keep public solicitation browsing outside the vendor dashboard", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    expect(page.url()).not.toContain("/dashboard/vendor");
  });

  test("should keep a vendor bidding workflow separate from organization procurement routes", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    expect(page.url()).not.toContain("/dashboard/organization");
  });

  test("should not expose vendor bidding functionality through the admin dashboard route", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    expect(page.url()).not.toContain("/dashboard/admin");
  });

  test("should preserve the solicitation URL when browsing available opportunities", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    const url = page.url();

    expect(url).toMatch(/\/solicitations/);
    expect(url).not.toContain("/dashboard/vendor");
  });
});