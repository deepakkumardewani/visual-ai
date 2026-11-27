import type { PaymentRecord } from '@visual-ai/shared';

/** Every receipt stored before USD packs existed was charged in INR and has no currency field. */
const LEGACY_PAYMENT_CURRENCY = 'INR';

/** Formats a stored receipt amount (major units) in the currency it was actually charged in. */
export function formatPaymentAmount(
  payment: Pick<PaymentRecord, 'amount' | 'currency'>,
  locale?: string,
): string {
  const currency = payment.currency || LEGACY_PAYMENT_CURRENCY;
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(payment.amount);
}
