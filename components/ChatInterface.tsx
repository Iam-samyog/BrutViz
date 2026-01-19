"use client";

import { useState } from "react";
import { MessageSquare, Send, Bot, Loader2, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
        const storedKey = localStorage.getItem("vizly_gemini_key");
        if (storedKey) setApiKey(storedKey); 
    }
  });

  const handleSaveKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem("vizly_gemini_key", key);
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
        const headers = Object.keys(data[0] || {}).join(", ");
        const sample = JSON.stringify(data.slice(0, 3));
        const context = `Dataset Columns: ${headers}\nSample Data: ${sample}\nTotal Rows: ${data.length}`;
        
        const systemPrompt = `You are OriData, an advanced data analyst.
        Context: ${context}
        
        Answer the user's question concisely based on the data context provided.
        If the user asks for a chart, reply with JSON starting with "CHART_CONFIG:" followed by the JSON object.
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

        const reply = json.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
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
                    className="w-[calc(100vw-32px)] sm:w-96 h-[500px] sm:h-[600px] bg-white border-4 border-black shadow-neo rounded-2xl flex flex-col overflow-hidden pointer-events-auto"
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
                                    <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
                                        {m.role === "assistant" && (
                                            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center mt-1 border-2 border-black shadow-neo-sm shrink-0">
                                                <Bot className="w-4 h-4" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "max-w-[80%] p-3 text-sm font-bold rounded-xl border-2 border-black shadow-neo-sm",
                                            m.role === "user" ? "bg-black text-white" : "bg-white text-black"
                                        )}>
                                            {m.content}
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
