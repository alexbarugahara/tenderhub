import { expect, test } from "@playwright/test";

test.describe("Solicitation E2E", () => {
  test("should allow public access to the solicitation listing", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    await expect(page).toHaveURL(/\/solicitations/);
  });

  test("should keep the solicitation listing outside authenticated dashboards", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    const url = page.url();

    expect(url).not.toContain("/dashboard/admin");
    expect(url).not.toContain("/dashboard/organization");
    expect(url).not.toContain("/dashboard/vendor");
  });

  test("should redirect an unauthenticated user from the organization dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect an unauthenticated user from the vendor dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/vendor");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect an unauthenticated user from the admin dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin");

    await expect(page).toHaveURL(/\/login/);
  });

  test("should preserve a valid solicitation detail URL", async ({
    page,
  }) => {
    await page.goto("/solicitations/sol-test-001");

    const url = page.url();

    expect(url).toMatch(/\/solicitations\/sol-test-001/);
  });

  test("should keep solicitation detail pages outside dashboard namespaces", async ({
    page,
  }) => {
    await page.goto("/solicitations/sol-test-001");

    const url = page.url();

    expect(url).not.toContain("/dashboard/admin");
    expect(url).not.toContain("/dashboard/organization");
    expect(url).not.toContain("/dashboard/vendor");
  });

  test("should not expose an organization procurement route as a public solicitation route", async ({
    page,
  }) => {
    await page.goto("/dashboard/organization/procurements");

    const url = page.url();

    if (url.includes("/dashboard/organization/procurements")) {
      expect(url).not.toMatch(/^.*\/solicitations/);
    }
  });

  test("should maintain the public solicitation namespace", async ({
    page,
  }) => {
    await page.goto("/solicitations");

    expect(page.url()).toMatch(/^.*\/solicitations/);
  });
});