import { describe, expect, it } from "vitest";
import {
  calculateAge,
  canCreateAccount,
  canCheckoutDirectly,
  requiresAdultCheckout,
} from "@/lib/account-age";

describe("account age and checkout rules", () => {
  const today = new Date("2026-11-18T12:00:00.000Z");

  it("rejects malformed, impossible, and future birth dates", () => {
    expect(calculateAge("not-a-date", today)).toBeNull();
    expect(calculateAge("2026-02-30", today)).toBeNull();
    expect(calculateAge("2027-01-01", today)).toBeNull();
  });

  it("does not count a birthday before it occurs", () => {
    expect(calculateAge("2014-11-19", today)).toBe(11);
    expect(calculateAge("2014-11-18", today)).toBe(12);
  });

  it("requires at least 12 years to create an account", () => {
    expect(canCreateAccount(11)).toBe(false);
    expect(canCreateAccount(12)).toBe(true);
    expect(canCreateAccount(null)).toBe(false);
  });

  it("keeps ages 12 through 17 on the adult-responsible checkout path", () => {
    for (const age of [12, 13, 14, 15, 16, 17]) {
      expect(requiresAdultCheckout(age)).toBe(true);
      expect(canCheckoutDirectly(age)).toBe(false);
    }
  });

  it("allows direct checkout only from age 18", () => {
    expect(requiresAdultCheckout(18)).toBe(false);
    expect(canCheckoutDirectly(18)).toBe(true);
  });
});
