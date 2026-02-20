---
title: "10 Playwright Tricks I Wish I Knew Earlier"
description: "Practical Playwright tips from the trenches — auto-waiting pitfalls, smart selectors, network interception, and more patterns that level up your test automation."
pubDate: 2026-02-20
tags: ["playwright", "testing", "automation", "typescript"]
draft: false
---

After spending a good chunk of my career writing end-to-end tests, I've picked up some Playwright patterns that I keep coming back to. These aren't the basics you'll find in the getting-started guide — they're the things that save you hours of debugging and make your test suite genuinely reliable.

## 1. Stop using `page.waitForTimeout()`

This is the single biggest anti-pattern I see. If you're writing `await page.waitForTimeout(3000)`, you're telling Playwright "I don't know when things are ready, so just wait and hope."

Instead, wait for something specific:

```typescript
// Bad - arbitrary wait
await page.waitForTimeout(3000);
await page.click('#submit');

// Good - wait for the actual condition
await page.waitForLoadState('networkidle');
await page.click('#submit');

// Even better - Playwright auto-waits on actions
await page.getByRole('button', { name: 'Submit' }).click();
```

Playwright's auto-waiting is powerful. Most actions (`click`, `fill`, `check`) already wait for the element to be visible, enabled, and stable. Trust it.

## 2. Use `getByRole()` as your default selector strategy

This was a game-changer for me. Instead of fragile CSS selectors or test IDs everywhere, lean into accessibility roles:

```typescript
// Fragile - breaks when CSS classes change
await page.click('.btn-primary.submit-form');

// Better - but clutters your HTML with test attributes
await page.click('[data-testid="submit-button"]');

// Best - uses accessibility semantics, resilient to refactors
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('heading', { name: 'Dashboard' }).isVisible();
await page.getByRole('link', { name: 'Settings' }).click();
```

The bonus? Your tests now validate that your app is accessible. If `getByRole` can't find your button, it means screen readers can't either.

## 3. Network interception for deterministic tests

Flaky tests often come from flaky APIs. Mock them:

```typescript
await page.route('**/api/users', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([
      { id: 1, name: 'Test User', email: 'test@example.com' },
    ]),
  });
});

await page.goto('/users');
await expect(page.getByText('Test User')).toBeVisible();
```

You can also use `route.continue()` to modify requests on the fly — great for testing error states:

```typescript
// Simulate a server error for a specific endpoint
await page.route('**/api/payments', (route) =>
  route.fulfill({ status: 500, body: 'Internal Server Error' })
);

// Now test that your UI handles the error gracefully
await page.getByRole('button', { name: 'Pay Now' }).click();
await expect(page.getByText('Something went wrong')).toBeVisible();
```

## 4. Use `test.step()` for readable test reports

Long tests become unreadable in reports. Break them into logical steps:

```typescript
test('user can complete checkout', async ({ page }) => {
  await test.step('Add items to cart', async () => {
    await page.goto('/products');
    await page.getByRole('button', { name: 'Add to Cart' }).first().click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  await test.step('Fill shipping details', async () => {
    await page.getByRole('link', { name: 'Cart' }).click();
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByLabel('Address').fill('123 Test Street');
    await page.getByLabel('City').fill('Pune');
  });

  await test.step('Complete payment', async () => {
    await page.getByRole('button', { name: 'Pay Now' }).click();
    await expect(page.getByText('Order Confirmed')).toBeVisible();
  });
});
```

When a test fails, the report shows exactly which step broke — no more scanning through 50 lines of actions.

## 5. The `expect.soft()` trick for collecting multiple failures

Regular `expect` stops the test on first failure. Sometimes you want to check everything and report all failures at once:

```typescript
test('dashboard displays all widgets correctly', async ({ page }) => {
  await page.goto('/dashboard');

  // Soft assertions - test continues even if one fails
  await expect.soft(page.getByTestId('revenue-widget')).toBeVisible();
  await expect.soft(page.getByTestId('users-widget')).toBeVisible();
  await expect.soft(page.getByTestId('orders-widget')).toBeVisible();
  await expect.soft(page.getByTestId('chart-widget')).toBeVisible();
});
```

