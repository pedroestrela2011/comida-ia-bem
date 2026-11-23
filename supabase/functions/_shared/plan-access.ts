export type RequiredPlan = "essencial" | "equilibrio" | "performance";

export function hasPaidPlanAccess(
  input: { plan: unknown; subscriptionActive: boolean; isAdmin: boolean },
  requiredPlan: RequiredPlan,
): boolean {
  if (input.isAdmin) return true;
  if (!input.subscriptionActive) return false;

  const ranks: Record<RequiredPlan, number> = {
    essencial: 1,
    equilibrio: 2,
    performance: 3,
  };
  const planRank = typeof input.plan === "string" && input.plan in ranks
    ? ranks[input.plan as RequiredPlan]
    : 0;
  return planRank >= ranks[requiredPlan];
}
