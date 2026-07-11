import { test, expect } from '@playwright/test';
test('page loads and shows DevCollab v2 text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /DevCollab v2/i })).toBeVisible();
});
//# sourceMappingURL=smoke.spec.js.map