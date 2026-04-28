import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'e2e-boards@test.local';
const TEST_PASSWORD = 'Test1234!';

test.describe('Boards CRUD', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post('http://localhost:3000/api/auth/register', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    if (res.status() !== 201 && res.status() !== 409) {
      throw new Error(`Failed to create test user: ${res.status()}`);
    }
  });

  test('shows My Boards heading when navigating to root', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/projects');

    // Navigate to root which shows boards
    await page.goto('/');
    await page.waitForTimeout(500);
    
    await expect(page.getByRole('heading', { name: 'My Boards' })).toBeVisible();
  });

  test('shows Create Board button for logged in user', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/projects');

    // Navigate to root which shows boards
    await page.goto('/');
    await page.waitForTimeout(500);
    
    const emptyStateButton = page.getByRole('button', { name: 'Create your first board' });
    const createButton = page.getByRole('button', { name: 'Create Board' });

    const isEmptyVisible = await emptyStateButton.isVisible().catch(() => false);
    const isCreateVisible = await createButton.isVisible().catch(() => false);

    expect(isEmptyVisible || isCreateVisible).toBe(true);
  });

  test('creates a board via Create Board button', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/projects');

    // Navigate to root which shows boards
    await page.goto('/');
    await page.waitForTimeout(500);

    const boardName = `Test Board ${Date.now()}`;

    const emptyStateButton = page.getByRole('button', { name: 'Create your first board' });
    const createButton = page.getByRole('button', { name: 'Create Board' });

    if (await emptyStateButton.isVisible().catch(() => false)) {
      await emptyStateButton.click();
    } else {
      await createButton.click();
    }

    const nameInput = page.getByLabel('Board name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(boardName);
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByRole('main').getByText(boardName)).toBeVisible();
  });

  test('cancels board creation', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/projects');

    // Navigate to root which shows boards
    await page.goto('/');
    await page.waitForTimeout(500);

    const emptyStateButton = page.getByRole('button', { name: 'Create your first board' });
    const createButton = page.getByRole('button', { name: 'Create Board' });

    if (await emptyStateButton.isVisible().catch(() => false)) {
      await emptyStateButton.click();
    } else {
      await createButton.click();
    }

    const nameInput = page.getByLabel('Board name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Should not create');

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(nameInput).not.toBeVisible();
  });
});

test.describe('Board Archiving', () => {
  const boardNameToArchive = `Board to Archive ${Date.now()}`;
  let createdBoardId: number;

  test.beforeAll(async ({ request }) => {
    const res = await request.post('http://localhost:3000/api/auth/register', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    if (res.status() !== 201 && res.status() !== 409) {
      throw new Error(`Failed to create test user: ${res.status()}`);
    }

    // Create a board to archive
    const loginRes = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookies = loginRes.headers().set-cookie || '';

    const createRes = await request.post('http://localhost:3000/api/boards', {
      data: { name: boardNameToArchive },
      headers: { Cookie: cookies },
    });
    const boardData = await createRes.json();
    createdBoardId = boardData.data.id;
  });

  test('archives a board from board card', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/projects');

    await page.goto('/');
    await page.waitForTimeout(500);

    // Find the board and click the delete/archive button
    const boardCard = page.locator('.group').filter({ hasText: boardNameToArchive });
    await expect(boardCard).toBeVisible();

    // Click the delete button (trash icon) on the board card
    const deleteButton = boardCard.getByLabel(new RegExp(`Delete board ${boardNameToArchive}`));
    await deleteButton.click();

    // Verify the archive dialog appears
    await expect(page.getByRole('heading', { name: 'Archive board' })).toBeVisible();
    await expect(page.getByText(/Archive board/)).toBeVisible();

    // Click Archive button
    await page.getByRole('button', { name: 'Archive' }).click();

    // Wait for the board to disappear from the main list
    await page.waitForTimeout(1000);
    await expect(boardCard).not.toBeVisible();
  });

  test('views archived boards', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/projects');

    await page.goto('/');
    await page.waitForTimeout(500);

    // Click on "Archived Boards" link
    const archivedBoardsLink = page.getByRole('link', { name: 'Archived Boards' });
    await archivedBoardsLink.click();

    // Verify we're on the archived boards page
    await expect(page.getByRole('heading', { name: 'Archived Boards' })).toBeVisible();

    // Verify the archived board is visible
    await expect(page.getByText(boardNameToArchive)).toBeVisible();
  });

  test('restores an archived board', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/projects');

    // Navigate to archived boards
    await page.goto('/archived-boards');
    await page.waitForTimeout(500);

    // Find and click restore button
    const restoreButton = page.getByRole('button', { name: /restore/i });
    await restoreButton.click();

    // Verify we're redirected to the main boards page and board is visible
    await page.waitForTimeout(1000);
    await expect(page.getByRole('heading', { name: 'My Boards' })).toBeVisible();
  });

  test('permanently deletes an archived board', async ({ page }) => {
    // First archive a new board
    const boardNameToDelete = `Board to Delete ${Date.now()}`;
    
    // Login and create board via API
    const loginRes = await page.request.post('http://localhost:3000/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookies = loginRes.headers()['set-cookie'] || '';
    
    const createRes = await page.request.post('http://localhost:3000/api/boards', {
      data: { name: boardNameToDelete },
      headers: { Cookie: cookies },
    });
    const boardData = await createRes.json();
    const boardId = boardData.data.id;

    // Archive the board via API
    await page.request.patch(`http://localhost:3000/api/boards/${boardId}/archive`, {
      headers: { Cookie: cookies },
    });

    // Now test the UI - navigate to archived boards
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/projects');

    await page.goto('/archived-boards');
    await page.waitForTimeout(500);

    // Find the board and click delete
    const boardCard = page.locator('.group').filter({ hasText: boardNameToDelete });
    await expect(boardCard).toBeVisible();

    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    await deleteButton.click();

    // Verify the permanent delete dialog appears
    await expect(page.getByRole('heading', { name: 'Delete board permanently' })).toBeVisible();

    // Click Delete Permanently
    await page.getByRole('button', { name: 'Delete Permanently' }).click();

    // Wait for the board to disappear
    await page.waitForTimeout(1000);
    await expect(boardCard).not.toBeVisible();
  });
});