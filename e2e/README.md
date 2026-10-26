# Browser tests (Playwright)

Run with `npm run test:e2e` (Chromium only). Playwright starts the real app via
`e2e/server.js` on port 3100 with a fresh in-memory SQLite database, migrated
at startup. Vitest API tests live in `tests/` and are separate.

## Writing tests

- Import `test` and `expect` from `./fixtures`, not from `@playwright/test`.
  The fixture empties the Shopping List before every test.
- Locate elements by accessible role and name (`getByRole`, `getByLabel`) or by
  `data-testid` (`getByTestId`). Never use CSS classes or ids as selectors.
- Name spec files `*.spec.js`.
