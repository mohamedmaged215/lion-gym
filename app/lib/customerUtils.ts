import { addDays } from "./dates";

export function calculateEndDate(startDate: string, durationDays: number): string {
  return addDays(startDate, durationDays);
}

export function calculateStatus(
  endDate: string,
  subscriptionType?: "monthly" | "session"
): "active" | "expiring" | "expired" | "session" {
  if (subscriptionType === "session") return "session";

  const [year, month, day] = endDate.split("-").map(Number);
  const end = new Date(year, month - 1, day);
  const today = new Date();
  const diffDays = Math.round(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      86_400_000
  );

  if (diffDays < 0) return "expired";
  if (diffDays >= 0 && diffDays <= 3) return "expiring";
  return "active";
}
