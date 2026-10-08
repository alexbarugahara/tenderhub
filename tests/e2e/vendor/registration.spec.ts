import { expect, test } from "@playwright/test";

test.describe("Vendor registration E2E", () => {
  test("should allow an unauthenticated user to access the login page", async ({
    page,
  }) => {
    await page.goto("/login");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect an unauthenticated user away from the vendor dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should keep vendor dashboard routes separate from organization routes", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    const url = page.url();

    expect(url).not.toContain("/dashboard/organization");
  });

  test("should keep vendor dashboard routes separate from admin routes", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    const url = page.url();

    expect(url).not.toContain("/dashboard/admin");
  });

  test("should keep vendor registration distinct from vendor dashboard access", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    await expect(page).toHaveURL(/\/login/);

    expect(page.url()).not.toContain("/dashboard/vendor");
  });

  test("should preserve the public solicitation route as accessible without vendor authentication", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    await expect(page).toHaveURL(/\/solicitations/);
  });

  test("should keep public solicitation browsing separate from the vendor dashboard", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    expect(page.url()).not.toContain("/dashboard/vendor");
  });
});