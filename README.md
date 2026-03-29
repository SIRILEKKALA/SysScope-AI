# 🧠 SysScope AI — Predict. Diagnose. Decide.

SysScope AI is an intelligent system monitoring and decision-support platform that goes beyond traditional dashboards.

Instead of just displaying metrics, SysScope AI:

* 🔮 Predicts failures before they occur
* 🧩 Identifies root causes using deterministic logic
* 🧠 Generates actionable engineering decisions in real time

---

## 🚀 Overview

Modern monitoring tools stop at visualization. SysScope AI introduces a **deterministic decision engine** that transforms raw system data into **clear, explainable, and actionable insights**.

It combines:

* Real-time system monitoring
* Rule-based anomaly detection
* Predictive analysis
* AI-assisted reasoning

---

## 🏗️ System Architecture

This Mermaid flowchart illustrates the high-level architecture and deterministic decision logic of SysScope AI:

```mermaid
graph TD
    %% Main Entry Points
    Start([User Accesses App]) --> Dashboard[Frontend Dashboard]
    
    %% Background Processes
    subgraph Background_Sync [Real-Time Monitoring]
        Dashboard -- Polling (2s) --> MetricsAPI[GET /api/system-metrics]
        MetricsAPI --> SysInfo[systeminformation Library]
        SysInfo --> MetricsData[(CPU, RAM, Latency, Errors)]
        MetricsData --> Dashboard
    end

    %% User Actions
    Dashboard --> UserActions{User Action}
    
    %% Settings Flow
    UserActions -- Configure --> Settings[Settings Modal]
    Settings -- Update --> ThresholdsAPI[POST /api/thresholds]
    ThresholdsAPI --> RulesDB[(rules.json / In-Memory)]

    %% Audit Flow
    UserActions -- Run Audit --> AuditFlow[POST /api/run-audit]
    
    subgraph Decision_Engine [Deterministic Engine]
        AuditFlow --> Step1[Step 1: Detect Anomalies]
        Step1 --> Step2[Step 2: Identify Root Causes]
        Step2 --> Step3[Step 3: Predict Future Risks]
        Step3 --> Step4[Step 4: Synthesize Decision]
        
        Step1 -.-> RulesDB
        Step2 -.-> RulesDB
    end
    
    Step4 --> AuditResults[Audit Results Dashboard]
    AuditResults --> ActionPlan[Actionable Engineering Plan]
    AuditResults --> Alternatives[Alternatives Evaluated]

    %% AI Assistant Flow
    UserActions -- Chat --> Chatbot[AI Assistant UI]
    Chatbot -- Prompt + Context --> GeminiAPI[Google Gemini API]
    GeminiAPI -- Response --> Chatbot

    %% Logs & Engine Flow
    UserActions -- View Logs --> LogsModal[Logs Modal]
    LogsModal -- Stream --> LogsAPI[GET /api/logs]
    
    UserActions -- View Engine --> EngineModal[Engine Modal]
    EngineModal -- Status --> EngineAPI[GET /api/engine-status]

    %% Styling
    style Dashboard fill:#f97316,stroke:#000,color:#000
    style Decision_Engine fill:#1a1a1a,stroke:#f97316,color:#fff
    style GeminiAPI fill:#4285F4,stroke:#fff,color:#fff
    style RulesDB fill:#333,stroke:#f97316,color:#fff
```

---

## ⚙️ Key Components Explained

### 🔄 Real-Time Monitoring

* Frontend polls backend every **2 seconds**
* Collects:

  * CPU usage
  * RAM usage
  * Latency
  * Error rates
* Powered by `systeminformation` library

---

### 🧠 Deterministic Decision Engine

Unlike generic monitoring tools, SysScope AI runs a structured pipeline:

1. **Detect Anomalies**
   Compare live metrics against thresholds

2. **Identify Root Causes**
   Map anomalies to known failure patterns

3. **Predict Future Risks**
   Forecast potential system degradation

4. **Synthesize Decision**
   Generate a final actionable outcome

👉 This ensures **consistent, explainable, and reliable decisions**

---

### 🛠️ Actionable Engineering Output

Instead of raw data, the system provides:

* ✅ **Action Plan** (what to do)
* 🔄 **Alternative Solutions** (what else can be done)
* 📊 **Audit Results Dashboard**

---

### 🤖 AI Assistant (Context-Aware)

* Integrated AI chat interface
* Uses system state as context
* Can answer:

  * “Why is latency high?”
  * “What should I fix first?”

Powered by Google Gemini API.

---

### 📜 Rules Engine

* Stored in `rules.json` or in-memory
* Defines:

  * Thresholds
  * System behavior logic
* User-configurable via UI

---

## 🧪 Features

* ⚡ Real-time system monitoring
* 🧠 Deterministic decision engine
* 🔍 Root cause analysis
* 🔮 Predictive insights
* 🤖 AI-powered assistant
* 📊 Interactive dashboard
* ⚙️ Customizable thresholds

---

## 🛠️ Tech Stack

* **Frontend:** Vite + TypeScript
* **Backend:** Node.js + Express
* **System Metrics:** systeminformation
* **AI Integration:** Gemini API
* **Config Engine:** JSON-based rules

---

## 🔐 Environment Setup

Create a `.env` file based on:

```
.env.example
```

Example:

```
GEMINI_API_KEY=your_api_key
PORT=3000
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

---

## 🎯 Why SysScope AI Stands Out

Most tools:

* Show dashboards
* Trigger alerts

SysScope AI:

* **Explains problems**
* **Predicts failures**
* **Recommends decisions**

👉 It’s not a monitoring tool. It’s a **decision system**.

---

## 📄 License

MIT License
