import { test, expect } from "@playwright/test";

test.describe("Loan Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click("button:has-text('Sign In')");
    await page.waitForURL("/dashboard");
  });

  test("should create loan and add payment", async ({ page }) => {
    // Navigate to loans
    await page.click("text=Úvery");
    await page.waitForURL("/dashboard/loans");

    // Create new loan
    await page.click("button:has-text('Nový úver')");
    await page.waitForSelector("text=Vytvorenie nového úveru");

    // Fill form
    await page.fill('input[placeholder="Vyberte klienta"]', "Test Client");
    await page.click("text=Test Client");

    await page.fill('input[type="number"][placeholder*="Suma"]', "10000");
    await page.fill('input[type="number"][placeholder*="Úroková sadzba"]', "5");
    await page.fill('input[type="number"][placeholder*="Trvanie"]', "12");

    // Submit
    await page.click("button:has-text('Vytvoriť úver')");
    await page.waitForURL(/\/dashboard\/loans\/[a-z0-9-]+/);

    // Verify loan created
    await expect(page.locator("text=€10,000")).toBeVisible();

    // Add payment
    await page.click("button:has-text('Pridať platbu')");
    await page.fill('input[type="number"][placeholder="0.00"]', "1000");
    await page.click("button:has-text('Potvrdiť platbu')");

    // Verify payment added
    await page.waitForSelector("text=Platba úspešne zaznamenená");
    await expect(page.locator("text=€1,000")).toBeVisible();
  });

  test("should perform early repayment", async ({ page }) => {
    // Navigate to existing loan
    await page.goto("/dashboard/loans");
    await page.click("text=Test Loan");

    // Open early repayment dialog
    await page.click("button:has-text('Predčasné splatenie')");
    await page.waitForSelector("text=Predčasné splatenie");

    // Verify calculation shown
    await expect(page.locator("text=Zľava na úrok")).toBeVisible();

    // Confirm
    await page.click("button:has-text('Potvrdiť predčasné splatenie')");

    // Verify success
    await page.waitForSelector("text=Predčasné splatenie úspešne zaznamenané");
    await expect(page.locator("text=COMPLETED")).toBeVisible();
  });

  test("should view loan history", async ({ page }) => {
    // Navigate to loan detail
    await page.goto("/dashboard/loans");
    await page.click("text=Test Loan");

    // Click history tab
    await page.click("button:has-text('História')");

    // Verify audit logs shown
    await expect(page.locator("text=Vytvorenie")).toBeVisible();
    await expect(page.locator("text=Úprava")).toBeVisible();
  });
});
