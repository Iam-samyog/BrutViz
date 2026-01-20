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
    { role: "assistant", content: "Hello! I am BrutViz AI. Ask me anything about your dataset!" }
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

        const systemPrompt = `You are BrutViz AI, an elite Lead Data Scientist known for sharp, high-impact business analysis.
        
        DATASET CONTEXT:
        - Columns: ${headers}
        - Total Rows: ${data.length}
        
        1. STATISTICAL STATS:
        ${statsContext}

        2. CATEGORICAL DISTRIBUTIONS:
        ${categoryContext}

        3. DETECTED CORRELATIONS & OUTLIERS (Use these to explain "Why"):
        ${autoInsightsContext}

        SAMPLE ROWS:
        ${sample}

        YOUR RESPONSE GUIDELINES:
        
        1. **STRUCTURE IS MANDATORY**:
           - **Analysis**: Start with a direct answer. Use bold text for key metrics.
           - **Key Drivers**: Use the "Correlations" and "Distributions" to explain *why* this is happening.
           - **Recommendation**: Provide one actionable business recommendation based on the data.
        
        2. **CHART GENERATION**:
           - If the user asks to visualize/chart/graph/compare, output a JSON config.
           - Format: CHART_CONFIG:{"type":"bar"|"line"|"area"|"pie", "xKey":"Column", "yKeys":["Column"], "title":"Title", "description":"One sentence desc"}
           - Choose the best chart type for the data (Line for time, Bar for categories, Scatter for correlation).

        3. **PROACTIVE FOLLOW-UP**:
           - At the very end of your response, strictly output a list of 3 follow-up questions that would deepen the analysis.
           - Format: 
             **Suggested Questions:**
             1. [Question 1]
             2. [Question 2]
             3. [Question 3]

        TONE:
        - Professional, confident, and concise. 
        - Avoid fluff like "Here is the data". Get straight to the insight.
        `;

        const apiHistory = newHistory
            .filter((m, i) => i > 0 || m.role === "user")
            .map(m => ({
                role: m.role === "assistant" ? "model" : "user",
                parts: [{ text: m.content }]
            }));

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
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
        
        // Handle Chart Config
        if (reply.includes("CHART_CONFIG:")) {
            const parts = reply.split("CHART_CONFIG:");
            const textPart = parts[0].trim();
            const rawConfig = parts[1].trim();
            // Extract JSON even if wrapped in markdown code blocks or trailing text
            const jsonPart = rawConfig.replace(/```json|```/g, "").trim();
            const jsonMatch = jsonPart.match(/\{[\s\S]*\}/);
            const cleanJson = jsonMatch ? jsonMatch[0] : jsonPart;
            
            try {
                const config = JSON.parse(cleanJson);
                if (onChartConfig) onChartConfig(config);
                reply = textPart || "I've generated a new visualization for you!";
            } catch (e) {
                console.error("BrutViz AI: Failed to parse chart config", e, "Raw data:", cleanJson);
            }
        }

        setMessages(prev => [...prev, { role: "assistant", content: reply }]);

    } catch (err: any) {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
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
                            <h3 className="font-bold">BrutViz AI</h3>
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
                                    <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                                        {m.role === "assistant" && (
                                            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center mt-1 border-2 border-black shadow-neo-sm shrink-0">
                                                <Bot className="w-4 h-4" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "max-w-[80%] p-3 text-sm font-bold rounded-xl border-2 border-black shadow-neo-sm whitespace-pre-wrap",
                                            m.role === "user" ? "bg-black text-white" : "bg-white text-black"
                                        )}>
                                            {m.role === "assistant" ? m.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                                                if (part.startsWith("**") && part.endsWith("**")) {
                                                    return <strong key={i} className="font-black underline decoration-primary/30 decoration-2 underline-offset-2">{part.slice(2, -2)}</strong>;
                                                }
                                                return part;
                                            }) : m.content}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex gap-2">
                                         <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center mt-1 border-2 border-black shadow-neo-sm shrink-0">
                                            <Bot className="w-4 h-4" />
                                         </div>
                                         <div className="bg-white p-3 rounded-xl border-2 border-black shadow-neo-sm">
                                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                                         </div>
                                    </div>
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
