import { describe, it, expect } from "vitest";
import { createClientSchema, updateClientSchema } from "../client";

describe("Client Validators", () => {
  describe("createClientSchema", () => {
    it("should validate correct client data", () => {
      const validClient = {
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        companyName: "Test s.r.o.",
        ico: "12345678",
        dic: "SK1234567890",
        foundedAt: "2020-01-01",
        employeesCount: 10,
        annualRevenue: 100000,
        contactPerson: "John Doe",
        email: "john@test.com",
        phone: "+421901234567",
      };

      const result = createClientSchema.safeParse(validClient);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const invalidClient = {
        organizationId: "invalid-uuid",
        companyName: "Test s.r.o.",
        ico: "12345678",
        contactPerson: "John Doe",
        email: "john@test.com",
        phone: "+421901234567",
      };

      const result = createClientSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
    });

    it("should reject invalid email", () => {
      const invalidClient = {
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        companyName: "Test s.r.o.",
        ico: "12345678",
        contactPerson: "John Doe",
        email: "invalid-email",
        phone: "+421901234567",
      };

      const result = createClientSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
    });

    it("should reject short ICO", () => {
      const invalidClient = {
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        companyName: "Test s.r.o.",
        ico: "123", // Too short
        contactPerson: "John Doe",
        email: "john@test.com",
        phone: "+421901234567",
      };

      const result = createClientSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
    });

    it("should accept optional fields as undefined", () => {
      const minimalClient = {
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        companyName: "Test s.r.o.",
        ico: "12345678",
        contactPerson: "John Doe",
        email: "john@test.com",
        phone: "+421901234567",
      };

      const result = createClientSchema.safeParse(minimalClient);
      expect(result.success).toBe(true);
    });

    it("should reject negative employees count", () => {
      const invalidClient = {
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        companyName: "Test s.r.o.",
        ico: "12345678",
        contactPerson: "John Doe",
        email: "john@test.com",
        phone: "+421901234567",
        employeesCount: -5,
      };

      const result = createClientSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
    });

    it("should reject negative annual revenue", () => {
      const invalidClient = {
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        companyName: "Test s.r.o.",
        ico: "12345678",
        contactPerson: "John Doe",
        email: "john@test.com",
        phone: "+421901234567",
        annualRevenue: -1000,
      };

      const result = createClientSchema.safeParse(invalidClient);
      expect(result.success).toBe(false);
    });
  });

  describe("updateClientSchema", () => {
    it("should allow partial updates", () => {
      const partialUpdate = {
        companyName: "Updated Company",
      };

      const result = updateClientSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it("should validate email if provided", () => {
      const invalidUpdate = {
        email: "invalid-email",
      };

      const result = updateClientSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it("should allow empty update", () => {
      const emptyUpdate = {};

      const result = updateClientSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });

    it("should not allow organizationId update", () => {
      const invalidUpdate = {
        organizationId: "550e8400-e29b-41d4-a716-446655440000",
        companyName: "Updated Company",
      };

      const result = updateClientSchema.safeParse(invalidUpdate);
      // Should succeed but organizationId should be omitted
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("organizationId");
      }
    });
  });
});

