/**
 * The documented Flow 2A validation fixture.
 *
 * Source: docs/multi-flow-ux.md, "Flow 2A numerical validation snapshot".
 * This is a test and demonstration scenario, not a market quote.
 */

export const FLOW_2A_MSRP = 46630.0;
export const FLOW_2A_INCENTIVE = 7500.0;
export const FLOW_2A_OUT_THE_DOOR = 42000.0;
export const FLOW_2A_LEASE_DRIVE_OFF = 4118.15;
export const FLOW_2A_BASELINE_DOWN = 8400.0;

/**
 * @param {Partial<{ availableCapital: number, downPayment: number, apr: number,
 *   loanTermMonths: number, discountRateAnnual: number, grossAnnualReturn: number }>} [overrides]
 */
export function flow2aScenario(overrides = {}) {
  const {
    availableCapital = FLOW_2A_OUT_THE_DOOR,
    downPayment = FLOW_2A_BASELINE_DOWN,
    apr = 0.0399,
    loanTermMonths = 60,
    discountRateAnnual = 0.015,
    grossAnnualReturn = 0.1,
  } = overrides;

  return {
    vehicle: {
      msrp: FLOW_2A_MSRP,
      resaleAnchorMonth: 36,
      resaleAnchorValue: 29369.4,
    },
    outTheDoor: FLOW_2A_OUT_THE_DOOR,
    ownership: {
      annualGovernmentCharges: 1423.44,
      annualEnergy: 220.0,
    },
    capital: {
      available: availableCapital,
      grossAnnualReturn,
    },
    discountRateAnnual,
    loan: {
      downPayment,
      apr,
      termMonths: loanTermMonths,
    },
    lease: {
      dueAtSigning: FLOW_2A_LEASE_DRIVE_OFF,
      monthlyPayment: 368.15,
      termMonths: 36,
      dispositionFee: 395.0,
      buyoutPrice: 29369.4,
      buyoutFees: 500.0,
      firstPaymentInDueAtSigning: true,
    },
  };
}
