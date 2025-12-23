export function analyzeTicket(title: string, description: string) {
  // Combine title and description for analysis
  const combinedText = `${title} ${description}`.toLowerCase();

  const priority = combinedText.includes("urgent") ? "high" : "low";
  const category = combinedText.includes("billing") ? "billing" : "general";

  return { priority, category };
}
