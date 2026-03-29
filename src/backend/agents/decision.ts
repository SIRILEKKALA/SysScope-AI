import rules from "../../../rules.json";
import { PrioritizedIssue } from "./prioritizer";

export interface Alternative {
  action: string;
  pros: string;
  cons: string;
}

export interface Decision {
  best_action: string;
  reasoning: string;
  alternatives: Alternative[];
  confidence: number;
}

export const decide = (prioritizedIssues: PrioritizedIssue[]): Decision | null => {
  if (prioritizedIssues.length === 0) return null;

  const topIssue = prioritizedIssues[0];
  const decisionMapping = (rules.decisions as any)[topIssue.type];

  if (decisionMapping) {
    return decisionMapping;
  }

  return {
    best_action: "Manual investigation required",
    reasoning: "The detected issue does not match predefined automated decision patterns.",
    alternatives: [
      {
        action: "Restart service",
        pros: "Clears temporary state",
        cons: "May not fix root cause"
      }
    ],
    confidence: 0.5
  };
};
