import { type Locator, type Page } from "@playwright/test";

export class BoardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(boardId: string) {
    await this.page.goto(`/board/${boardId}`);
  }

  getColumn(name: string): Locator {
    return this.page.getByText(name).locator("..");
  }

  getTaskCard(title: string): Locator {
    return this.page.getByText(title);
  }

  async waitForBoard() {
    await this.page.waitForSelector('[data-testid="kanban-board"], .flex.gap-4', {
      timeout: 10000,
    });
  }
}
