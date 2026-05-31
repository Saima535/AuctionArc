/**
 * Centralizes platform commission math for auction-win and buy-now orders.
 */

export const PLATFORM_COMMISSION_RATE = 0.05;

function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

export function calculateCommissionBreakdown(amount = 0) {
  const grossAmount = roundMoney(amount);
  const commissionAmount = roundMoney(grossAmount * PLATFORM_COMMISSION_RATE);
  const sellerPayoutAmount = roundMoney(Math.max(grossAmount - commissionAmount, 0));

  return {
    grossAmount,
    commissionAmount,
    sellerPayoutAmount,
  };
}

export function getOrderFinancials(order) {
  const breakdown = calculateCommissionBreakdown(order?.amount || 0);

  return {
    grossAmount: breakdown.grossAmount,
    commissionAmount:
      typeof order?.commissionAmount === "number"
        ? roundMoney(order.commissionAmount)
        : breakdown.commissionAmount,
    sellerPayoutAmount:
      typeof order?.sellerPayoutAmount === "number"
        ? roundMoney(order.sellerPayoutAmount)
        : typeof order?.escrowAmount === "number" && order.escrowAmount > 0
          ? roundMoney(order.escrowAmount)
          : breakdown.sellerPayoutAmount,
  };
}
