/**
 * Data for the API tests, which target Restful-booker, a public practice API, not Sauce Demo.
 * The admin credentials are the public ones from its documentation; override them in `.env`.
 */
export const apiCredentials = {
  username: process.env.API_USERNAME ?? 'admin',
  password: process.env.API_PASSWORD ?? 'password123',
};

export type Booking = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: { checkin: string; checkout: string };
  additionalneeds?: string;
};

/**
 * A booking with a unique last name, so tests running in parallel (or other people using the
 * shared public API) never match each other's data when searching.
 */
export function newBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Ada',
    lastname: `Lovelace-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    totalprice: 120,
    depositpaid: true,
    bookingdates: { checkin: '2027-01-10', checkout: '2027-01-14' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
