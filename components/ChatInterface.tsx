"use client";

import { useState } from "react";
import { MessageSquare, Send, Bot, Loader2, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getDetailedStats, getCategoryDistributions, generateInsights } from "@/lib/insights";

interface ChatInterfaceProps {
  data: any[];
  onChartConfig?: (config: any) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface({ data, onChartConfig }: ChatInterfaceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I am OriData AI. Ask me anything about your dataset!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load API Key from local storage on mount
  useState(() => {
    if (typeof window !== "undefined") {
        const storedKey = localStorage.getItem("brutviz_gemini_key");
        if (storedKey) setApiKey(storedKey); 
    }
  });

  const handleSaveKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem("brutviz_gemini_key", key);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userMsg = input;
    setInput("");
    const newHistory = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    try {
        const validData = data.filter(d => Object.values(d).some(v => v !== null && v !== undefined && v !== ""));
        const stats = getDetailedStats(validData);
        const categoricalDist = getCategoryDistributions(validData);
        const autoInsights = generateInsights(validData);

        const headers = Object.keys(data[0] || {}).join(", ");
        const sample = JSON.stringify(data.slice(0, 3));
        
        const statsContext = stats.map(s => 
            `- ${s.column}: Mean=${s.mean.toFixed(2)}, Max=${s.max}, Min=${s.min}`
        ).join("\n");

        const categoryContext = categoricalDist.map(c => 
            `- ${c.column}: Top Values = ${c.topValues.map(v => `${v.value} (${v.count})`).join(", ")}`
        ).join("\n");

        const autoInsightsContext = autoInsights.map(i => 
            `- [${i.type.toUpperCase()}] ${i.title}: ${i.description}`
        ).join("\n");

//         const systemPrompt = `You are OriData AI, a world-class Lead Data Scientist with expertise in statistical analysis, predictive modeling, and business intelligence.
        
//         DATASET CONTEXT:
//         - Columns: ${headers}
//         - Total Rows: ${data.length}
        
//         1. STATISTICAL STATS:
//         ${statsContext}
// 2. CATEGORICAL DISTRIBUTIONS:
//         ${categoryContext}

//         3. DETECTED CORRELATIONS & OUTLIERS (Use these to explain "Why"):
//         ${autoInsightsContext}

//         SAMPLE ROWS:
//         ${sample}

//         YOUR RESPONSE GUIDELINES:
        
//         1. ### **💎 EXECUTIVE ANALYTICAL STRUCTURE**:
//            - **The Big Picture**: Start with a high-level "Executive Summary" (2-3 sentences). What is the primary story the data is telling?
//            - **Deep Drill-Down**: Identify 3-5 critical anomalies or key drivers. Use **bolding** for all metrics and dates.
//            - **Causal Reasoning**: Don't just list what happened; explain **WHY**. (e.g., "The 20% spike in Friday sales is directly driven by the 'Weekend Promo' category.")
//            - **Proactive Forecasting**: If there's a trend, explicitly mention what the "AI Forecast" toggle might reveal (e.g., "Enabling the AI Forecast will likely show a continued upward trajectory into Q4").
//            - **Strategic Alpha**: Provide 2-3 specific "Next Steps" or business pivots based on this data.
        
//         2. ### **📊 INTELLIGENT CHART GENERATION**:
//            When analysis would benefit from visualization, generate a JSON config. Use "line" or "area" for trends, and highly recommend the user toggle the "**AI Forecast**" button on those charts for future projections.
           
//            Format: **CHART_CONFIG:**{"type":"line|bar|pie|area","xKey":"column_name","yKeys":["metric1"],"title":"Strategic Insight Title","description":"Explain why this specific view matters for decision making."}
           
//         3. ### **🚀 PROACTIVE INTELLIGENCE**:
//            Always end with 3 distinct "Deep Dive" questions that push the user to explore the data further:
//            - 1 Forecast-related question (e.g., "What happens to our profit if this growth trend continues for 3 more months?")
//            - 1 Segment-related question (e.g., "Which specific region is dragging down our overall average?")
//            - 1 Dynamic 'What-if' question.

//         4. **TONE & STYLE**:
        const systemPrompt = `
You are OriData AI, a world-class Lead Data Scientist with expertise in statistical analysis, predictive modeling, and business intelligence. 

---

## CONVERSATIONAL PHILOSOPHY
1. **Conversational Intelligence**: Respond naturally. If the user says "Hello", be polite and brief. If the user presents a dataset, immediately switch to "Deep Analytical Mode".
2. **Prioritize Query Over Stats**: Always address the user's specific question directly and immediately.
3. **Analytical Depth on Demand**: Provide deep insights, causal explanations, and "Executive Summaries".
4. **Authoritative & CONFIDENT**: Do not use hedges like "it seems" or "perhaps". State findings based on the mathematical reality of the data.

---

## DATASET CONTEXT
- **Columns**: ${headers}
- **Total Rows**: ${data.length}

### 🔢 NUMERICAL STATISTICS (Drill Down)
${statsContext}

### 🗂️ CATEGORICAL DISTRIBUTIONS (Segments)
${categoryContext}

### 🔍 AUTOMATED INSIGHTS (Correlations & Anomalies)
${autoInsightsContext}

### 📄 DATA SAMPLE (Representational)
${sample}

---

## YOUR CORE CAPABILITIES (How to handle data)

1. ### **💎 EXECUTIVE ANALYTICAL STRUCTURE**:
   - **The Big Picture**: Start with a high-level "Executive Summary" (2-3 sentences). What is the primary story the data is telling?
   - **Deep Drill-Down**: Identify 3-5 critical anomalies or key drivers. Use **bolding** for all metrics and dates.
   - **Causal Reasoning**: Don't just list what happened; explain **WHY**. (e.g., "The 20% spike in Friday sales is directly driven by the 'Weekend Promo' category.")
   - **Strategic Alpha**: Provide 2-3 specific "Next Steps" or business pivots based on this data.

2. ### **🚀 PROACTIVE INTELLIGENCE**:
   Always end with 3 distinct "Deep Dive" questions that push the user to explore the data further:
   - 1 Forecast-related question (e.g., "What happens to our profit if this growth trend continues for 3 more months?")
   - 1 Segment-related question (e.g., "Which specific region is dragging down our overall average?")
   - 1 Dynamic 'What-if' scenario.

3. ### **⚠️ ANOMALY & OUTLIER DETECTION**:
   If there are outliers or significant shifts, point them out with precision. Mention which column and what the values are.

---

## STYLE GUIDELINES
- Use **bolding** for metrics, dates, and column names.
- Use markdown for structure (tables, lists).
- Explain **WHY** something is happening whenever possible (causality).
- If the data suggests a trend, mention what the **AI Forecast** might show if they toggle it on the charts.
- **DO NOT GENERATE JSON CONFIGS OR CHART_CONFIG**. Your job is to provide the deep thinking and explanation, not to control the UI.
`;

        const apiHistory = newHistory
            .filter((m, i) => i > 0 || m.role === "user")
            .map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }]
            }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: apiHistory,
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                }
            })
        });

        const json = await response.json();
        
        if (json.error) {
            throw new Error(json.error.message);
        }

        let reply = json.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
        
        setMessages(prev => [...prev, { role: "assistant", content: reply }]);

    } catch (err: any) {
        let errorMessage = `Error: ${err.message}`;
        if (err.message?.toLowerCase().includes("quota") || err.message?.includes("429")) {
            errorMessage = "Oh No! The API key quota has been exceeded. Soon this will be fixed! Please try again in 3-6 hours. \n\nYou can contact the developer at msamyog37@gmail.com or visit the portfolio at samyogm.com.np";
        }
        setMessages(prev => [...prev, { role: "assistant", content: errorMessage }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="w-[calc(100vw-32px)] sm:w-[400px] h-[500px] sm:h-[600px] bg-white border-4 border-black shadow-neo rounded-2xl flex flex-col overflow-hidden pointer-events-auto z-[1001]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-primary text-white border-b-4 border-black">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            <h3 className="font-bold">OriData AI</h3>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                        >
                            <span className="font-bold text-xl">&times;</span>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/50">
                        {!apiKey ? (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-4">
                                <KeyRound className="w-10 h-10 text-muted-foreground/30" />
                                <p className="font-bold text-sm">Enter Gemini API Key to activate OriData.</p>
                                <input 
                                    type="password"
                                    placeholder="Enter Gemini API Key..."
                                    className="w-full p-2 border-2 border-black rounded-lg text-sm"
                                    onChange={(e) => handleSaveKey(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Stored locally in your browser.</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((m, i) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        key={i} 
                                        className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
                                    >
                                        {m.role === "assistant" && (
                                            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center mt-1 border-2 border-black shadow-neo-sm shrink-0">
                                                <Bot className="w-6 h-6" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "max-w-[85%] p-4 text-sm font-bold rounded-2xl border-4 border-black shadow-neo-sm whitespace-pre-wrap relative overflow-hidden",
                                            m.role === "user" ? "bg-black text-white" : "bg-white text-black"
                                        )}>
                                            {m.role === "assistant" && (
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-primary opacity-[0.03] rounded-full -mr-8 -mt-8" />
                                            )}
                                            {m.role === "assistant" ? m.content.split(/(\*\*.*?\*\*|###.*?\n|###.*?$)/g).map((part, i) => {
                                                if (part.startsWith("**") && part.endsWith("**")) {
                                                    return <strong key={i} className="font-black underline decoration-primary/30 decoration-4 underline-offset-2">{part.slice(2, -2)}</strong>;
                                                }
                                                if (part.startsWith("###")) {
                                                    const cleanHeader = part.replace(/^###\s*/, "").trim();
                                                    return <strong key={i} className="block text-lg font-black mt-4 mb-2 text-primary tracking-tight">{cleanHeader}</strong>;
                                                }
                                                return part;
                                            }) : m.content}
                                        </div>
                                    </motion.div>
                                ))}
                                {isLoading && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex gap-3"
                                    >
                                         <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center mt-1 border-2 border-black shadow-neo-sm shrink-0">
                                            <Bot className="w-6 h-6 animate-pulse" />
                                         </div>
                                         <div className="bg-white px-4 py-3 rounded-2xl border-4 border-black shadow-neo-sm flex items-center gap-2">
                                            <div className="flex gap-1">
                                                {[0, 1, 2].map((dot) => (
                                                    <motion.div
                                                        key={dot}
                                                        animate={{ y: [0, -5, 0] }}
                                                        transition={{ repeat: Infinity, duration: 0.6, delay: dot * 0.1 }}
                                                        className="w-1.5 h-1.5 rounded-full bg-black"
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Searching your data...</span>
                                         </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Input */}
                    {apiKey && (
                        <form onSubmit={handleSubmit} className="p-4 bg-white border-t-4 border-black flex gap-2">
                            <input 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask OriData..."
                                className="flex-1 p-3 border-2 border-black rounded-lg focus:shadow-neo outline-none transition-all font-bold text-sm"
                            />
                            <button 
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="p-3 bg-primary text-white rounded-lg border-2 border-black hover:translate-y-[-2px] active:translate-y-[2px] transition-all disabled:opacity-50 shadow-neo-sm"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={cn(
                "p-4 bg-primary text-white rounded-2xl shadow-neo border-4 border-black pointer-events-auto",
                isOpen && "hidden"
            )}
        >
            <MessageSquare className="w-8 h-8" />
        </motion.button>
    </div>
  );
}
