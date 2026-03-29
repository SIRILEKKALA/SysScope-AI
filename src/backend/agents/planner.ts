import { Decision } from "./decision";

export interface ActionStep {
  step: number;
  action: string;
  expected_outcome: string;
}

export const plan = (decision: Decision | null): ActionStep[] => {
  if (!decision) return [];

  // In a real system, this would be more dynamic.
  // Here we generate steps based on the best_action string.
  
  if (decision.best_action.includes("Scale")) {
    return [
      { step: 1, action: "Provision 2 additional worker nodes", expected_outcome: "Increased capacity" },
      { step: 2, action: "Update load balancer configuration", expected_outcome: "Traffic redistribution" },
      { step: 3, action: "Monitor CPU stabilization", expected_outcome: "Usage < 60%" }
    ];
  }

  if (decision.best_action.includes("cache")) {
    return [
      { step: 1, action: "Identify top 10 slowest queries", expected_outcome: "Target list ready" },
      { step: 2, action: "Implement Redis caching for identified queries", expected_outcome: "Reduced DB load" },
      { step: 3, action: "Verify latency reduction", expected_outcome: "Latency < 100ms" }
    ];
  }

  return [
    { step: 1, action: "Notify engineering on-call", expected_outcome: "Human oversight active" },
    { step: 2, action: "Capture system heap dump", expected_outcome: "Diagnostic data preserved" },
    { step: 3, action: "Review logs for anomalies", expected_outcome: "Root cause clarification" }
  ];
};
