import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Layers, 
  Zap, 
  TrendingUp, 
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Loader2,
  Terminal,
  BarChart3,
  MessageSquare,
  Send,
  X,
  Settings as SettingsIcon,
  History,
  Info
} from 'lucide-react';

// Types
interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  db_latency_ms: number;
  request_rate: number;
  error_rate: number;
  background_jobs: number;
}

interface Issue {
  id: string;
  type: string;
  severity: number;
  impact: number;
  description: string;
}

interface RootCause {
  cause: string;
  confidence: number;
  evidence: string;
}

interface Prediction {
  metric: string;
  current_value: number;
  predicted_value: number;
  trend: "rising" | "stable" | "falling";
  timeframe: string;
}

interface PrioritizedIssue extends Issue {
  priority_score: number;
}

interface Alternative {
  action: string;
  pros: string;
  cons: string;
}

interface Decision {
  best_action: string;
  reasoning: string;
  alternatives: Alternative[];
  confidence: number;
}

interface ActionStep {
  step: number;
  action: string;
  expected_outcome: string;
}

interface AuditResponse {
  status: "analyzed" | "healthy";
  metrics: SystemMetrics;
  issues?: Issue[];
  root_causes?: Record<string, RootCause>;
  predictions?: Record<string, Prediction>;
  priorities?: PrioritizedIssue[];
  decision?: Decision;
  action_plan?: ActionStep[];
}

const API_BASE = '/api';

function useSystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const res = await fetch(`${API_BASE}/system-metrics`);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      const data = await res.json();
      setMetrics(data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch metrics", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, loading, error, refetch: fetchMetrics };
}

