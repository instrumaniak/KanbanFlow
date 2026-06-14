import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'e2e-archived-boards@test.local';
const TEST_PASSWORD = 'Test1234!';

test.describe('Archived Boards', () => {
  let board1Id: number;
  let board1Name: string;
  let board2Id: number;
  let board2Name: string;

  test.beforeAll(async ({ request }) => {
    const res = await request.post('http://localhost:3000/api/auth/register', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    if (res.status() !== 201 && res.status() !== 409) {
      throw new Error(`Failed to create test user: ${res.status()}`);
    }

    // Login via API
    const loginRes = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookies = loginRes.headers()['set-cookie'] || '';

    // Create 2 boards
    board1Name = `Archived Test Board 1 ${Date.now()}`;
    const board1Res = await request.post('http://localhost:3000/api/boards', {
      data: { name: board1Name },
      headers: { Cookie: cookies },
    });
    board1Id = (await board1Res.json()).data.id;

    board2Name = `Archived Test Board 2 ${Date.now()}`;
    const board2Res = await request.post('http://localhost:3000/api/boards', {
      data: { name: board2Name },
      headers: { Cookie: cookies },
    });
    board2Id = (await board2Res.json()).data.id;
  });

  test('archives, restores, and permanently deletes boards', async ({ page, request }) => {
    // Login via UI
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify both boards appear on home
    await expect(page.getByText(board1Name)).toBeVisible();
    await expect(page.getByText(board2Name)).toBeVisible();

    // Archive board1 via API
    const loginRes = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookies = loginRes.headers()['set-cookie'] || '';
    const archiveRes = await request.patch(
      `http://localhost:3000/api/boards/${board1Id}/archive`,
      { headers: { Cookie: cookies } },
    );
    expect(archiveRes.status()).toBe(200);

    // Navigate to archived boards page via link
    await page.goto('/archived-boards');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify board1 appears in archived list
    await expect(page.getByText(board1Name)).toBeVisible();

    // Board2 should NOT appear in archived list
    await expect(page.getByText(board2Name)).not.toBeVisible();

    // Restore board1 via UI
    const restoreButton = page.getByRole('button', { name: 'Restore' });
    await expect(restoreButton).toBeVisible();
    await restoreButton.click();
    await page.waitForTimeout(1000);

    // Verify board1 is gone from archived list
    await expect(page.getByText(board1Name)).not.toBeVisible();

    // Verify board1 is back on home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await expect(page.getByText(board1Name)).toBeVisible();

    // Create a new board, archive it, then permanently delete
    const loginRes2 = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookies2 = loginRes2.headers()['set-cookie'] || '';

    const board3Name = `Board To Delete ${Date.now()}`;
    const board3Res = await request.post('http://localhost:3000/api/boards', {
      data: { name: board3Name },
      headers: { Cookie: cookies2 },
    });
    const board3Id = (await board3Res.json()).data.id;

    const archiveRes2 = await request.patch(
      `http://localhost:3000/api/boards/${board3Id}/archive`,
      { headers: { Cookie: cookies2 } },
    );
    expect(archiveRes2.status()).toBe(200);

    // Navigate to archived boards
    await page.goto('/archived-boards');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify the new board is in archived list
    await expect(page.getByText(board3Name)).toBeVisible();

    // Click Delete button to open the permanent delete dialog
    const deleteButton = page.getByRole('button', { name: 'Delete', exact: true });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Confirm permanent deletion in dialog
    const confirmDelete = page.getByRole('button', { name: 'Delete Permanently' });
    await expect(confirmDelete).toBeVisible();
    await confirmDelete.click();
    await page.waitForTimeout(1000);

    // Verify it's gone from archived list
    await expect(page.getByText(board3Name)).not.toBeVisible();

    // Verify the board is gone via API
    const loginRes3 = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookies3 = loginRes3.headers()['set-cookie'] || '';
    const archivedRes = await request.get('http://localhost:3000/api/boards/archived', {
      headers: { Cookie: cookies3 },
    });
    const archivedData = await archivedRes.json();
    const boardIds = archivedData.data.map((b: { id: number }) => b.id);
    expect(boardIds).not.toContain(board3Id);
  });
});
