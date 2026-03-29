import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import si from "systeminformation";
import cors from "cors";

// Agents
import { analyze, SystemMetrics } from "./src/backend/agents/analyzer";
import { identifyRootCause } from "./src/backend/agents/rootCause";
import { predict } from "./src/backend/agents/predictor";
import { prioritize } from "./src/backend/agents/prioritizer";
import { decide } from "./src/backend/agents/decision";
import { plan } from "./src/backend/agents/planner";

import rules from "./rules.json";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // In-memory thresholds initialized from rules.json
  let currentThresholds = { ...rules.thresholds };

  // In-memory logs
  const logs: { timestamp: string; level: string; message: string }[] = [
    { timestamp: new Date().toISOString(), level: "INFO", message: "SysScope AI Engine initialized" },
    { timestamp: new Date().toISOString(), level: "INFO", message: "Thresholds loaded from rules.json" }
  ];

  const addLog = (level: string, message: string) => {
    logs.unshift({ timestamp: new Date().toISOString(), level, message });
    if (logs.length > 50) logs.pop();
  };

  // API Routes
  console.log("Setting up API routes...");

  app.get("/api/logs", (req, res) => {
    res.json(logs);
  });

  app.get("/api/engine-status", (req, res) => {
    res.json({
      status: "ACTIVE",
      uptime: process.uptime(),
      latency: "0.4ms",
      modules: [
        { name: "Metric Analyzer", status: "ONLINE" },
        { name: "Root Cause Predictor", status: "ONLINE" },
        { name: "Risk Forecaster", status: "ONLINE" },
        { name: "Action Planner", status: "ONLINE" }
      ]
    });
  });

  app.get("/api/thresholds", (req, res) => {
    console.log("API: Fetching thresholds");
    res.json(currentThresholds);
  });

  app.post("/api/thresholds", (req, res) => {
    console.log("API: Updating thresholds", req.body);
    currentThresholds = { ...currentThresholds, ...req.body };
    addLog("INFO", `Thresholds updated: ${JSON.stringify(req.body)}`);
    res.json({ status: "updated", thresholds: currentThresholds });
  });

  app.get("/api/system-metrics", async (req, res) => {
    console.log("API: Fetching system metrics");
    try {
      const cpu = await si.currentLoad();
      const mem = await si.mem();
      
      const metrics: SystemMetrics = {
        cpu_usage: cpu.currentLoad,
        memory_usage: (mem.active / mem.total) * 100,
        db_latency_ms: Math.floor(Math.random() * 250),
        request_rate: Math.floor(Math.random() * 1000),
        error_rate: Math.random() * 0.1,
        background_jobs: Math.floor(Math.random() * 20)
      };
      
      if (metrics.cpu_usage > currentThresholds.cpu_usage) {
        addLog("WARN", `High CPU load detected: ${metrics.cpu_usage.toFixed(2)}%`);
      }
      if (metrics.memory_usage > currentThresholds.memory_usage) {
        addLog("WARN", `High Memory usage detected: ${metrics.memory_usage.toFixed(2)}%`);
      }
      if (metrics.db_latency_ms > currentThresholds.db_latency_ms) {
        addLog("WARN", `High DB Latency detected: ${metrics.db_latency_ms}ms`);
      }
      if (metrics.error_rate > currentThresholds.error_rate) {
        addLog("ERROR", `High Error Rate detected: ${(metrics.error_rate * 100).toFixed(2)}%`);
      }
      
      res.json(metrics);
    } catch (error) {
      console.error("Metrics error:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.post("/api/run-audit", async (req, res) => {
    console.log("API: Running audit");
    addLog("INFO", "System audit initiated");
    const metrics: SystemMetrics = req.body;
    const issues = analyze(metrics, currentThresholds);
    
    if (issues.length === 0) {
      addLog("INFO", "Audit complete: System healthy");
      return res.json({ status: "healthy", metrics });
    }

    addLog("WARN", `Audit complete: ${issues.length} issues identified`);
    const root_causes = identifyRootCause(issues);
    const predictions = predict(metrics);
    const priorities = prioritize(issues);
    const decision = decide(priorities);
    const action_plan = plan(decision);

    res.json({
      status: "analyzed",
      metrics,
      issues,
      root_causes,
      predictions,
      priorities,
      decision,
      action_plan
    });
  });

  // Vite middleware for development
  console.log(`NODE_ENV is: ${process.env.NODE_ENV}`);
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SysScope AI Server running on http://localhost:${PORT}`);
  });
}

startServer();
