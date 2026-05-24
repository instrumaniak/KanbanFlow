import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'e2e-labels@test.local';
const TEST_PASSWORD = 'Test1234!';

test.describe('Labels E2E', () => {
  test.beforeAll(async ({ request }) => {
    const res = await request.post('http://localhost:3000/api/auth/register', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    if (res.status() !== 201 && res.status() !== 409) {
      throw new Error(`Failed to create test user: ${res.status()}`);
    }
  });

  test('default labels are available after registration', async ({ request }) => {
    // Login via API to get cookies
    const loginRes = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookies = loginRes.headers()['set-cookie'] || '';

    // Verify default labels exist
    const labelsRes = await request.get('http://localhost:3000/api/labels', {
      headers: { Cookie: cookies },
    });
    expect(labelsRes.status()).toBe(200);
    const labelsData = await labelsRes.json();
    expect(labelsData.data.length).toBeGreaterThanOrEqual(4);
    const labelNames = labelsData.data.map((l: { name: string }) => l.name);
    expect(labelNames).toContain('Bug');
    expect(labelNames).toContain('Feature');
    expect(labelNames).toContain('Urgent');
    expect(labelNames).toContain('Important');
  });

  test('assigns a label to a card and persists', async ({ page, request }) => {
    // Login via API
    const loginRes = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookies = loginRes.headers()['set-cookie'] || '';

    // Get default labels
    const labelsRes = await request.get('http://localhost:3000/api/labels', {
      headers: { Cookie: cookies },
    });
    const labelsData = await labelsRes.json();
    const bugLabel = labelsData.data.find((l: { name: string }) => l.name === 'Bug');
    expect(bugLabel).toBeDefined();

    // Create a board
    const boardRes = await request.post('http://localhost:3000/api/boards', {
      data: { name: `Label Test Board ${Date.now()}` },
      headers: { Cookie: cookies },
    });
    const boardData = await boardRes.json();
    const boardId = boardData.data.id;

    // Create a column
    const columnRes = await request.post(`http://localhost:3000/api/boards/${boardId}/columns`, {
      data: { name: 'To Do' },
      headers: { Cookie: cookies },
    });
    const columnData = await columnRes.json();
    const columnId = columnData.data.id;

    // Create a card
    const cardRes = await request.post('http://localhost:3000/api/cards', {
      data: { title: 'Test Card for Labels', column_id: columnId, position: 0 },
      headers: { Cookie: cookies },
    });
    const cardData = await cardRes.json();
    expect(cardData.data.id).toBeDefined();

    // Login via UI
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/projects');

    // Navigate to the board
    await page.goto(`/boards/${boardId}`);
    await page.waitForTimeout(1000);

    // Find the card and open detail panel
    const cardButton = page.getByRole('button', { name: /Test Card for Labels/i });
    await expect(cardButton).toBeVisible();
    await cardButton.click();

    // Wait for detail panel to open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Verify Labels section is visible
    await expect(page.getByText('Labels', { exact: true })).toBeVisible();

    // Open the label picker popover
    const labelPickerTrigger = page.getByRole('button', { name: /add labels/i });
    await expect(labelPickerTrigger).toBeVisible();
    await labelPickerTrigger.click();

    // Click the Bug label to assign it
    const bugLabelButton = page.getByRole('button', { name: /add bug/i });
    await expect(bugLabelButton).toBeVisible();
    await bugLabelButton.click();

    await page.waitForTimeout(500);

    // Close the panel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify the label badge appears on the card face
    const cardBadge = page.locator('.group').filter({ hasText: /Test Card for Labels/i }).locator('span').filter({ hasText: 'Bug' });
    await expect(cardBadge).toBeVisible();

    // Refresh the page and verify persistence
    await page.reload();
    await page.waitForTimeout(1500);

    const persistedBadge = page.locator('.group').filter({ hasText: /Test Card for Labels/i }).locator('span').filter({ hasText: 'Bug' });
    await expect(persistedBadge).toBeVisible();

    // Open card detail again and remove the label
    const cardButtonAfterReload = page.getByRole('button', { name: /Test Card for Labels/i });
    await cardButtonAfterReload.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Open the label picker popover (now shows "1 label")
    const labelPickerTriggerAfterReload = page.getByRole('button', { name: /1 label/i });
    await expect(labelPickerTriggerAfterReload).toBeVisible();
    await labelPickerTriggerAfterReload.click();

    // Click the Bug label again to remove it
    const bugLabelButtonAgain = page.getByRole('button', { name: /remove bug/i });
    await expect(bugLabelButtonAgain).toBeVisible();
    await bugLabelButtonAgain.click();

    await page.waitForTimeout(500);

    // Close panel
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Verify label badge is gone from card face
    await expect(cardBadge).not.toBeVisible();
  });

  test('creates a custom label via API and assigns it to a card', async ({ page, request }) => {
    // Login via API
    const loginRes = await request.post('http://localhost:3000/api/auth/login', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD },
    });
    const cookies = loginRes.headers()['set-cookie'] || '';

    // Create a custom label
    const customLabelName = `Custom Label ${Date.now()}`;
    const createLabelRes = await request.post('http://localhost:3000/api/labels', {
      data: { name: customLabelName, color: 'purple' },
      headers: { Cookie: cookies },
    });
    expect(createLabelRes.status()).toBe(201);
    const labelData = await createLabelRes.json();
    const customLabelId = labelData.data.id;
    expect(labelData.data.name).toBe(customLabelName);
    expect(labelData.data.color).toBe('purple');

    // Create a board, column, card
    const boardRes = await request.post('http://localhost:3000/api/boards', {
      data: { name: `Custom Label Board ${Date.now()}` },
      headers: { Cookie: cookies },
    });
    const boardId = (await boardRes.json()).data.id;

    const columnRes = await request.post(`http://localhost:3000/api/boards/${boardId}/columns`, {
      data: { name: 'In Progress' },
      headers: { Cookie: cookies },
    });
    const columnId = (await columnRes.json()).data.id;

    const cardRes = await request.post('http://localhost:3000/api/cards', {
      data: { title: 'Custom Label Card', column_id: columnId, position: 0 },
      headers: { Cookie: cookies },
    });
    const cardId = (await cardRes.json()).data.id;

    // Assign the custom label to the card via API
    const assignRes = await request.post(`http://localhost:3000/api/cards/${cardId}/labels`, {
      data: { labelId: customLabelId },
      headers: { Cookie: cookies },
    });
    expect(assignRes.status()).toBe(200);

    // Login via UI and navigate to board
    await page.goto('/login');
    await page.getByLabel('Email').fill(TEST_EMAIL);
    await page.getByLabel('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/projects');

    await page.goto(`/boards/${boardId}`);
    await page.waitForTimeout(1000);

    // Verify the custom label appears on the card face
    const cardBadge = page.locator('.group').filter({ hasText: /Custom Label Card/i }).locator('span').filter({ hasText: customLabelName });
    await expect(cardBadge).toBeVisible();

    // Verify the label has the correct color
    const badgeStyle = await cardBadge.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // Note: Playwright returns computed RGB color, so we check it's not empty/default
    expect(badgeStyle).not.toBe('rgba(0, 0, 0, 0)');

    // Open card detail panel and verify label is shown as assigned (full opacity)
    const cardButton = page.getByRole('button', { name: /Custom Label Card/i });
    await cardButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Open the label picker popover
    const labelPickerTrigger = page.getByRole('button', { name: /1 label/i });
    await labelPickerTrigger.click();

    const customLabelButton = page.locator('button').filter({ hasText: customLabelName }).first();
    await expect(customLabelButton).toBeVisible();
  });
});
