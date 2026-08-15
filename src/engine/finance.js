/**
 * Deterministic financial primitives.
 *
 * Port of validation/finance.py. The Python harness remains an independent
 * reference implementation; both are locked to the same expected values.
 *
 * Conventions (docs/multi-flow-ux.md):
 * - Discount rates are effective annual, converted geometrically to monthly.
 * - Loan APRs are nominal annual rates divided by 12.
 * - Month zero is the transaction date; recurring payments land at period end.
 */

/** @typedef {{ month: number, amount: number }} CashFlow */

/**
 * Convert an effective annual rate to its geometric monthly equivalent.
 * @param {number} annualRate
 * @returns {number}
 */
export function monthlyRate(annualRate) {
  return (1 + annualRate) ** (1 / 12) - 1;
}

/**
 * @param {number} ratePerMonth
 * @param {number} month
 * @returns {number}
 */
export function discountFactor(ratePerMonth, month) {
  if (month < 0) throw new RangeError('month must not be negative');
  return (1 + ratePerMonth) ** -month;
}

/**
 * Present value of cash flows, where positive amounts are costs.
 * @param {CashFlow[]} flows
 * @param {number} ratePerMonth
 * @returns {number}
 */
export function npv(flows, ratePerMonth) {
  return flows.reduce(
    (total, { month, amount }) => total + amount * discountFactor(ratePerMonth, month),
    0,
  );
}

/**
 * Equivalent level monthly cost of a present value over a holding period.
 * @param {number} costNpv
 * @param {number} ratePerMonth
 * @param {number} months
 * @returns {number}
 */
export function levelMonthlyCost(costNpv, ratePerMonth, months) {
  if (months <= 0) throw new RangeError('months must be positive');
  if (ratePerMonth === 0) return costNpv / months;
  return (costNpv * ratePerMonth) / (1 - (1 + ratePerMonth) ** -months);
}

/**
 * @param {number} principal
 * @param {number} apr
 * @param {number} termMonths
 * @returns {number}
 */
export function loanPayment(principal, apr, termMonths) {
  if (termMonths <= 0) throw new RangeError('termMonths must be positive');
  const rate = apr / 12;
  if (rate === 0) return principal / termMonths;
  return (principal * rate) / (1 - (1 + rate) ** -termMonths);
}

/**
 * Remaining balance after `elapsedMonths` scheduled payments.
 * @param {number} principal
 * @param {number} apr
 * @param {number} termMonths
 * @param {number} elapsedMonths
 * @returns {number}
 */
export function loanBalance(principal, apr, termMonths, elapsedMonths) {
  if (elapsedMonths < 0) throw new RangeError('elapsedMonths must not be negative');
  if (elapsedMonths >= termMonths) return 0;
  const rate = apr / 12;
  const payment = loanPayment(principal, apr, termMonths);
  if (rate === 0) return principal - payment * elapsedMonths;
  const growth = (1 + rate) ** elapsedMonths;
  return principal * growth - (payment * (growth - 1)) / rate;
}

/**
 * Exponential depreciation curve through (0, initial) and (anchorMonth, anchor).
 * Used for interpolation and extrapolation; never returns a negative value.
 * @param {number} initialValue
 * @param {number} anchorMonth
 * @param {number} anchorValue
 * @param {number} month
 * @returns {number}
 */
export function exponentialValue(initialValue, anchorMonth, anchorValue, month) {
  if (anchorMonth <= 0) throw new RangeError('anchorMonth must be positive');
  if (initialValue <= 0 || anchorValue <= 0) {
    throw new RangeError('values must be positive to fit an exponential curve');
  }
  return initialValue * (anchorValue / initialValue) ** (month / anchorMonth);
}

/**
 * Recurring annual costs posted at the end of each completed year.
 * @param {number} annualAmount
 * @param {number} horizonMonths
 * @returns {CashFlow[]}
 */
export function annualCostFlows(annualAmount, horizonMonths) {
  const flows = [];
  for (let month = 12; month <= horizonMonths; month += 12) {
    flows.push({ month, amount: annualAmount });
  }
  return flows;
}

/**
 * Gross balance with yearly compounding, as used by the capital overlay.
 * @param {number} principal
 * @param {number} annualReturn
 * @param {number} months
 * @returns {number}
 */
export function compound(principal, annualReturn, months) {
  return principal * (1 + annualReturn) ** (months / 12);
}