function useThresholds() {
  const [thresholds, setThresholds] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThresholds = async () => {
    try {
      const res = await fetch(`${API_BASE}/thresholds`);
      if (!res.ok) throw new Error("Failed to fetch thresholds");
      const data = await res.json();
      setThresholds(data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch thresholds", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, []);

  return { thresholds, setThresholds, loading, error, refetch: fetchThresholds };
}

interface EngineStatus {
  status: string;
  uptime: number;
  latency: string;
  modules: { name: string; status: string }[];
}

function useEngineStatus() {
  const [status, setStatus] = useState<EngineStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/engine-status`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch engine status", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return { status, loading };
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

function useLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/logs`);
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  return { logs, loading };
}

export default function App() {
  const { metrics, loading: metricsLoading, error: metricsError } = useSystemMetrics();
  const { thresholds, setThresholds, loading: thresholdsLoading, error: thresholdsError } = useThresholds();
  const { status: engineStatus, loading: engineLoading } = useEngineStatus();
  const { logs, loading: logsLoading } = useLogs();
  
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditStep, setAuditStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showEngine, setShowEngine] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hello! I'm SysScope AI Assistant. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMsg,
        config: {
          systemInstruction: `You are SysScope AI Assistant. You help users understand the SysScope AI application. 
          SysScope AI is a deterministic decision engine that analyzes system metrics (CPU, Memory, DB Latency, Error Rate), 
          predicts risks, and generates actionable engineering plans. 
          Current system status: ${metrics ? `CPU: ${metrics.cpu_usage}%, Memory: ${metrics.memory_usage}%, Latency: ${metrics.db_latency_ms}ms` : 'Loading metrics...'}.
          Answer questions related to the app's functionality, metrics, and system health. Be concise and professional.`
        }
      });
      
      setChatMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI engine." }]);
    } finally {
      setIsTyping(false);
    }
  };
  const [validationError, setValidationError] = useState<string | null>(null);
  const [expandedAlts, setExpandedAlts] = useState<number[]>([]);

  const toggleAlt = (idx: number) => {
    setExpandedAlts(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const getImpactInfo = (impact: number) => {
    if (impact >= 9) return { label: 'CRITICAL', color: 'text-red-600', icon: <ShieldAlert className="w-4 h-4" /> };
    if (impact >= 7) return { label: 'HIGH', color: 'text-orange-600', icon: <AlertTriangle className="w-4 h-4" /> };
    if (impact >= 4) return { label: 'MEDIUM', color: 'text-yellow-600', icon: <Activity className="w-4 h-4" /> };
    return { label: 'LOW', color: 'text-green-600', icon: <CheckCircle2 className="w-4 h-4" /> };
  };

  const auditSteps = [
    "Detecting System Anomalies...",
    "Identifying Root Causes...",
    "Predicting Future Risks...",
    "Synthesizing Decision..."
  ];

  const updateThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (thresholds.cpu_usage < 0 || thresholds.cpu_usage > 100) {
      setValidationError("CPU threshold must be between 0 and 100");
      return;
    }
    if (thresholds.memory_usage < 0 || thresholds.memory_usage > 100) {
      setValidationError("Memory threshold must be between 0 and 100");
      return;
    }
    if (thresholds.db_latency_ms < 0) {
      setValidationError("DB Latency must be non-negative");
      return;
    }
    if (thresholds.error_rate < 0 || thresholds.error_rate > 1) {
      setValidationError("Error rate must be between 0 and 100%");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/thresholds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(thresholds)
      });
      if (res.ok) {
        setShowSettings(false);
      }
    } catch (err) {
      console.error("Failed to update thresholds", err);
    }
  };

  const runAudit = async () => {
    if (!metrics) return;
    setIsAuditing(true);
    setAuditStep(0);
    setAuditResult(null);

    // Simulate steps for UI feel
    for (let i = 0; i < auditSteps.length; i++) {
      setAuditStep(i);
      await new Promise(r => setTimeout(r, 800));
    }

    try {
      const res = await fetch(`${API_BASE}/run-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
      const data = await res.json();
      setAuditResult(data);
    } catch (err) {
      console.error("Audit failed", err);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500/30">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <span className="text-xl font-bold tracking-tight">SysScope <span className="text-orange-500">AI</span></span>
          </div>
          <div className="flex items-center gap-6 text-sm font-medium text-white/60">
            <button 
              onClick={() => setShowEngine(true)}
              className="hover:text-white transition-colors"
            >
              Engine
            </button>
            <button 
              onClick={() => setShowSettings(true)}
              className="hover:text-white transition-colors"
            >
              Settings
            </button>
            <button 
              onClick={() => setShowLogs(true)}
              className="hover:text-white transition-colors"
            >
              Logs
            </button>
            <button className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-white hover:bg-white/10 transition-colors">
              Documentation
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence>
          {showSettings && (
            <Modal title="Engine Config" icon={<Terminal className="w-6 h-6 text-orange-500" />} onClose={() => setShowSettings(false)}>
              <form onSubmit={updateThresholds} className="space-y-6">
                {validationError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {validationError}
                  </div>
                )}
                <div className="space-y-4">
                  <ThresholdInput 
                    label="CPU Threshold (%)" 
                    value={thresholds?.cpu_usage} 
                    min={0}
                    max={100}
                    onChange={(v) => setThresholds({...thresholds, cpu_usage: v})} 
                  />
                  <ThresholdInput 
                    label="Memory Threshold (%)" 
                    value={thresholds?.memory_usage} 
                    min={0}
                    max={100}
                    onChange={(v) => setThresholds({...thresholds, memory_usage: v})} 
                  />
                  <ThresholdInput 
                    label="DB Latency (ms)" 
                    value={thresholds?.db_latency_ms} 
                    min={0}
                    onChange={(v) => setThresholds({...thresholds, db_latency_ms: v})} 
                  />
                  <ThresholdInput 
                    label="Error Rate (%)" 
                    value={thresholds ? (thresholds.error_rate * 100) : 0} 
                    min={0}
                    max={100}
                    onChange={(v) => setThresholds({...thresholds, error_rate: v / 100})} 
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-400 transition-all"
                  >
                    Save Changes
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </Modal>
          )}

          {showEngine && (
            <Modal title="Decision Engine" icon={<Cpu className="w-6 h-6 text-orange-500" />} onClose={() => setShowEngine(false)}>
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <h4 className="text-xs font-bold text-white/40 uppercase mb-3">Core Status</h4>
                  {engineLoading ? (
                    <div className="h-12 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className={`text-2xl font-bold ${engineStatus?.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}>
                          {engineStatus?.status}
                        </span>
                        <span className="text-[10px] text-white/40">Engine State</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold">{engineStatus?.latency}</span>
                        <span className="text-[10px] text-white/40">Inference Latency</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white/40 uppercase">Active Modules</h4>
                  {engineStatus?.modules.map(m => (
                    <div key={m.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-sm">{m.name}</span>
                      <div className={`w-2 h-2 rounded-full ${m.status === 'ONLINE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </Modal>
          )}

          {showLogs && (
            <Modal title="System Logs" icon={<History className="w-6 h-6 text-orange-500" />} onClose={() => setShowLogs(false)}>
              <div className="bg-black rounded-xl p-4 font-mono text-[10px] h-80 overflow-y-auto space-y-2 border border-white/10">
                {logsLoading && logs.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-white/20 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className={`font-bold shrink-0 ${
                        log.level === 'ERROR' ? 'text-red-500' : 
                        log.level === 'WARN' ? 'text-orange-500' : 
                        'text-blue-400'
                      }`}>[{log.level}]</span>
                      <span className="text-white/60">{log.message}</span>
                    </div>
                  ))
                )}
                <div className="text-white/10 animate-pulse">... listening for events ...</div>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        {/* Floating Chatbot */}
        <div className="fixed bottom-8 right-8 z-50">
          <AnimatePresence>
            {showChat && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute bottom-20 right-0 w-96 bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px]"
              >
                <div className="p-4 bg-orange-500 text-black flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <MessageSquare className="w-5 h-5" />
                    SysScope AI Assistant
                  </div>
                  <button onClick={() => setShowChat(false)} className="hover:bg-black/10 p-1 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-10 text-white/40">
                      <Info className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm">Ask me anything about SysScope AI!</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user' 
                          ? 'bg-orange-500 text-black rounded-tr-none' 
                          : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/50">
                  <div className="relative">
                    <input 
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type your question..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || isTyping}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-orange-500 text-black rounded-lg hover:bg-orange-400 disabled:opacity-50 disabled:hover:bg-orange-500 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button 
            onClick={() => setShowChat(!showChat)}
            className="w-14 h-14 bg-orange-500 text-black rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            {showChat ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          </button>
        </div>

        {!auditResult && !isAuditing && (
          <section className="flex flex-col items-center text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-widest mb-6"
            >
              <Activity className="w-3 h-3" />
              Deterministic Intelligence
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-7xl font-extrabold tracking-tighter mb-6 leading-[0.9]"
            >
              PREVENT FAILURES.<br />DECIDE <span className="text-orange-500 italic">FASTER.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/50 text-xl max-w-2xl mb-10 leading-relaxed"
            >
              SysScope AI is a deterministic decision engine that analyzes system metrics, 
              predicts risks, and generates actionable engineering plans in real-time.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-8"
            >
              <button 
                onClick={runAudit}
                className="group relative px-8 py-4 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-400 transition-all flex items-center gap-3 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                RUN SYSTEM AUDIT
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Real-time metrics preview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                <MetricCard label="CPU Load" value={metrics?.cpu_usage} unit="%" icon={<Cpu className="w-4 h-4" />} loading={metricsLoading} />
                <MetricCard label="Memory" value={metrics?.memory_usage} unit="%" icon={<Layers className="w-4 h-4" />} loading={metricsLoading} />
                <MetricCard label="DB Latency" value={metrics?.db_latency_ms} unit="ms" icon={<Database className="w-4 h-4" />} loading={metricsLoading} />
                <MetricCard label="Error Rate" value={metrics ? (metrics.error_rate * 100) : 0} unit="%" icon={<AlertTriangle className="w-4 h-4" />} loading={metricsLoading} />
              </div>
              {(metricsError || thresholdsError) && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  System Sync Error: {metricsError || thresholdsError}
                </div>
              )}
            </motion.div>
          </section>
        )}

        <AnimatePresence mode="wait">
          {isAuditing && (
            <motion.div 
              key="auditing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative w-24 h-24 mb-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-orange-500/20 border-t-orange-500 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">{auditSteps[auditStep]}</h2>
              <p className="text-white/40 font-mono text-sm">Processing deterministic ruleset v1.0.4...</p>
            </motion.div>
          )}

          {auditResult && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  Audit Results
                  {auditResult.status === 'healthy' ? (
                    <span className="text-sm bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> System Healthy
                    </span>
                  ) : (
                    <span className="text-sm bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Issues Detected
                    </span>
                  )}
                </h2>
                <button 
                  onClick={() => setAuditResult(null)}
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  Reset Audit
                </button>
              </div>

              {auditResult.status === 'healthy' ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No Issues Detected</h3>
                  <p className="text-white/50 max-w-md mx-auto">
                    All system metrics are within the defined thresholds. No immediate action is required.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Issues & Root Causes */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Detected Issues
                      </h3>
                      <div className="space-y-4">
                        {auditResult.priorities?.map((issue) => (
                          <div key={issue.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                            <div className="flex items-start justify-between mb-2">
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-[10px] font-bold rounded uppercase">
                                Priority Score: {issue.priority_score?.toFixed(1) || '0.0'}
                              </span>
                              <span className="text-white/30 text-xs font-mono">#{issue.id}</span>
                            </div>
                            <p className="text-sm font-medium mb-3">{issue.description}</p>
                            
                            {/* Root Cause for this issue */}
                            {auditResult.root_causes?.[issue.id] && (
                              <div className="mt-4 pt-4 border-t border-white/5">
                                <span className="text-[10px] text-white/40 uppercase font-bold mb-2 block">Root Cause</span>
                                <div className="flex items-center gap-2 text-orange-500 mb-1">
                                  <ChevronRight className="w-3 h-3" />
                                  <span className="text-sm font-bold">{auditResult.root_causes[issue.id].cause}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1 text-[10px] text-white/40">
                                    <BarChart3 className="w-3 h-3" />
                                    Confidence: {((auditResult.root_causes?.[issue.id]?.confidence ?? 0) * 100).toFixed(0)}%
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Predictions (15m)
                      </h3>
                      <div className="space-y-4">
                        {Object.values(auditResult.predictions || {}).map((predValue) => {
                          const pred = predValue as Prediction;
                          return (
                            <div key={pred.metric} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                              <div>
                                <div className="text-xs text-white/40 capitalize">{pred.metric.replace('_', ' ')}</div>
                                <div className="text-sm font-bold">{pred.current_value?.toFixed(1) || '0.0'} → {pred.predicted_value?.toFixed(1) || '0.0'}</div>
                              </div>
                              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${pred.trend === 'rising' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                {pred.trend}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Decision Panel */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-orange-500 text-black rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap className="w-32 h-32" />
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 border border-black/10 text-black text-[10px] font-bold uppercase tracking-widest">
                            Recommended Decision
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                            (auditResult.priorities?.[0]?.impact || 0) >= 9 ? 'bg-red-900/20 text-red-900 border border-red-900/20' :
                            (auditResult.priorities?.[0]?.impact || 0) >= 7 ? 'bg-orange-900/20 text-orange-900 border border-orange-900/20' :
                            (auditResult.priorities?.[0]?.impact || 0) >= 4 ? 'bg-yellow-900/20 text-yellow-900 border border-yellow-900/20' :
                            'bg-green-900/20 text-green-900 border border-green-900/20'
                          }`}>
                            {getImpactInfo(auditResult.priorities?.[0]?.impact || 0).icon}
                            {getImpactInfo(auditResult.priorities?.[0]?.impact || 0).label} IMPACT
                          </div>
                        </div>
                        <h3 className="text-4xl font-black tracking-tighter mb-4 leading-none uppercase">
                          {auditResult.decision?.best_action}
                        </h3>
                        <p className="text-black/70 font-medium mb-8 text-lg leading-snug">
                          {auditResult.decision?.reasoning}
                        </p>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold opacity-50">Confidence</span>
                            <span className="text-2xl font-black">{(auditResult.decision?.confidence || 0) * 100}%</span>
                          </div>
                          <div className="w-px h-10 bg-black/10" />
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold opacity-50">Impact</span>
                            <div className="flex items-center gap-2">
                              {getImpactInfo(auditResult.priorities?.[0]?.impact || 0).icon}
                              <span className="text-2xl font-black">
                                {getImpactInfo(auditResult.priorities?.[0]?.impact || 0).label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                      <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <Terminal className="w-4 h-4" /> Action Plan
                      </h3>
                      <div className="space-y-6">
                        {auditResult.action_plan?.map((step) => (
                          <div key={step.step} className="flex gap-6">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                                {step.step}
                              </div>
                              {step.step < (auditResult.action_plan?.length || 0) && (
                                <div className="w-px h-full bg-white/10 my-2" />
                              )}
                            </div>
                            <div className="pb-4">
                              <h4 className="font-bold text-lg mb-1">{step.action}</h4>
                              <p className="text-white/40 text-sm">Expected: {step.expected_outcome}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6">Alternatives Evaluated</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {auditResult.decision?.alternatives.map((alt, idx) => {
                          const isExpanded = expandedAlts.includes(idx);
                          return (
                            <motion.div 
                              key={idx} 
                              whileHover={{ y: -2 }}
                              className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:bg-white/10 hover:border-white/20 group"
                            >
                              <button 
                                onClick={() => toggleAlt(idx)}
                                className="w-full p-4 flex items-center justify-between transition-colors text-left"
                              >
                                <div className="font-bold text-sm group-hover:text-white transition-colors">{alt.action}</div>
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <ChevronDown className="w-4 h-4 text-white/40 group-hover:text-white/60" />
                                </motion.div>
                              </button>
                              
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-4">
                                      <div className="text-[10px] text-green-500 flex items-start gap-1">
                                        <span className="font-bold">PRO:</span> {alt.pros}
                                      </div>
                                      <div className="text-[10px] text-red-500 flex items-start gap-1">
                                        <span className="font-bold">CON:</span> {alt.cons}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-bold">SysScope AI v1.0.4</span>
          </div>
          <div className="flex items-center gap-8 text-xs font-medium text-white/30">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security Audit</a>
          </div>
          <div className="text-xs text-white/20">
            &copy; 2026 SysScope Intelligence Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function Modal({ title, icon, children, onClose }: { title: string, icon: React.ReactNode, children: React.ReactNode, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {icon}
            {title}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function MetricCard({ label, value, unit, icon, loading }: { label: string, value?: number, unit: string, icon: React.ReactNode, loading?: boolean }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all">
      <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-wider mb-2">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-black tabular-nums">
        {loading ? (
          <span className="animate-pulse opacity-20">...</span>
        ) : (
          <>
            {value?.toFixed(1) || '0.0'}<span className="text-sm font-medium text-white/30 ml-1">{unit}</span>
          </>
        )}
      </div>
    </div>
  );
}

function ThresholdInput({ label, value, min, max, onChange }: { label: string, value: number, min?: number, max?: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{label}</label>
      <input 
        type="number" 
        value={value || 0}
        min={min}
        max={max}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50 transition-colors"
      />
    </div>
  );
}