This is especially useful for visual verification tests where you want to know all the things that are broken, not just the first one.

## 6. Reuse authentication state across tests

Don't log in before every test. Set it up once and reuse it:

```typescript
// auth.setup.ts
import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.getByText('Welcome')).toBeVisible();

  // Save the authenticated state
  await page.context().storageState({ path: '.auth/user.json' });
});
```

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'tests',
      dependencies: ['setup'],
      use: { storageState: '.auth/user.json' },
    },
  ],
});
```

Your tests now start already logged in. This alone can cut your suite runtime significantly.

## 7. `page.waitForResponse()` for precise async operations

Instead of guessing when an API call completes, wait for it explicitly:

```typescript
// Wait for the API response, then verify the UI updated
const responsePromise = page.waitForResponse(
  (resp) => resp.url().includes('/api/save') && resp.status() === 200
);

await page.getByRole('button', { name: 'Save' }).click();
const response = await responsePromise;
const data = await response.json();

// Now you can assert on both the API response AND the UI
expect(data.success).toBe(true);
await expect(page.getByText('Saved successfully')).toBeVisible();
```

Note: declare the `waitForResponse` promise **before** triggering the action that causes it. Otherwise you might miss it.

## 8. Custom fixtures for common setup patterns

If you find yourself repeating setup code, create a custom fixture:

```typescript
// fixtures.ts
import { test as base } from '@playwright/test';

type Fixtures = {
  dashboardPage: Page;
};

export const test = base.extend<Fixtures>({
  dashboardPage: async ({ page }, use) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

export { expect } from '@playwright/test';
```

```typescript
// dashboard.spec.ts
import { test, expect } from './fixtures';

test('shows revenue metrics', async ({ dashboardPage }) => {
  // Already on the dashboard, ready to test
  await expect(dashboardPage.getByTestId('revenue')).toBeVisible();
});
```

This keeps your tests focused on what they're actually testing.

## 9. Trace viewer is your best debugging friend

When a test fails in CI, you need context. Enable trace collection on failure:

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry', // Captures trace only on retry
  },
  retries: 1, // Retry failed tests once
});
```

The trace file captures screenshots, DOM snapshots, network requests, and console logs at every step. Open it with:

```bash
npx playwright show-trace trace.zip
```

You get a full timeline of what happened — like having a DVR for your test execution. This has saved me countless hours compared to staring at CI logs.

## 10. Parallel execution with worker-scoped fixtures

By default, Playwright runs test files in parallel. But if tests share state (like a database), you need to isolate them:

```typescript
// playwright.config.ts
export default defineConfig({
  workers: 4, // Run 4 test files in parallel
  fullyParallel: true, // Also parallelize tests within files
});
```

If tests need unique data, use `testInfo.parallelIndex` to avoid collisions:

```typescript
test('create a project', async ({ page }, testInfo) => {
  const uniqueName = `Project-${testInfo.parallelIndex}-${Date.now()}`;
  await page.getByLabel('Project Name').fill(uniqueName);
  // Each parallel worker uses a unique name - no conflicts
});
```

---

## Wrapping up

The biggest lesson I've learned with Playwright: **trust the framework**. Its auto-waiting, built-in assertions, and retry mechanisms are designed to eliminate flakiness. Most of the time, when a test is flaky, the fix isn't "add more waits" — it's "use the right selector" or "wait for the right condition."

If you're still getting started with Playwright, the [official docs](https://playwright.dev/docs/intro) are genuinely excellent. And if you want to go deeper, the trace viewer and codegen (`npx playwright codegen`) are worth exploring early on.

Got your own Playwright tricks? I'd love to hear them — reach out on [Twitter](https://twitter.com/DaveSambhav) or [LinkedIn](https://www.linkedin.com/in/sambhav6197/).
