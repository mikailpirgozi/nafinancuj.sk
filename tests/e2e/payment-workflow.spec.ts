import { test, expect } from "@playwright/test";

test.describe("Payment Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click("button:has-text('Sign In')");
    await page.waitForURL("/dashboard");
  });

  test("should import payments from CSV", async ({ page }) => {
    // Navigate to payments
    await page.click("text=Platby");
    await page.waitForURL("/dashboard/payments");

    // Click import button
    await page.click("button:has-text('Importovať CSV')");
    await page.waitForSelector("text=Nahrať CSV");

    // Upload file
    await page.setInputFiles('input[type="file"]', "tests/fixtures/payments.csv");

    // Submit
    await page.click("button:has-text('Importovať')");

    // Verify import
    await page.waitForSelector("text=Platby importované");
    await expect(page.locator("text=€1,000")).toBeVisible();
  });

  test("should match unmatched payment", async ({ page }) => {
    // Navigate to unmatched payments
    await page.click("text=Platby");
    await page.click("text=Nepárované");

    // Open match dialog
    await page.click("button:has-text('Spárovať')");
    await page.waitForSelector("text=Spárovať platbu");

    // Select installment
    await page.click("select");
    await page.click("text=Splátka 1");

    // Confirm
    await page.click("button:has-text('Spárovať platbu')");

    // Verify match
    await page.waitForSelector("text=Platba spárovaná");
    await expect(page.locator("text=MATCHED")).toBeVisible();
  });

  test("should export payments to CSV", async ({ page }) => {
    // Navigate to payments
    await page.click("text=Platby");

    // Click export button
    const downloadPromise = page.waitForEvent("download");
    await page.click("button:has-text('Exportovať CSV')");
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain("payments");
  });

  test("should view payment statistics", async ({ page }) => {
    // Navigate to payments
    await page.click("text=Platby");

    // Verify stats cards visible
    await expect(page.locator("text=Celkové platby")).toBeVisible();
    await expect(page.locator("text=Priradené")).toBeVisible();
    await expect(page.locator("text=Nepárované")).toBeVisible();
  });
});
