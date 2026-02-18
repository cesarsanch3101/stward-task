import { test, expect } from "./fixtures/auth.fixture";

test.describe("Autenticación", () => {
  test("puede iniciar sesión con credenciales válidas", async ({
    loginPage,
    page,
  }) => {
    await loginPage.goto();
    await loginPage.login("admin@stwards.com", "admin123");
    await page.waitForURL(/\/(board|$)/);
    expect(page.url()).not.toContain("/login");
  });

  test("muestra error con credenciales inválidas", async ({
    loginPage,
    page,
  }) => {
    await loginPage.goto();
    await loginPage.login("admin@stwards.com", "wrongpassword");
    // Should stay on login page
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/login");
  });

  test("usuario no autenticado es redirigido a /login", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("/login");
  });
});
