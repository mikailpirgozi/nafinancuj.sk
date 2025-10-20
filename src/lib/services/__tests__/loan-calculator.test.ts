import { describe, it, expect } from "vitest";
import {
  generateInstallments,
  calculateEarlyRepayment,
} from "../loan-calculator";

describe("Loan Calculator", () => {
  describe("generateInstallments", () => {
    it("should generate correct number of installments", () => {
      const installments = generateInstallments({
        loanAmount: 10000,
        annualRate: 5,
        durationMonths: 12,
        startDate: new Date("2024-01-01"),
      });

      expect(installments).toHaveLength(12);
    });

    it("should calculate correct monthly payment for standard loan", () => {
      const installments = generateInstallments({
        loanAmount: 10000,
        annualRate: 5,
        durationMonths: 12,
        startDate: new Date("2024-01-01"),
      });

      const firstInstallment = installments[0];
      expect(firstInstallment.principalAmount).toBeGreaterThan(0);
      expect(firstInstallment.interestAmount).toBeGreaterThan(0);
    });

    it("should handle 0% interest rate", () => {
      const installments = generateInstallments({
        loanAmount: 10000,
        annualRate: 0,
        durationMonths: 12,
        startDate: new Date("2024-01-01"),
      });

      expect(installments).toHaveLength(12);
      // Each installment should be exactly 10000/12
      const expectedPayment = 10000 / 12;
      installments.forEach((inst) => {
        expect(inst.interestAmount).toBe(0);
        expect(inst.principalAmount).toBeCloseTo(expectedPayment, 0);
      });
    });

    it("should handle single month loan", () => {
      const installments = generateInstallments({
        loanAmount: 5000,
        annualRate: 10,
        durationMonths: 1,
        startDate: new Date("2024-01-01"),
      });

      expect(installments).toHaveLength(1);
      expect(installments[0].principalAmount + installments[0].interestAmount).toBeCloseTo(5000, 1);
    });

    it("should handle long-term loan (120 months)", () => {
      const installments = generateInstallments({
        loanAmount: 50000,
        annualRate: 3.5,
        durationMonths: 120,
        startDate: new Date("2024-01-01"),
      });

      expect(installments).toHaveLength(120);
      
      // Total should match loan amount
      const totalPayment = installments.reduce(
        (sum, inst) => sum + inst.principalAmount + inst.interestAmount,
        0
      );
      expect(totalPayment).toBeCloseTo(50000, -1);
    });

    it("should generate increasing due dates", () => {
      const installments = generateInstallments({
        loanAmount: 10000,
        annualRate: 5,
        durationMonths: 12,
        startDate: new Date("2024-01-01"),
      });

      for (let i = 1; i < installments.length; i++) {
        expect(installments[i].dueDate.getTime()).toBeGreaterThan(
          installments[i - 1].dueDate.getTime()
        );
      }
    });

    it("should have each installment contain positive values", () => {
      const installments = generateInstallments({
        loanAmount: 10000,
        annualRate: 5,
        durationMonths: 12,
        startDate: new Date("2024-01-01"),
      });

      installments.forEach((inst) => {
        expect(inst.principalAmount).toBeGreaterThanOrEqual(0);
        expect(inst.interestAmount).toBeGreaterThanOrEqual(0);
        expect(inst.totalAmount).toBeGreaterThan(0);
      });
    });

    it("should correctly round to cents", () => {
      const installments = generateInstallments({
        loanAmount: 10000,
        annualRate: 5.5,
        durationMonths: 36,
        startDate: new Date("2024-01-01"),
      });

      installments.forEach((inst) => {
        // Check that amounts don't have more than 2 decimal places
        const principalStr = inst.principalAmount.toString();
        const decimals = (principalStr.split(".")[1] || "").length;
        expect(decimals).toBeLessThanOrEqual(2);
      });
    });

    it("should handle very high interest rate", () => {
      const installments = generateInstallments({
        loanAmount: 10000,
        annualRate: 20,
        durationMonths: 12,
        startDate: new Date("2024-01-01"),
      });

      expect(installments).toHaveLength(12);
      expect(installments[0].interestAmount).toBeGreaterThan(0);
    });

    it("should accumulate principal payments to loan amount", () => {
      const loanAmount = 25000;
      const installments = generateInstallments({
        loanAmount,
        annualRate: 6,
        durationMonths: 24,
        startDate: new Date("2024-01-01"),
      });

      const totalPrincipal = installments.reduce(
        (sum, inst) => sum + inst.principalAmount,
        0
      );
      
      expect(totalPrincipal).toBeCloseTo(loanAmount, 0);
    });
  });

  describe("calculateEarlyRepayment", () => {
    it("should calculate correct remaining with 50% interest discount", () => {
      const result = calculateEarlyRepayment(5000, 1000);

      expect(result.principal).toBe(5000);
      expect(result.discount).toBe(500); // 50% of 1000
      expect(result.interest).toBe(500); // 1000 - 500
      expect(result.total).toBe(5500); // 5000 + 500
    });

    it("should handle zero interest", () => {
      const result = calculateEarlyRepayment(10000, 0);

      expect(result.principal).toBe(10000);
      expect(result.discount).toBe(0);
      expect(result.interest).toBe(0);
      expect(result.total).toBe(10000);
    });

    it("should handle zero principal", () => {
      const result = calculateEarlyRepayment(0, 500);

      expect(result.principal).toBe(0);
      expect(result.discount).toBe(250);
      expect(result.interest).toBe(250);
      expect(result.total).toBe(250);
    });

    it("should handle large amounts", () => {
      const result = calculateEarlyRepayment(500000, 50000);

      expect(result.principal).toBe(500000);
      expect(result.discount).toBe(25000);
      expect(result.interest).toBe(25000);
      expect(result.total).toBe(525000);
    });

    it("should always apply 50% discount", () => {
      const testCases = [
        { principal: 1000, interest: 100 },
        { principal: 5000, interest: 250 },
        { principal: 10000, interest: 1000 },
        { principal: 50000, interest: 5000 },
      ];

      testCases.forEach(({ principal, interest }) => {
        const result = calculateEarlyRepayment(principal, interest);
        expect(result.discount).toBe(interest / 2);
        expect(result.interest).toBe(interest / 2);
        expect(result.total).toBe(principal + interest / 2);
      });
    });

    it("should maintain consistency across multiple calls", () => {
      const result1 = calculateEarlyRepayment(3000, 300);
      const result2 = calculateEarlyRepayment(3000, 300);

      expect(result1).toEqual(result2);
    });
  });
});

