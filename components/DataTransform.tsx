"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, ArrowRight, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DataTransformProps {
  data: any[];
  onDataTransformed: (newData: any[]) => void;
}

type TransformationType = "groupBy" | "filter" | "calc";

interface Transformation {
  id: string;
  type: TransformationType;
  config: any;
}

export default function DataTransform({ data, onDataTransformed }: DataTransformProps) {
  const [transformations, setTransformations] = useState<Transformation[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Get available columns
  const columns = useMemo(() => {
    if (!data.length) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Apply transformations pipeline
  const transformedData = useMemo(() => {
    let result = [...data];

    transformations.forEach((t) => {
      if (t.type === "groupBy") {
        const { groupCol, aggCol, operation } = t.config;
        if (!groupCol || !aggCol || !operation) return;

        const groups: Record<string, any[]> = {};
        result.forEach((row) => {
          const key = row[groupCol];
          if (!groups[key]) groups[key] = [];
          groups[key].push(row);
        });

        result = Object.keys(groups).map((key) => {
          const rows = groups[key];
          let aggValue = 0;

          if (operation === "count") {
             aggValue = rows.length;
          } else if (operation === "sum") {
             aggValue = rows.reduce((acc, r) => acc + (Number(r[aggCol]) || 0), 0);
          } else if (operation === "avg") {
             const sum = rows.reduce((acc, r) => acc + (Number(r[aggCol]) || 0), 0);
             aggValue = sum / rows.length;
          }

          return {
            [groupCol]: key,
            [`${operation}_${aggCol}`]: Number(aggValue.toFixed(2)),
            _count: rows.length
          };
        });
      }
    });

    return result;
  }, [data, transformations]);

  const addTransformation = (type: TransformationType) => {
    const newTrans: Transformation = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      config: { operation: "sum" }
    };
    setTransformations([...transformations, newTrans]);
  };

  const removeTransformation = (id: string) => {
    setTransformations(transformations.filter(t => t.id !== id));
  };

  const updateTransformation = (id: string, field: string, value: string) => {
      setTransformations(transformations.map(t => 
          t.id === id ? { ...t, config: { ...t.config, [field]: value } } : t
      ));
  }

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-28 sm:right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    className="w-[calc(100vw-32px)] sm:w-96 max-h-[80vh] sm:max-h-[600px] bg-background border-4 border-border shadow-neo rounded-2xl flex flex-col overflow-hidden pointer-events-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-background border-b-4 border-border">
                         <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary text-background border-2 border-border rounded-lg">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">Transform Data</h3>
                                <p className="text-xs text-muted-foreground font-medium">
                                    {transformations.length} active pipelines
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-foreground/10 rounded-lg transition-colors"
                        >
                            <span className="font-bold text-xl">&times;</span>
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4 overflow-y-auto space-y-4">
                        {transformations.map((t, i) => (
                            <div key={t.id} className="flex flex-col gap-3 p-3 bg-background border-2 border-border rounded-xl shadow-neo-sm">
                                <div className="flex items-center justify-between border-b-2 border-border/10 pb-2">
                                    <span className="font-bold text-[10px] bg-foreground text-background px-2 py-0.5 rounded">
                                        Step {i + 1}: {t.type}
                                    </span>
                                    <button 
                                        onClick={() => removeTransformation(t.id)}
                                        className="p-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                {t.type === "groupBy" && (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-black block mb-1">GROUP BY</label>
                                            <select 
                                                className="w-full p-2 border-2 border-border rounded-lg font-bold text-sm"
                                                value={t.config.groupCol}
                                                onChange={(e) => updateTransformation(t.id, "groupCol", e.target.value)}
                                            >
                                                <option value="">Select Column...</option>
                                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs font-black block mb-1">OP</label>
                                                <select 
                                                    className="w-full p-2 border-2 border-border rounded-lg font-bold text-sm"
                                                    value={t.config.operation}
                                                    onChange={(e) => updateTransformation(t.id, "operation", e.target.value)}
                                                >
                                                    <option value="sum">Sum</option>
                                                    <option value="avg">Average</option>
                                                    <option value="count">Count</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-black block mb-1">FIELD</label>
                                                <select 
                                                    className="w-full p-2 border-2 border-border rounded-lg font-bold text-sm"
                                                    value={t.config.aggCol}
                                                    onChange={(e) => updateTransformation(t.id, "aggCol", e.target.value)}
                                                >
                                                    <option value="">Select Field...</option>
                                                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        <div className="flex gap-2 justify-center pt-2">
                            <button
                                onClick={() => addTransformation("groupBy")}
                                className="flex items-center gap-2 px-4 py-2 bg-background border-2 border-border rounded-xl shadow-neo-sm hover:translate-y-[-1px] hover:shadow-none active:translate-y-[1px] transition-all text-sm font-bold"
                            >
                                <Plus className="w-4 h-4" />
                                Add Group By
                            </button>
                        </div>
                        
                        <div className="pt-4 border-t-2 border-border/10">
                            <button
                                onClick={() => {
                                    onDataTransformed(transformedData);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl shadow-neo hover:bg-primary transition-all font-bold"
                            >
                                Apply Changes <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className={cn(
                "p-4 bg-background text-foreground rounded-2xl shadow-neo border-4 border-border pointer-events-auto",
                isOpen && "hidden"
            )}
        >
            <Calculator className="w-8 h-8" />
        </motion.button>
    </div>
  );
}
