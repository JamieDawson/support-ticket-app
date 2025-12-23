export function analyzeTicket(description: string) {
  const lower = description.toLowerCase();

  const priority = lower.includes("urgent") ? "high" : "low";
  const category = lower.includes("billing") ? "billing" : "general";

  return { priority, category };
}
