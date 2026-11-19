/**
 * Calculates age from a YYYY-MM-DD birth date without local-time parsing.
 * Returns null for malformed or impossible dates so callers can fail closed.
 */
export function calculateAge(birthDate: string, today = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;

  const birth = new Date(`${birthDate}T00:00:00.000Z`);
  if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== birthDate) {
    return null;
  }

  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const birthdayHasNotOccurred =
    today.getUTCMonth() < birth.getUTCMonth()
    || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate());
  if (birthdayHasNotOccurred) age--;

  return age >= 0 ? age : null;
}

export function canCreateAccount(age: number | null): boolean {
  return age !== null && age >= 12;
}

export function requiresAdultCheckout(age: number | null): boolean {
  return age !== null && age >= 12 && age < 18;
}

export function canCheckoutDirectly(age: number | null): boolean {
  return age !== null && age >= 18;
}
