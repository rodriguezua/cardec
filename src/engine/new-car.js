/**
 * Flow 2A (new car acquisition) model.
 *
 * Port of validation/new_car.py, sharing its locked conventions. The UI must
 * call this module rather than reimplementing any formula.
 */

import {
  annualCostFlows,
  compound,
  discountFactor,
  exponentialValue,
  levelMonthlyCost,
  loanBalance,
  loanPayment,
  monthlyRate,
  npv,
} from './finance.js';

export const RETURN = 'return';
export const BUYOUT = 'buyout';

/**
 * @typedef {Object} Scenario
 * @property {{ msrp: number, resaleAnchorMonth: number, resaleAnchorValue: number }} vehicle
 * @property {number} outTheDoor
 * @property {{ annualGovernmentCharges: number, annualEnergy: number }} ownership
 * @property {{ available: number, grossAnnualReturn: number }} capital
 * @property {number} discountRateAnnual
 * @property {{ downPayment: number, apr: number, termMonths: number }} [loan]
 * @property {Object} [lease]
 */

/**
 * Market value of the vehicle at a given month.
 * @param {Scenario['vehicle']} vehicle
 * @param {number} month
 * @returns {number}
 */
export function marketValue(vehicle, month) {
  return exponentialValue(
    vehicle.msrp,
    vehicle.resaleAnchorMonth,
    vehicle.resaleAnchorValue,
    month,
  );
}

function annualOwnershipTotal(ownership) {
  return ownership.annualGovernmentCharges + ownership.annualEnergy;
}

function notComparable(path, horizonMonths, reason) {
  return { path, horizonMonths, comparable: false, reason };
}

/**
 * Shared finalization: NPV, level monthly cost, overlay balances.
 */
function finalize(path, scenario, horizonMonths, flows, timeZeroOutlay, vehicleEquity) {
  const rate = monthlyRate(scenario.discountRateAnnual);
  const costNpv = npv(flows, rate);
  const { available, grossAnnualReturn } = scenario.capital;

  // The overlay invests only capital unused at time zero. Recurring payments
  // are handled as cash flows in cost NPV, never withdrawn from this balance.
  const investedPrincipal = Math.max(available - timeZeroOutlay, 0);
  const investmentBalance = compound(investedPrincipal, grossAnnualReturn, horizonMonths);
  const foregoneGain =
    timeZeroOutlay * ((1 + grossAnnualReturn) ** (horizonMonths / 12) - 1);
  const investmentAdjustedNpv =
    costNpv + foregoneGain * discountFactor(rate, horizonMonths);

  return {
    path,
    horizonMonths,
    comparable: true,
    reason: null,
    affordable: available + 1e-9 >= timeZeroOutlay,
    timeZeroOutlay,
    costNpv,
    monthlyOwnershipCost: levelMonthlyCost(costNpv, rate, horizonMonths),
    vehicleEquity,
    investedPrincipal,
    investmentBalance,
    investmentAdjustedNpv,
    investmentAdjustedMonthlyCost: levelMonthlyCost(
      investmentAdjustedNpv,
      rate,
      horizonMonths,
    ),
    flows,
  };
}

/**
 * @param {Scenario} scenario
 * @param {number} horizonMonths
 */
export function cashPath(scenario, horizonMonths) {
  const resale = marketValue(scenario.vehicle, horizonMonths);
  const flows = [
    { month: 0, amount: scenario.outTheDoor },
    ...annualCostFlows(annualOwnershipTotal(scenario.ownership), horizonMonths),
    { month: horizonMonths, amount: -resale },
  ];
  return finalize('cash', scenario, horizonMonths, flows, scenario.outTheDoor, resale);
}

/**
 * @param {Scenario} scenario
 * @param {number} horizonMonths
 */
export function loanPath(scenario, horizonMonths) {
  const loan = scenario.loan;
  if (!loan) return notComparable('loan', horizonMonths, 'no loan terms supplied');

  const principal = scenario.outTheDoor - loan.downPayment;
  if (principal < 0) {
    return notComparable('loan', horizonMonths, 'down payment exceeds out-the-door price');
  }

  const payment = loanPayment(principal, loan.apr, loan.termMonths);
  const paidMonths = Math.min(horizonMonths, loan.termMonths);
  const balance = loanBalance(principal, loan.apr, loan.termMonths, paidMonths);
  const resale = marketValue(scenario.vehicle, horizonMonths);

  const flows = [{ month: 0, amount: loan.downPayment }];
  for (let month = 1; month <= paidMonths; month += 1) {
    flows.push({ month, amount: payment });
  }
  flows.push(...annualCostFlows(annualOwnershipTotal(scenario.ownership), horizonMonths));
  flows.push({ month: horizonMonths, amount: -(resale - balance) });

  const result = finalize(
    'loan',
    scenario,
    horizonMonths,
    flows,
    loan.downPayment,
    resale - balance,
  );
  result.monthlyPayment = payment;
  result.outstandingBalance = balance;
  return result;
}

/**
 * @param {Scenario} scenario
 * @param {number} horizonMonths
 * @param {'return'|'buyout'} leaseEnd
 */
export function leasePath(scenario, horizonMonths, leaseEnd = RETURN) {
  const lease = scenario.lease;
  if (!lease) return notComparable('lease', horizonMonths, 'no lease terms supplied');

  const label = horizonMonths <= lease.termMonths ? 'lease' : 'lease-then-buyout';

  if (horizonMonths < lease.termMonths) {
    return notComparable(
      label,
      horizonMonths,
      'holding period ends before lease maturity and no early-termination or buyout quote was supplied',
    );
  }
  if (horizonMonths > lease.termMonths && leaseEnd !== BUYOUT) {
    return notComparable(
      label,
      horizonMonths,
      'holding period exceeds the lease term, which requires a buyout or replacement-lease path',
    );
  }

  const scheduled = lease.firstPaymentInDueAtSigning === false
    ? lease.termMonths
    : lease.termMonths - 1;

  const flows = [{ month: 0, amount: lease.dueAtSigning }];
  for (let month = 1; month <= scheduled; month += 1) {
    flows.push({ month, amount: lease.monthlyPayment });
  }
  flows.push(...annualCostFlows(annualOwnershipTotal(scenario.ownership), horizonMonths));

  let vehicleEquity = 0;
  if (leaseEnd === RETURN) {
    flows.push({ month: lease.termMonths, amount: lease.dispositionFee });
  } else {
    flows.push({
      month: lease.termMonths,
      amount: lease.buyoutPrice + (lease.buyoutFees ?? 0),
    });
    vehicleEquity = marketValue(scenario.vehicle, horizonMonths);
    flows.push({ month: horizonMonths, amount: -vehicleEquity });
  }

  const path = leaseEnd === RETURN ? label : `${label}-buyout`;
  return finalize(path, scenario, horizonMonths, flows, lease.dueAtSigning, vehicleEquity);
}

/**
 * Evaluate every enabled path at one horizon.
 * @param {Scenario} scenario
 * @param {number} horizonMonths
 */
export function comparePaths(scenario, horizonMonths) {
  return [
    cashPath(scenario, horizonMonths),
    loanPath(scenario, horizonMonths),
    leasePath(scenario, horizonMonths, RETURN),
    leasePath(scenario, horizonMonths, BUYOUT),
  ];
}
