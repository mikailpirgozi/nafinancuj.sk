import { test, expect } from "@playwright/test";

test.describe("Application Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click("button:has-text('Sign In')");
    await page.waitForURL("/dashboard");
  });

  test("should create and approve application", async ({ page }) => {
    // Navigate to applications
    await page.click("text=Žiadosti");
    await page.waitForURL("/dashboard/applications");

    // Create new application
    await page.click("button:has-text('Nová žiadosť')");
    await page.waitForSelector("text=Nová žiadosť o úver");

    // Fill form
    await page.fill('input[placeholder="Vyberte klienta"]', "Test Client");
    await page.click("text=Test Client");
    await page.fill('input[type="number"]', "5000");

    // Submit
    await page.click("button:has-text('Vytvorit žiadosť')");
    await page.waitForURL(/\/dashboard\/applications\/[a-z0-9-]+/);

    // Verify creation
    await expect(page.locator("text=NEW")).toBeVisible();

    // Approve application
    await page.click("button:has-text('Schváliť')");
    await page.waitForSelector("text=Žiadosť schválená");

    // Verify approval
    await expect(page.locator("text=APPROVED")).toBeVisible();
  });

  test("should convert approved application to loan", async ({ page }) => {
    // Navigate to approved application
    await page.goto("/dashboard/applications");
    await page.click("text=APPROVED");

    // Click create loan button
    await page.click("button:has-text('Vytvoriť úver')");
    await page.waitForSelector("text=Vytvorenie úveru");

    // Fill loan details
    await page.fill('input[type="number"][placeholder*="Trvanie"]', "12");
    await page.fill('input[type="number"][placeholder*="Úrok"]', "5");

    // Submit
    await page.click("button:has-text('Vytvoriť')");
    await page.waitForURL(/\/dashboard\/loans\/[a-z0-9-]+/);

    // Verify loan created
    await expect(page.locator("text=ACTIVE")).toBeVisible();
    await expect(page.locator("text=CONVERTED")).toBeVisible();
  });

  test("should add comment to application", async ({ page }) => {
    // Navigate to application
    await page.goto("/dashboard/applications");
    await page.click("text=Test Application");

    // Find comments section
    await page.click("button:has-text('Komentáre')");

    // Add comment
    await page.fill('textarea[placeholder*="Komentár"]', "Test comment");
    await page.click("button:has-text('Poslať')");

    // Verify comment added
    await page.waitForSelector("text=Test comment");
    await expect(page.locator("text=Test comment")).toBeVisible();
  });
});
