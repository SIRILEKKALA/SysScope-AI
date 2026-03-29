import { Issue } from "./analyzer";

export interface PrioritizedIssue extends Issue {
  priority_score: number;
}

export const prioritize = (issues: Issue[]): PrioritizedIssue[] => {
  return issues.map(issue => {
    // formula: priority = severity * impact * probability (assumed 0.9 for detected issues)
    const probability = 0.9;
    const priority_score = issue.severity * issue.impact * probability;
    return {
      ...issue,
      priority_score
    };
  }).sort((a, b) => b.priority_score - a.priority_score);
};
