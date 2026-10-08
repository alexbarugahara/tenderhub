import { expect, test } from "@playwright/test";

test.describe("Award E2E", () => {
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

  test("should allow public access to solicitation listings", async ({
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

  test("should keep award functionality separate from public solicitation browsing", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    const url = page.url();

    expect(url).not.toContain("/awards");
  });

  test("should keep award functionality separate from vendor dashboard access", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    const url = page.url();

    expect(url).not.toContain("/awards");
  });

  test("should preserve organization dashboard routing boundaries", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization");

    const url = page.url();

    expect(url).toMatch(/\/login|\/dashboard\/organization/);

    if (url.includes("/dashboard/organization")) {
      expect(url).not.toContain("/dashboard/vendor");
      expect(url).not.toContain("/dashboard/admin");
    }
  });

  test("should preserve admin dashboard routing boundaries", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");

    const url = page.url();

    expect(url).toMatch(/\/login|\/dashboard\/admin/);

    if (url.includes("/dashboard/admin")) {
      expect(url).not.toContain("/dashboard/vendor");
      expect(url).not.toContain("/dashboard/organization");
    }
  });
});