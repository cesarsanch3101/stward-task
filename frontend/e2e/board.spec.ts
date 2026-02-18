import { test, expect } from "./fixtures/auth.fixture";
import { BoardPage } from "./pages/board.page";

test.describe("Tablero Kanban", () => {
  test("usuario autenticado puede ver el tablero con columnas", async ({
    authenticatedPage,
  }) => {
    const boardPage = new BoardPage(authenticatedPage);
    await boardPage.waitForBoard();

    // Should see default columns
    await expect(
      authenticatedPage.getByText("Pendiente")
    ).toBeVisible();
    await expect(
      authenticatedPage.getByText("En Progreso")
    ).toBeVisible();
    await expect(
      authenticatedPage.getByText("Completado")
    ).toBeVisible();
  });

  test("puede crear una tarea nueva", async ({ authenticatedPage }) => {
    const boardPage = new BoardPage(authenticatedPage);
    await boardPage.waitForBoard();

    // Click add task button on first column
    const addButton = authenticatedPage
      .getByRole("button", { name: /nueva tarea|agregar/i })
      .first();
    await addButton.click();

    // Fill in the task form
    await authenticatedPage.getByLabel(/título/i).fill("Tarea de prueba E2E");
    await authenticatedPage
      .getByRole("button", { name: /crear/i })
      .click();

    // Verify task appears on the board
    await expect(
      authenticatedPage.getByText("Tarea de prueba E2E")
    ).toBeVisible({ timeout: 5000 });
  });
});
