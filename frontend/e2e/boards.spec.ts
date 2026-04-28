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