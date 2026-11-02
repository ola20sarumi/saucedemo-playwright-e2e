/**
 * Credentials come from environment variables (see `.env.example`) so a real project could
 * inject secrets from CI. The fallbacks are Sauce Demo's public demo accounts, published on
 * its login page, so the suite still runs with zero setup.
 */
export const PASSWORD = process.env.USER_PASSWORD ?? 'secret_sauce';

export const users = {
  standard: process.env.STANDARD_USER ?? 'standard_user',
  lockedOut: process.env.LOCKED_OUT_USER ?? 'locked_out_user',
};

/** Each row is one invalid login attempt and the error it should produce. */
export const invalidLogins = [
  {
    scenario: 'a wrong password',
    username: users.standard,
    password: 'wrong_password',
    error: 'Epic sadface: Username and password do not match any user in this service',
  },
  {
    scenario: 'an unknown username',
    username: 'unknown_user',
    password: PASSWORD,
    error: 'Epic sadface: Username and password do not match any user in this service',
  },
  {
    scenario: 'a locked-out user',
    username: users.lockedOut,
    password: PASSWORD,
    error: 'Epic sadface: Sorry, this user has been locked out.',
  },
  {
    scenario: 'an empty username',
    username: '',
    password: PASSWORD,
    error: 'Epic sadface: Username is required',
  },
  {
    scenario: 'an empty password',
    username: users.standard,
    password: '',
    error: 'Epic sadface: Password is required',
  },
];
