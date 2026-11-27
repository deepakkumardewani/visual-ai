import { describe, expect, it } from 'vitest';

import { formatPaymentAmount } from '@/utils/paymentAmount';

describe('formatPaymentAmount', () => {
  it('formats a USD receipt in dollars', () => {
    expect(formatPaymentAmount({ amount: 5, currency: 'USD' }, 'en-US')).toBe('$5.00');
  });

  it('formats an INR receipt in rupees', () => {
    expect(formatPaymentAmount({ amount: 249, currency: 'INR' }, 'en-IN')).toBe('₹249.00');
  });

  it('treats a legacy receipt with no currency as INR', () => {
    expect(formatPaymentAmount({ amount: 130 }, 'en-IN')).toBe('₹130.00');
  });
});
