import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

type AuthFixtures = {
  loginPage: LoginPage;
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  authenticatedPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("admin@stwards.com", "admin123");
    await page.waitForURL(/\/(board|$)/);
    await use(page);
  },
});

export { expect } from "@playwright/test";
