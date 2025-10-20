import { describe, it, expect } from "vitest";
import {
  calculateAmortizingLoan,
  calculateInterestOnlyLoan,
  calculateEarlyRepayment,
} from "../loan-calculator";

describe("Loan Calculator", () => {
  describe("calculateAmortizingLoan", () => {
    it("should calculate correct installments for standard loan", () => {
      const result = calculateAmortizingLoan({
        amount: 10000_00, // €10,000
        interestRateAnnual: 5,
        durationMonths: 12,
        startDate: new Date("2025-01-01"),
      });

      expect(result.installments).toHaveLength(12);
      expect(result.totalInterest).toBeGreaterThan(0);
      
      // Check first installment
      const first = result.installments[0];
      expect(first.principalAmount).toBeGreaterThan(0);
      expect(first.interestAmount).toBeGreaterThan(0);
      expect(first.totalAmount).toBe(first.principalAmount + first.interestAmount);
    });

    it("should handle 0% interest rate", () => {
      const result = calculateAmortizingLoan({
        amount: 12000_00,
        interestRateAnnual: 0,
        durationMonths: 12,
        startDate: new Date("2025-01-01"),
      });

      expect(result.totalInterest).toBe(0);
      result.installments.forEach((inst) => {
        expect(inst.interestAmount).toBe(0);
        expect(inst.principalAmount).toBe(100000); // 12000 / 12
      });
    });

    it("should handle 1 month duration", () => {
      const result = calculateAmortizingLoan({
        amount: 5000_00,
        interestRateAnnual: 10,
        durationMonths: 1,
        startDate: new Date("2025-01-01"),
      });

      expect(result.installments).toHaveLength(1);
      expect(result.installments[0].principalAmount).toBe(5000_00);
    });

    it("should handle long duration (360 months)", () => {
      const result = calculateAmortizingLoan({
        amount: 100000_00,
        interestRateAnnual: 3.5,
        durationMonths: 360,
        startDate: new Date("2025-01-01"),
      });

      expect(result.installments).toHaveLength(360);
      expect(result.totalInterest).toBeGreaterThan(0);
    });

    it("should have correct rounding precision", () => {
      const result = calculateAmortizingLoan({
        amount: 10000_00,
        interestRateAnnual: 5.25,
        durationMonths: 12,
        startDate: new Date("2025-01-01"),
      });

      result.installments.forEach((inst) => {
        // All amounts should be integers (cents)
        expect(Number.isInteger(inst.principalAmount)).toBe(true);
        expect(Number.isInteger(inst.interestAmount)).toBe(true);
        expect(Number.isInteger(inst.totalAmount)).toBe(true);
      });
    });
  });

  describe("calculateInterestOnlyLoan", () => {
    it("should calculate correct interest-only installments", () => {
      const result = calculateInterestOnlyLoan({
        amount: 20000_00,
        interestRateAnnual: 6,
        durationMonths: 12,
        startDate: new Date("2025-01-01"),
      });

      expect(result.installments).toHaveLength(12);
      
      // All installments except last should have same interest
      const monthlyInterest = result.installments[0].interestAmount;
      for (let i = 0; i < 11; i++) {
        expect(result.installments[i].principalAmount).toBe(0);
        expect(result.installments[i].interestAmount).toBe(monthlyInterest);
      }

      // Last installment should include full principal
      const last = result.installments[11];
      expect(last.principalAmount).toBe(20000_00);
      expect(last.interestAmount).toBe(monthlyInterest);
    });

    it("should handle 0% interest rate", () => {
      const result = calculateInterestOnlyLoan({
        amount: 15000_00,
        interestRateAnnual: 0,
        durationMonths: 6,
        startDate: new Date("2025-01-01"),
      });

      // All installments except last should be 0
      for (let i = 0; i < 5; i++) {
        expect(result.installments[i].totalAmount).toBe(0);
      }

      // Last installment is full principal
      expect(result.installments[5].totalAmount).toBe(15000_00);
    });
  });

  describe("calculateEarlyRepayment", () => {
    it("should calculate 50% discount on interest", () => {
      const principal = 10000_00;
      const interest = 1000_00;

      const result = calculateEarlyRepayment(principal, interest);

      expect(result.principal).toBe(principal);
      expect(result.discount).toBe(500_00); // 50% of 1000
      expect(result.interest).toBe(500_00); // Remaining 50%
      expect(result.total).toBe(10500_00); // principal + discounted interest
    });

    it("should handle 0 interest", () => {
      const result = calculateEarlyRepayment(5000_00, 0);

      expect(result.discount).toBe(0);
      expect(result.interest).toBe(0);
      expect(result.total).toBe(5000_00);
    });

    it("should round correctly", () => {
      const result = calculateEarlyRepayment(10000_00, 999_00);

      // 50% of 999 = 499.5, should round to 500
      expect(result.discount).toBe(500_00);
      expect(result.interest).toBe(499_00);
      expect(Number.isInteger(result.total)).toBe(true);
    });
  });
});

