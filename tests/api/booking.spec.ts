import { test, expect } from '../../fixtures/api';
import { apiCredentials, newBooking, type Booking } from '../../test-data/bookings';

/*
 * API tests against Restful-booker (https://restful-booker.herokuapp.com), a public API built for
 * practising API testing. Sauce Demo has no backend API, so these exercise Playwright's `request`
 * fixture against a separate service. Restful-booker has some deliberate quirks (for example,
 * DELETE returns 201 and bad credentials return 200); the tests assert its real behaviour and
 * say so where it differs from what a typical REST API would do.
 */

test.describe('Booking API', () => {
  test('health check responds', { tag: '@smoke' }, async ({ request }) => {
    const response = await request.get('/ping');

    expect(response.status()).toBe(201);
  });

  test('creates a booking and returns it by id', { tag: '@smoke' }, async ({ request, authToken }) => {
    const data = newBooking();

    const created = await request.post('/booking', { data });
    expect(created.ok()).toBe(true);
    const { bookingid, booking } = (await created.json()) as { bookingid: number; booking: Booking };
    expect(bookingid).toEqual(expect.any(Number));
    expect(booking).toEqual(data);

    const fetched = await request.get(`/booking/${bookingid}`);
    expect(fetched.ok()).toBe(true);
    expect(await fetched.json()).toEqual(data);

    // Clean up, since this booking wasn't made by the `booking` fixture.
    await request.delete(`/booking/${bookingid}`, { headers: { Cookie: `token=${authToken}` } });
  });

  test('finds a booking by guest name', async ({ request, booking }) => {
    const response = await request.get('/booking', {
      params: { firstname: booking.data.firstname, lastname: booking.data.lastname },
    });

    expect(response.ok()).toBe(true);
    expect(await response.json()).toEqual([{ bookingid: booking.id }]);
  });

  test('replaces a booking with PUT', async ({ request, booking, authToken }) => {
    const replacement = newBooking({ firstname: 'Grace', totalprice: 250, depositpaid: false });

    const response = await request.put(`/booking/${booking.id}`, {
      data: replacement,
      headers: { Cookie: `token=${authToken}` },
    });

    expect(response.ok()).toBe(true);
    expect(await response.json()).toEqual(replacement);
  });

  test('updates only the given fields with PATCH', async ({ request, booking, authToken }) => {
    const response = await request.patch(`/booking/${booking.id}`, {
      data: { totalprice: 200 },
      headers: { Cookie: `token=${authToken}` },
    });

    expect(response.ok()).toBe(true);
    expect(await response.json()).toEqual({ ...booking.data, totalprice: 200 });
  });

  test('deletes a booking', async ({ request, booking, authToken }) => {
    const response = await request.delete(`/booking/${booking.id}`, {
      headers: { Cookie: `token=${authToken}` },
    });

    // Restful-booker returns 201 Created for a successful delete, not the usual 200 or 204.
    expect(response.status()).toBe(201);
    expect((await request.get(`/booking/${booking.id}`)).status()).toBe(404);
  });

  test('returns 404 for a booking that does not exist', async ({ request }) => {
    const response = await request.get('/booking/999999999');

    expect(response.status()).toBe(404);
  });

  test('rejects a booking with missing required fields', async ({ request }) => {
    const response = await request.post('/booking', { data: { firstname: 'Ada' } });

    // Restful-booker answers with 500 here rather than a 400, so only check that it was rejected.
    expect(response.ok()).toBe(false);
  });
});

test.describe('Booking API authorisation', () => {
  test('refuses to update a booking without a token', async ({ request, booking }) => {
    const response = await request.put(`/booking/${booking.id}`, { data: newBooking() });

    expect(response.status()).toBe(403);
  });

  test('refuses to delete a booking without a token', async ({ request, booking }) => {
    const response = await request.delete(`/booking/${booking.id}`);

    expect(response.status()).toBe(403);
    expect((await request.get(`/booking/${booking.id}`)).ok()).toBe(true);
  });

  test('does not issue a token for wrong credentials', async ({ request }) => {
    const response = await request.post('/auth', {
      data: { username: apiCredentials.username, password: 'wrong_password' },
    });

    // Restful-booker reports bad credentials in the body with a 200, rather than a 401.
    expect(await response.json()).toEqual({ reason: 'Bad credentials' });
  });
});
