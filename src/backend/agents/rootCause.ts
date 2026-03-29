import rules from "../../../rules.json";
import { Issue } from "./analyzer";

export interface RootCause {
  cause: string;
  confidence: number;
  evidence: string;
}

export const identifyRootCause = (issues: Issue[]): Record<string, RootCause> => {
  const results: Record<string, RootCause> = {};
  const { root_causes } = rules;

  issues.forEach(issue => {
    const mapping = (root_causes as any)[issue.type];
    if (mapping) {
      results[issue.id] = mapping;
    } else {
      results[issue.id] = {
        cause: "Unknown internal system anomaly",
        confidence: 0.4,
        evidence: "No direct rule mapping found for this issue type"
      };
    }
  });

  return results;
};
