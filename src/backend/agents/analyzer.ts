export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  db_latency_ms: number;
  request_rate: number;
  error_rate: number;
  background_jobs: number;
}

export interface Issue {
  id: string;
  type: string;
  severity: number; // 1-10
  impact: number; // 1-10
  description: string;
}

export const analyze = (metrics: SystemMetrics, thresholds: any): Issue[] => {
  const issues: Issue[] = [];
  
  if (metrics.cpu_usage > thresholds.cpu_usage) {
    issues.push({
      id: "cpu_high",
      type: "HIGH_CPU",
      severity: 8,
      impact: 9,
      description: `CPU usage is at ${metrics.cpu_usage.toFixed(1)}%, exceeding threshold of ${thresholds.cpu_usage}%`
    });
  }

  if (metrics.memory_usage > thresholds.memory_usage) {
    issues.push({
      id: "mem_high",
      type: "HIGH_MEMORY",
      severity: 7,
      impact: 8,
      description: `Memory usage is at ${metrics.memory_usage.toFixed(1)}%, exceeding threshold of ${thresholds.memory_usage}%`
    });
  }

  if (metrics.db_latency_ms > thresholds.db_latency_ms) {
    issues.push({
      id: "db_latency",
      type: "DB_LATENCY",
      severity: 9,
      impact: 10,
      description: `DB Latency is ${metrics.db_latency_ms}ms, exceeding threshold of ${thresholds.db_latency_ms}ms`
    });
  }

  if (metrics.error_rate > thresholds.error_rate) {
    issues.push({
      id: "error_rate_high",
      type: "HIGH_ERROR_RATE",
      severity: 10,
      impact: 10,
      description: `Error rate is ${(metrics.error_rate * 100).toFixed(1)}%, exceeding threshold of ${(thresholds.error_rate * 100)}%`
    });
  }

  return issues;
};
