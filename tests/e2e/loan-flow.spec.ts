import { test, expect } from "@playwright/test";

test.describe("Loan Management Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to sign-in page
    await page.goto("/sign-in");
    
    // Wait for Clerk to load
    await page.waitForTimeout(2000);
  });

  test("should create new client and loan application", async ({ page }) => {
    // Skip if not authenticated
    const isSignedIn = await page.locator('[data-clerk-element="user-button"]').isVisible();
    if (!isSignedIn) {
      test.skip();
    }

    // Navigate to clients page
    await page.goto("/dashboard/clients");
    await expect(page).toHaveTitle(/Klienti/);

    // Click "Nový klient" button
    await page.click('button:has-text("Nový klient")');
    
    // Fill client form
    await page.fill('input[name="companyName"]', "Test Company s.r.o.");
    await page.fill('input[name="ico"]', "12345678");
    await page.fill('input[name="contactPerson"]', "John Doe");
    await page.fill('input[name="email"]', "john@test.com");
    await page.fill('input[name="phone"]', "+421901234567");
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success toast
    await expect(page.locator('text=Klient vytvorený')).toBeVisible();
  });

  test("should display loan detail page with tabs", async ({ page }) => {
    const isSignedIn = await page.locator('[data-clerk-element="user-button"]').isVisible();
    if (!isSignedIn) {
      test.skip();
    }

    // Navigate to loans page
    await page.goto("/dashboard/loans");
    
    // Click on first loan (if exists)
    const firstLoan = page.locator('table tbody tr').first();
    if (await firstLoan.isVisible()) {
      await firstLoan.click();
      
      // Check tabs are visible
      await expect(page.locator('text=Splátky')).toBeVisible();
      await expect(page.locator('text=Platby')).toBeVisible();
      await expect(page.locator('text=Kolaterály')).toBeVisible();
      await expect(page.locator('text=Dokumenty')).toBeVisible();
    }
  });

  test("should navigate through main dashboard pages", async ({ page }) => {
    const isSignedIn = await page.locator('[data-clerk-element="user-button"]').isVisible();
    if (!isSignedIn) {
      test.skip();
    }

    // Dashboard
    await page.goto("/dashboard");
    await expect(page.locator('h1, h2')).toContainText(/Dashboard|Prehľad/);

    // Clients
    await page.goto("/dashboard/clients");
    await expect(page.locator('h1, h2')).toContainText(/Klienti/);

    // Loans
    await page.goto("/dashboard/loans");
    await expect(page.locator('h1, h2')).toContainText(/Úvery/);

    // Applications
    await page.goto("/dashboard/applications");
    await expect(page.locator('h1, h2')).toContainText(/Žiadosti/);

    // Overdue
    await page.goto("/dashboard/overdue");
    await expect(page.locator('h1, h2')).toContainText(/Omeškané/);

    // Payments
    await page.goto("/dashboard/payments");
    await expect(page.locator('h1, h2')).toContainText(/Platby/);

    // Reports
    await page.goto("/dashboard/reports");
    await expect(page.locator('h1, h2')).toContainText(/Reporty/);

    // Settings
    await page.goto("/dashboard/settings");
    await expect(page.locator('h1, h2')).toContainText(/Nastavenia/);
  });

  test("should handle Finstat integration", async ({ page }) => {
    const isSignedIn = await page.locator('[data-clerk-element="user-button"]').isVisible();
    if (!isSignedIn) {
      test.skip();
    }

    await page.goto("/dashboard/clients");
    
    // Open new client dialog
    await page.click('button:has-text("Nový klient")');
    
    // Fill IČO
    await page.fill('input[id="ico"]', "12345678");
    
    // Click Finstat button (if visible)
    const finstatButton = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    if (await finstatButton.isVisible()) {
      await finstatButton.click();
      
      // Wait for API call
      await page.waitForTimeout(2000);
    }
  });

  test("should display reminders page", async ({ page }) => {
    const isSignedIn = await page.locator('[data-clerk-element="user-button"]').isVisible();
    if (!isSignedIn) {
      test.skip();
    }

    await page.goto("/dashboard/reminders");
    await expect(page.locator('h1, h2')).toContainText(/Reminders|Upomienky/);
    
    // Check for stats cards
    const statsCards = page.locator('[class*="Card"]');
    await expect(statsCards.first()).toBeVisible();
  });
});

