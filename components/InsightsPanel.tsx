"use client";

import { generateInsights, Insight } from "@/lib/insights";
import { TrendingUp, AlertTriangle, FileBarChart, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils"; // Assuming cn utility is available here

export default function InsightsPanel({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  const insights = generateInsights(data);

  const getIcon = (type: string) => {
    switch (type) {
      case "summary": return <FileBarChart className="w-6 h-6 text-black" />;
      case "correlation": return <TrendingUp className="w-6 h-6 text-black" />;
      case "outlier": return <AlertTriangle className="w-6 h-6 text-black" />;
      default: return <BarChart3 className="w-6 h-6 text-black" />;
    }
  };

  const getColorStyles = (type: string) => {
      switch (type) {
          case 'summary': return 'bg-primary/20 border-primary';
          case 'correlation': return 'bg-black/5 border-black/20';
          case 'outlier': return 'bg-destructive/10 border-destructive';
          default: return 'bg-[#F9FAFB] border-[#E5E7EB]';
      }
  }

  const renderDescription = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-black text-black">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-4">
      {insights.map((insight: Insight, index: number) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="p-5 rounded-xl border-2 border-black bg-white shadow-neo-sm hover:shadow-neo hover:-translate-y-1 transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl border-2 border-black bg-white shadow-neo-sm">
              {getIcon(insight.type)}
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs uppercase tracking-[0.15em] text-black/40">{insight.title}</h4>
                {insight.score && (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-black text-white border-2 border-black">
                        {Math.round(insight.score * 100)}%
                    </span>
                )}
              </div>
              <p className="text-sm font-bold text-black leading-snug">
                {renderDescription(insight.description)}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
