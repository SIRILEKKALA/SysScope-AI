import { SystemMetrics } from "./analyzer";

export interface Prediction {
  metric: string;
  current_value: number;
  predicted_value: number;
  trend: "rising" | "stable" | "falling";
  timeframe: string;
}

export const predict = (metrics: SystemMetrics): Record<string, Prediction> => {
  // Simple trend-based prediction
  // In a real system, we'd have historical data. Here we simulate a slight upward trend if already high.
  const predictions: Record<string, Prediction> = {};

  const predictMetric = (name: string, value: number, threshold: number) => {
    const trend = value > threshold * 0.8 ? "rising" : "stable";
    const factor = trend === "rising" ? 1.1 : 1.0;
    predictions[name] = {
      metric: name,
      current_value: value,
      predicted_value: value * factor,
      trend,
      timeframe: "next 15 minutes"
    };
  };

  predictMetric("cpu_usage", metrics.cpu_usage, 80);
  predictMetric("memory_usage", metrics.memory_usage, 85);
  predictMetric("db_latency", metrics.db_latency_ms, 200);

  return predictions;
};
