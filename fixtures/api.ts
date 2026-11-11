import { test as base, expect } from '@playwright/test';
import { apiCredentials, newBooking, type Booking } from '../test-data/bookings';

type ApiFixtures = {
  /** An auth token for write operations, sent by Restful-booker as a `token` cookie. */
  authToken: string;
  /** A booking created for this test through the API and deleted again afterwards. */
  booking: { id: number; data: Booking };
};

/**
 * Fixtures for the API tests. Each test gets its own booking, so tests never share or depend
 * on each other's data, and the booking is cleaned up even when the test fails.
 */
export const test = base.extend<ApiFixtures>({
  authToken: async ({ request }, use) => {
    const response = await request.post('/auth', { data: apiCredentials });
    expect(response.ok()).toBe(true);
    const { token } = (await response.json()) as { token?: string };
    if (!token) throw new Error('Logging in with the API credentials did not return a token.');
    await use(token);
  },

  booking: async ({ request, authToken }, use) => {
    const data = newBooking();
    const response = await request.post('/booking', { data });
    expect(response.ok()).toBe(true);
    const { bookingid } = (await response.json()) as { bookingid: number };

    await use({ id: bookingid, data });

    // A test may already have deleted it, so a 404/405 here is fine.
    await request.delete(`/booking/${bookingid}`, { headers: { Cookie: `token=${authToken}` } });
  },
});

export { expect };
