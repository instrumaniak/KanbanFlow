import { test, expect } from '@playwright/test';
import { monitoringTest, assertNoErrors } from './test-utils';

const TEST_EMAIL = 'e2e-dnd@test.local';
const TEST_PASSWORD = 'Test1234!';

monitoringTest.describe('Drag and Drop', () => {
  monitoringTest.beforeAll(async ({ request }) => {
    // Ensure test user exists
    const res = await request.post('http://localhost:3000/api/auth/register', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    if (res.status() !== 201 && res.status() !== 409) {
      throw new Error(`Failed to create test user: ${res.status()}`);
    }
  });

  monitoringTest.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/projects');
  });

  monitoringTest('can drag and drop a card within a column', async ({ page, monitoring }) => {
    // 1. Create a board and columns if they don't exist, or go to an existing one
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Create a fresh board for this test to avoid state pollution
    const boardName = `DnD Internal ${Date.now()}`;
    await page.getByRole('button', { name: 'Create Board' }).click();
    await page.getByLabel('Board name').fill(boardName);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(1000);

    // 2. Add two cards to the first column
    const addCardButton = page.getByRole('button', { name: '+ Add a card' }).first();
    await addCardButton.click();
    
    const textarea = page.locator('textarea[placeholder="Enter a title..."]');
    await textarea.fill('Card 1');
    await textarea.press('Enter');
    await page.waitForTimeout(500);
    
    await textarea.fill('Card 2');
    await textarea.press('Enter');
    await page.waitForTimeout(1000);

    const cards = page.locator('div[role="button"][aria-label="Edit card title"]');
    await expect(cards).toHaveCount(2, { timeout: 10000 });
    await expect(cards.nth(0)).toHaveText(/Card 1/);
    await expect(cards.nth(1)).toHaveText(/Card 2/);

    // 3. Perform Drag and Drop (Card 1 below Card 2)
    const card1 = cards.nth(0);
    const card2 = cards.nth(1);
    
    // Using manual mouse events for dnd-kit compatibility
    const card1Box = await card1.boundingBox();
    const card2Box = await card2.boundingBox();
    
    if (card1Box && card2Box) {
      await page.mouse.move(card1Box.x + card1Box.width / 2, card1Box.y + card1Box.height / 2);
      await page.mouse.down();
      await page.mouse.move(card2Box.x + card2Box.width / 2, card2Box.y + card2Box.height / 2 + 10, { steps: 10 });
      await page.mouse.up();
    }
    
    await page.waitForTimeout(2000); // Wait for optimistic UI and backend sync

    // 4. Verify order changed
    await expect(cards.nth(0)).toHaveText(/Card 2/);
    await expect(cards.nth(1)).toHaveText(/Card 1/);

    // 5. Verify persistence after reload
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.locator('div[role="button"][aria-label="Edit card title"]').nth(0)).toHaveText(/Card 2/);
    await expect(page.locator('div[role="button"][aria-label="Edit card title"]').nth(1)).toHaveText(/Card 1/);

    assertNoErrors(monitoring);
  });

  monitoringTest('can drag and drop a card between columns', async ({ page, monitoring }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const boardName = `DnD Between ${Date.now()}`;
    await page.getByRole('button', { name: 'Create Board' }).click();
    await page.getByLabel('Board name').fill(boardName);
    await page.getByRole('button', { name: 'Create' }).click();
    await page.waitForTimeout(2000);

    // Ensure we have at least two columns
    const addColumnButton = page.getByRole('button', { name: 'Add Column' });
    await addColumnButton.click();
    await page.waitForTimeout(1000);

    const columns = page.locator('[data-column-id]');
    await expect(columns).toHaveCount(count => count >= 2);

    // Add a card to the first column
    await page.getByRole('button', { name: '+ Add a card' }).first().click();
    const textarea = page.locator('textarea[placeholder="Enter a title..."]');
    await textarea.fill('Cross Column Card');
    await textarea.press('Enter');
    await page.waitForTimeout(1000);

    const firstColumnCards = columns.nth(0).locator('div[role="button"][aria-label="Edit card title"]');
    const secondColumnCards = columns.nth(1).locator('div[role="button"][aria-label="Edit card title"]');

    await expect(firstColumnCards).toHaveCount(1);
    await expect(secondColumnCards).toHaveCount(0);

    // Drag from first column to second column
    const card = firstColumnCards.first();
    const targetColumn = columns.nth(1);
    
    const cardBox = await card.boundingBox();
    const targetBox = await targetColumn.boundingBox();
    
    if (cardBox && targetBox) {
      await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
      await page.mouse.down();
      // Move to the middle of the target column
      await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 100, { steps: 20 });
      await page.mouse.up();
    }
    
    await page.waitForTimeout(2000);

    // Verify move
    await expect(firstColumnCards).toHaveCount(0);
    await expect(secondColumnCards).toHaveCount(1);
    await expect(secondColumnCards.first()).toHaveText(/Cross Column Card/);

    // Verify persistence after reload
    await page.reload();
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-column-id]').nth(1).locator('div[role="button"][aria-label="Edit card title"]')).toHaveCount(1);

    assertNoErrors(monitoring);
  });
});
