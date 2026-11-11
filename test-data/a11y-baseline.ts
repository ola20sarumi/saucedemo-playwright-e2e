/**
 * Accessibility violations already present on Sauce Demo, recorded so the scan fails only on
 * new problems. Sauce Demo is a public site this project doesn't control, so its existing issues
 * can't be fixed here; listing them keeps the suite green while still catching regressions.
 *
 * Every entry is an axe best-practice rule. The pages have no WCAG 2.1 A/AA violations, so the
 * WCAG rules are enforced with no exceptions. Remove an entry once the site fixes the issue.
 */
const noH1 = { rule: 'page-has-heading-one', reason: 'The page has no level-one heading.' };

export const knownViolations: Record<string, { rule: string; reason: string }[]> = {
  login: [noH1, { rule: 'region', reason: 'The logo is outside any landmark region.' }],
  inventory: [noH1],
  'product details': [noH1],
  cart: [noH1],
  'checkout information': [noH1],
  'checkout overview': [noH1],
  'checkout complete': [noH1],
};

/** WCAG 2.0 and 2.1, levels A and AA, plus axe's best-practice rules. */
export const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'];
