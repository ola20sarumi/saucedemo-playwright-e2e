# Test Plan

This plan sets out what the suite tests, how, and why: the scope, the approach, the test cases, when a run counts as passed, and the known gaps. It describes the suite as it stands; the [README](../README.md) covers setup and design decisions.

## 1. Purpose

Give fast, reliable feedback that the core Sauce Demo shopping journey works in all major browser engines, stays accessible, and that the API-testing approach is shown against a real service. A failure should point clearly to what broke.

## 2. Systems under test

| System                                                 | What it is                                                                  | Tested through                                             |
| ------------------------------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [Sauce Demo](https://www.saucedemo.com)                | A public demo shop. All logic runs in the browser; there is no backend API. | The UI, in Chromium, Firefox and WebKit                    |
| [Restful-booker](https://restful-booker.herokuapp.com) | A public API built for practising API testing                               | HTTP requests (Playwright's `request` fixture), no browser |

Both are public services this project does not control. See [section 10](#10-risks-and-mitigations).

## 3. Scope

### In scope

- **Login and session:** valid login, every invalid-login message, logout, and blocking pages for users who are not logged in.
- **Product list:** all four sort orders.
- **Cart:** the badge count and the cart contents.
- **Checkout:** the full purchase and the required customer fields.
- **Accessibility:** automated checks on all 7 screens of the shopping journey.
- **API:** create, read, search, update and delete a booking, error responses, and authorisation.

### Out of scope

- Sauce Demo's deliberately broken users (`problem_user`, `performance_glitch_user`, `error_user`, `visual_user`). They exist to simulate defects, so tests against them would report known bugs rather than regressions.
- Performance, load and security testing.
- Visual appearance (layout, images, styling). Planned; see [section 11](#11-gaps-and-next-steps).
- Manual accessibility testing (keyboard-only use, screen readers).
- Mobile viewports and touch devices.
- The Sauce Demo backend, as it has none.

## 4. Approach

### Test types

| Type          | Tool                   | Runs in                   | Why                                                                                     |
| ------------- | ---------------------- | ------------------------- | --------------------------------------------------------------------------------------- |
| End-to-end UI | Playwright Test        | Chromium, Firefox, WebKit | Proves the journeys work the way a user performs them, in each browser engine           |
| Accessibility | `@axe-core/playwright` | Chromium, Firefox, WebKit | Catches detectable accessibility problems (labels, contrast, structure) on every screen |
| API           | Playwright `request`   | No browser                | Checks the API contract directly: fast, and no UI in the way                            |

### Techniques

- **Risk-based prioritisation.** The paths that lose sales or lock users out (login, checkout) get the deepest coverage and the `@smoke` tag. See [section 5](#5-risk-assessment).
- **Equivalence partitioning and negative testing.** Each kind of invalid input (wrong password, unknown user, locked-out user, empty fields) is one data-driven case with its exact expected error.
- **Data-driven tests.** Cases are rows in a table in `test-data/` or at the top of a spec, so adding a case means adding a row.
- **Oracle from the page.** Sorting tests compare against the page's own items, sorted in code, instead of a hard-coded list.
- **Baseline for accessibility.** Known violations on a site this project can't fix are listed with a reason each. A test fails only on a new violation.
- **Isolated test data.** Each API test creates its own booking, with a unique guest name, and deletes it afterwards.

## 5. Risk assessment

| Area          | What could go wrong                              | Impact | Likelihood | Coverage                                                                 |
| ------------- | ------------------------------------------------ | ------ | ---------- | ------------------------------------------------------------------------ |
| Login         | Valid users can't log in, or invalid ones get in | High   | Medium     | Deep: valid login, 5 invalid cases, logout, page protection (`@smoke`)   |
| Checkout      | Orders can't be completed, or the total is wrong | High   | Medium     | Deep: full purchase with total check, 3 required fields (`@smoke`)       |
| Cart          | Items are lost or miscounted                     | High   | Medium     | Badge count and cart contents                                            |
| Sorting       | Products are listed in the wrong order           | Low    | Low        | All 4 sort orders                                                        |
| Accessibility | Users of assistive technology can't shop         | High   | Medium     | Automated scan of all 7 screens                                          |
| API contract  | Clients break because responses change           | High   | Medium     | Every CRUD operation, errors and auth (health check and create `@smoke`) |

## 6. Test cases

All UI and accessibility cases run in all three browsers. `@smoke` marks the critical path, which `npm run test:smoke` runs on its own.

### Login and session — `tests/login.spec.ts`

| ID              | Case                                     | Expected result                                               |
| --------------- | ---------------------------------------- | ------------------------------------------------------------- |
| LOG-01 `@smoke` | Standard user logs in                    | Lands on the product list showing 6 products                  |
| LOG-02          | Wrong password                           | "Username and password do not match any user in this service" |
| LOG-03          | Unknown username                         | Same error as LOG-02                                          |
| LOG-04          | Locked-out user                          | "Sorry, this user has been locked out."                       |
| LOG-05          | Empty username                           | "Username is required"                                        |
| LOG-06          | Empty password                           | "Password is required"                                        |
| SES-01 `@smoke` | Log out from the menu                    | Returns to the login page                                     |
| SES-02          | Open the product list without logging in | Blocked, with an error naming the protected page              |

### Product list and cart — `tests/inventory.spec.ts`

| ID      | Case                            | Expected result                       |
| ------- | ------------------------------- | ------------------------------------- |
| SORT-01 | Sort by name, A to Z            | Names in ascending order              |
| SORT-02 | Sort by name, Z to A            | Names in descending order             |
| SORT-03 | Sort by price, low to high      | Prices in ascending order             |
| SORT-04 | Sort by price, high to low      | Prices in descending order            |
| CART-01 | Add two items, remove one       | Badge shows nothing, then 2, then 1   |
| CART-02 | Add two items and open the cart | Both items listed, in the order added |

### Checkout — `tests/checkout.spec.ts`

| ID              | Case                              | Expected result                                           |
| --------------- | --------------------------------- | --------------------------------------------------------- |
| CHK-01 `@smoke` | Buy one item from start to finish | Item total is $29.99, order is confirmed, cart is emptied |
| CHK-02          | Continue without a first name     | "First Name is required", cannot go further               |
| CHK-03          | Continue without a last name      | "Last Name is required", cannot go further                |
| CHK-04          | Continue without a postal code    | "Postal Code is required", cannot go further              |

### Accessibility — `tests/accessibility.spec.ts`

Each screen is scanned against WCAG 2.0 and 2.1 levels A and AA, plus axe's best-practice rules. **Expected result:** no violations beyond those listed in [`test-data/a11y-baseline.ts`](../test-data/a11y-baseline.ts).

| ID      | Screen                     | Baselined violations                          |
| ------- | -------------------------- | --------------------------------------------- |
| A11Y-01 | Login                      | No level-one heading; logo outside a landmark |
| A11Y-02 | Product list               | No level-one heading                          |
| A11Y-03 | Product details            | No level-one heading                          |
| A11Y-04 | Cart                       | No level-one heading                          |
| A11Y-05 | Checkout: your information | No level-one heading                          |
| A11Y-06 | Checkout: overview         | No level-one heading                          |
| A11Y-07 | Checkout: complete         | No level-one heading                          |

All baselined violations are best-practice rules. None of the screens has a WCAG violation, so no WCAG rule is excepted.

### API — `tests/api/booking.spec.ts`

| ID              | Case                                          | Expected result                                          |
| --------------- | --------------------------------------------- | -------------------------------------------------------- |
| API-01 `@smoke` | Health check                                  | 201                                                      |
| API-02 `@smoke` | Create a booking, then fetch it by id         | Returns an id; the fetched booking matches what was sent |
| API-03          | Search by guest name                          | Returns exactly that booking                             |
| API-04          | Replace a booking (PUT) with a token          | Returns the new booking                                  |
| API-05          | Update one field (PATCH) with a token         | Only that field changes                                  |
| API-06          | Delete a booking with a token                 | 201, then fetching it returns 404                        |
| API-07          | Fetch a booking that doesn't exist            | 404                                                      |
| API-08          | Create a booking with required fields missing | Rejected (not a 2xx)                                     |
| API-09          | Update without a token                        | 403                                                      |
| API-10          | Delete without a token                        | 403, and the booking still exists                        |
| API-11          | Log in with the wrong password                | No token; body says "Bad credentials"                    |

Restful-booker has some unusual behaviour: a delete returns 201, wrong credentials return 200, and a booking with missing fields returns 500. The tests check what it actually does, with a comment at each case.

### Totals

| Suite                                        | Cases  | Runs              |
| -------------------------------------------- | ------ | ----------------- |
| UI (login, session, sorting, cart, checkout) | 18     | 54 (× 3 browsers) |
| Accessibility                                | 7      | 21 (× 3 browsers) |
| API                                          | 11     | 11                |
| **Total**                                    | **36** | **86**            |

## 7. Environments and test data

| Item       | Value                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| UI target  | `https://www.saucedemo.com`, or `BASE_URL`                                                                                   |
| API target | `https://restful-booker.herokuapp.com`, or `API_BASE_URL`                                                                    |
| Browsers   | Desktop Chromium, Firefox and WebKit (Playwright's builds)                                                                   |
| CI         | GitHub Actions on Ubuntu 24.04, Node 22, pinned so the environment only changes on purpose                                   |
| UI users   | Sauce Demo's public `standard_user` and `locked_out_user`; override with `STANDARD_USER`, `LOCKED_OUT_USER`, `USER_PASSWORD` |
| API user   | Restful-booker's public admin account; override with `API_USERNAME`, `API_PASSWORD`                                          |
| Test data  | `test-data/`: users, invalid logins, customer details, bookings and the accessibility baseline                               |

## 8. Entry and exit criteria

**Entry:** a run starts when

- type-checking, linting and formatting pass (CI won't run tests otherwise), and
- both target services are reachable.

**Exit:** a change is ready to merge when

- every test passes in all three browsers and in the API project,
- no new accessibility violation appears, and the baseline has changed only with a stated reason, and
- any test that passed only on retry has been looked into, not ignored.

## 9. Execution

| When                                  | What runs                                                                             | Where                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| While developing                      | `npm run test:chromium`, `npm run test:smoke`, or one suite (`test:a11y`, `test:api`) | Locally                                                                 |
| Every push and pull request to `main` | Quality checks, then the full suite: one job per browser plus one for the API         | GitHub Actions                                                          |
| Nightly at 06:00 UTC                  | The full suite, to catch changes to the target sites                                  | GitHub Actions                                                          |
| After a merge to `main`               | The full suite; the HTML report is published                                          | [GitHub Pages](https://ola20sarumi.github.io/saucedemo-playwright-e2e/) |

### Investigating failures

- In CI, a failing test is retried up to twice. Traces are recorded on the first retry and screenshots on failure, so failures can be debugged from the report without running locally.
- Failures appear as annotations on the pull request, and the merged HTML report is attached to every run.
- Each accessibility test attaches its full axe results, and a "stale baseline" note marks a listed violation that no longer occurs.
- A failure is first sorted into one of three causes: a change to the target site, a problem in the suite, or an outage of the service. A site change means updating the test or baseline, with a reason. A suite problem is fixed in the suite. An outage is rerun once the service is back.

## 10. Risks and mitigations

| Risk                                                    | Mitigation                                                                                                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A target site changes or goes down without warning      | Nightly runs show it within a day; the URLs can be pointed elsewhere through environment variables                                                              |
| Restful-booker is shared, and resets its data regularly | Each test creates its own booking with a unique name and never relies on existing data                                                                          |
| Flaky tests hide real failures                          | Only auto-waiting assertions, no fixed waits; lint rules catch missing `await`s; retries happen only in CI, and anything that passes on retry gets investigated |
| The accessibility baseline hides new problems           | Rules are allowed per screen, not globally, each with a reason; WCAG rules have no exceptions; stale entries are flagged                                        |
| Automated accessibility checks miss problems            | Treated as a floor, not a full audit; manual testing is listed as a gap                                                                                         |
| Logging in through the UI in every test slows the suite | Accepted for now, since it keeps tests independent; see section 11                                                                                              |

### Known issues

- The WebKit checkout tests occasionally fail locally (about 1 run in 20) and pass on retry. This predates the accessibility and API tests and has not appeared in CI so far.

## 11. Gaps and next steps

In rough priority order:

1. **More checkout and cart paths:** cancelling at each checkout step, removing items on the cart page, totals with several items (including tax), and the cart surviving a page reload.
2. **Product details page:** add to cart from it, and go back to the list. It is currently only scanned for accessibility.
3. **Visual regression** with `toHaveScreenshot()`, which would also catch what `visual_user` breaks.
4. **Faster setup:** log in once in a setup project and reuse the session with `storageState`.
5. **Manual accessibility pass:** keyboard-only navigation and a screen-reader run through the journey.
6. **Mobile viewports:** run the smoke tests on Playwright's phone profiles.
7. **API schema checks:** validate response shapes against a schema, not just values.

---

_Written by [ola20sarumi](https://github.com/ola20sarumi), and checked with Claude (Claude Code) for accuracy and completeness._
