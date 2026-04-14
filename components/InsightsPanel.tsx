"use client";

import { generateInsights, Insight } from "@/lib/insights";
import { TrendingUp, AlertTriangle, FileBarChart, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Assuming cn utility is available here

export default function InsightsPanel({ data, orientation = "horizontal" }: { data: any[], orientation?: "horizontal" | "vertical" }) {
  if (!data || data.length === 0) return null;

  const insights = generateInsights(data);

  const getIcon = (type: string) => {
    switch (type) {
      case "summary": return <FileBarChart className="w-5 h-5 text-white" />;
      case "correlation": return <TrendingUp className="w-5 h-5 text-white" />;
      case "outlier": return <AlertTriangle className="w-5 h-5 text-white" />;
      case "driver": return <BarChart3 className="w-5 h-5 text-white" />;
      default: return <BarChart3 className="w-5 h-5 text-white" />;
    }
  };

  const getTypeStyles = (type: string) => {
      switch (type) {
          case 'summary': return { bg: 'bg-primary', light: 'bg-primary/10', border: 'border-primary', label: 'Summary' };
          case 'correlation': return { bg: 'bg-[#AF52DE]', light: 'bg-[#AF52DE]/10', border: 'border-[#AF52DE]', label: 'Correlation' };
          case 'outlier': return { bg: 'bg-[#FF2D55]', light: 'bg-[#FF2D55]/10', border: 'border-[#FF2D55]', label: 'Outlier' };
          case 'driver': return { bg: 'bg-[#FF9500]', light: 'bg-[#FF9500]/10', border: 'border-[#FF9500]', label: 'Driver' };
          default: return { bg: 'bg-black', light: 'bg-black/5', border: 'border-black', label: 'Insight' };
      }
  }

  const renderDescription = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-black underline decoration-2 decoration-black/10 underline-offset-2">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={cn(
        "grid gap-4",
        orientation === "horizontal" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"
    )}>
      {insights.map((insight: Insight, index: number) => {
        const styles = getTypeStyles(insight.type);
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5, scale: 1.02, rotate: 0.5 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
                "p-5 rounded-2xl border-4 border-black bg-white shadow-neo-sm hover:shadow-neo transition-all group relative overflow-hidden h-full flex flex-col justify-between"
            )}
          >
            {/* Background Accent */}
            <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.05] group-hover:opacity-[0.1] transition-opacity", styles.bg)} />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className={cn("p-2.5 rounded-xl border-2 border-black shadow-neo-sm transition-transform group-hover:rotate-[-5deg]", styles.bg)}>
                  {getIcon(insight.type)}
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border-2 border-black bg-white shadow-neo-sm", styles.border)}>
                        {styles.label}
                    </span>
                    {insight.score && insight.score >= 8 && (
                        <div className="text-[10px] font-black flex items-center gap-1 text-primary animate-pulse">
                            <span className="w-1 h-1 rounded-full bg-primary" />
                            CRITICAL
                        </div>
                    )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-black/30 group-hover:text-black/50 transition-colors">
                    {insight.title}
                </h4>
                <p className="text-sm font-bold text-black leading-snug">
                  {renderDescription(insight.description)}
                </p>
              </div>
            </div>

            {/* Bottom Accent Line */}
            <div className={cn("mt-4 h-1 w-full rounded-full border border-black/10", styles.light)}>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                    className={cn("h-full rounded-full", styles.bg)} 
                />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
