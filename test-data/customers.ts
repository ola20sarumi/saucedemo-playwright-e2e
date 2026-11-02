export type CustomerInfo = {
  firstName: string;
  lastName: string;
  postalCode: string;
};

export const customer: CustomerInfo = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  postalCode: 'SW1A 1AA',
};

/** Each row blanks one required checkout field and gives the error it should produce. */
export const missingCustomerFields = [
  { field: 'first name', info: { ...customer, firstName: '' }, error: 'Error: First Name is required' },
  { field: 'last name', info: { ...customer, lastName: '' }, error: 'Error: Last Name is required' },
  { field: 'postal code', info: { ...customer, postalCode: '' }, error: 'Error: Postal Code is required' },
];
