/**
 * Loan Calculator Service
 * Handles all loan and installment calculations
 */

export interface InstallmentCalculation {
  dueDate: Date;
  principalAmount: number; // in cents
  interestAmount: number; // in cents
  totalAmount: number; // in cents
}

/**
 * Calculate monthly payment for amortizing loan using PMT formula
 * PMT = P × [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateAmortizingPayment(
  principal: number, // in cents
  monthlyRate: number, // as decimal (e.g., 0.0104 for 1.04%)
  months: number
): number {
  if (monthlyRate === 0) {
    return Math.round(principal / months);
  }

  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;

  return Math.round(numerator / denominator);
}

/**
 * Calculate interest-only monthly payment
 */
export function calculateInterestOnlyPayment(
  principal: number, // in cents
  monthlyRate: number // as decimal
): number {
  return Math.round(principal * monthlyRate);
}

/**
 * Generate installment schedule for amortizing loan
 */
export function generateAmortizingSchedule(
  principal: number, // in cents
  monthlyRate: number, // as decimal
  months: number,
  startDate: Date
): InstallmentCalculation[] {
  const monthlyPayment = calculateAmortizingPayment(
    principal,
    monthlyRate,
    months
  );
  let remainingPrincipal = principal;
  const schedule: InstallmentCalculation[] = [];

  for (let i = 1; i <= months; i++) {
    const interestAmount = Math.round(remainingPrincipal * monthlyRate);
    let principalAmount = monthlyPayment - interestAmount;

    // Last installment: adjust for rounding errors
    if (i === months) {
      principalAmount = remainingPrincipal;
    }

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      dueDate,
      principalAmount,
      interestAmount,
      totalAmount: principalAmount + interestAmount,
    });

    remainingPrincipal -= principalAmount;
  }

  return schedule;
}

/**
 * Generate installment schedule for interest-only loan
 */
export function generateInterestOnlySchedule(
  principal: number, // in cents
  monthlyRate: number, // as decimal
  months: number,
  startDate: Date
): InstallmentCalculation[] {
  const interestPayment = calculateInterestOnlyPayment(principal, monthlyRate);
  const schedule: InstallmentCalculation[] = [];

  for (let i = 1; i <= months; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    const isLastInstallment = i === months;

    schedule.push({
      dueDate,
      principalAmount: isLastInstallment ? principal : 0,
      interestAmount: interestPayment,
      totalAmount: isLastInstallment
        ? principal + interestPayment
        : interestPayment,
    });
  }

  return schedule;
}

/**
 * Calculate early repayment amount (50% discount on remaining interest)
 */
export function calculateEarlyRepayment(
  remainingPrincipal: number, // in cents
  remainingInterest: number // in cents (sum of all future interest)
): {
  principal: number;
  interest: number;
  discount: number;
  total: number;
} {
  const discountedInterest = Math.round(remainingInterest * 0.5);
  const discount = remainingInterest - discountedInterest;

  return {
    principal: remainingPrincipal,
    interest: discountedInterest,
    discount,
    total: remainingPrincipal + discountedInterest,
  };
}

/**
 * Convert annual interest rate to monthly
 */
export function annualToMonthlyRate(annualRate: number): number {
  return annualRate / 12 / 100;
}

/**
 * Convert monthly interest rate to annual
 */
export function monthlyToAnnualRate(monthlyRate: number): number {
  return monthlyRate * 12 * 100;
}

/**
 * Generate unique variable symbol for loan
 */
export function generateVariableSymbol(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");
  return `${timestamp}${random}`;
}

/**
 * Distribute partial payment between interest and principal
 */
export function distributePartialPayment(
  paymentAmount: number, // in cents
  interestDue: number, // in cents
  principalDue: number // in cents
): {
  interestPaid: number;
  principalPaid: number;
} {
  // First pay interest, then principal
  const interestPaid = Math.min(paymentAmount, interestDue);
  const principalPaid = Math.max(0, paymentAmount - interestDue);

  return {
    interestPaid,
    principalPaid: Math.min(principalPaid, principalDue),
  };
}

