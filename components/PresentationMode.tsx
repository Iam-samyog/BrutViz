"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Play, Maximize2, Sparkles, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChartGenerator from './ChartGenerator';
import { getCategoryDistributions } from '@/lib/insights';

interface PresentationModeProps {
    data: any[];
    isOpen: boolean;
    onClose: () => void;
}

const SLIDE_TYPES = ['bar', 'line', 'area', 'pie'];

export const PresentationMode: React.FC<PresentationModeProps> = ({ data, isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<{col: string, val: string} | null>(null);
    const [customXAxis, setCustomXAxis] = useState<string>("");
    const [customYAxis, setCustomYAxis] = useState<string>("");

    const { numericKeys, categoricalKeys } = React.useMemo(() => {
        if (!data.length) return { numericKeys: [], categoricalKeys: [] };
        const firstRow = data[0];
        const nKeys: string[] = [];
        const cKeys: string[] = [];
        Object.keys(firstRow).forEach((key) => {
            const val = firstRow[key];
            if (typeof val === "number" || (!isNaN(Number(val)) && val !== "")) nKeys.push(key);
            else cKeys.push(key);
        });
        return { numericKeys: nKeys, categoricalKeys: cKeys };
    }, [data]);

    // Initialize defaults
    React.useEffect(() => {
        if (!customXAxis && categoricalKeys.length > 0) setCustomXAxis(categoricalKeys[0]);
        if (!customYAxis && numericKeys.length > 0) setCustomYAxis(numericKeys[0]);
    }, [categoricalKeys, numericKeys, customXAxis, customYAxis]);

    const categories = React.useMemo(() => getCategoryDistributions(data), [data]);

    const filteredData = React.useMemo(() => {
        if (!selectedCategory) return data;
        return data.filter(row => String(row[selectedCategory.col]) === selectedCategory.val);
    }, [data, selectedCategory]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDE_TYPES.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDE_TYPES.length) % SLIDE_TYPES.length);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center overflow-hidden font-inter"
            >
                {/* Dynamic Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
                    style={{ 
                        backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', 
                        backgroundSize: '60px 60px' 
                    }} 
                />
                
                {/* Decorative Elements */}
                <div className="absolute top-[-100px] left-[-100px] w-80 h-80 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-100px] right-[-100px] w-80 h-80 bg-red-500/20 rounded-full blur-[120px] pointer-events-none" />

                {/* Header Context */}
                <div className="absolute top-8 left-8 flex items-center gap-4 z-50">
                    <div className="p-3 bg-primary text-white border-4 border-white rounded-2xl shadow-neo-sm rotate-[-3deg]">
                        <LayoutDashboard className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-white text-2xl font-black tracking-tighter uppercase italic leading-none">BrutViz Live</h3>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em]">Presentation Mode</p>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 p-4 bg-white border-4 border-black rounded-2xl shadow-neo hover:translate-y-[2px] hover:shadow-neo-sm transition-all z-50 group active:scale-95"
                >
                    <X className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                </button>

                <div className="w-full h-full max-w-7xl flex flex-col relative z-10 px-4 py-4 md:px-20 md:py-8">
                    {/* Category Selector Toolbar */}
                    <div className="flex flex-col items-center gap-4 mb-10">
                        {categories.length > 0 ? (
                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <button 
                                    onClick={() => setSelectedCategory(null)}
                                    className={cn(
                                        "px-6 py-3 rounded-2xl border-4 font-black text-sm transition-all shadow-neo-sm transform hover:scale-105 active:scale-95",
                                        !selectedCategory 
                                            ? "bg-white text-black border-white shadow-[4px_4px_0px_0px_#22c55e]" 
                                            : "bg-transparent text-white/40 border-white/20 hover:border-white hover:text-white"
                                    )}
                                >
                                    🌍 VIEW ALL DATA
                                </button>
                                
                                {categories.slice(0, 2).map((cat) => (
                                    <React.Fragment key={cat.column}>
                                        <div className="h-8 w-[2px] bg-white/10 hidden md:block mx-2" />
                                        {cat.topValues.map((v, i) => (
                                            <button 
                                                key={`${cat.column}-${i}`}
                                                onClick={() => setSelectedCategory({ col: cat.column, val: v.value })}
                                                className={cn(
                                                    "px-6 py-3 rounded-2xl border-4 font-black text-sm transition-all shadow-neo-sm transform hover:scale-105 active:scale-95 uppercase",
                                                    selectedCategory?.val === v.value 
                                                        ? "bg-primary text-white border-primary shadow-[4px_4px_0px_0px_#ffffff]" 
                                                        : "bg-transparent text-white/40 border-white/20 hover:border-white hover:text-white"
                                                )}
                                            >
                                                {v.value}
                                            </button>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/5 border-2 border-dashed border-white/20 px-8 py-4 rounded-3xl">
                                <p className="text-white/30 font-bold text-sm tracking-widest uppercase">No categorical filters available for this segment</p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center min-h-0 space-y-4 md:space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${currentSlide}-${selectedCategory?.val}-${customXAxis}-${customYAxis}`}
                                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: -20, opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                                className="w-full h-full flex flex-col items-center justify-center min-h-0"
                            >
                                <div className="text-center space-y-4 mb-8">
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="inline-block px-4 py-1 bg-primary/20 text-primary border-2 border-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-2"
                                    >
                                        Comparing {customYAxis} by {customXAxis}
                                    </motion.div>
                                    <h2 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] text-white">
                                        {selectedCategory ? (
                                            <>
                                                <span className="text-primary underline decoration-white/20">{selectedCategory.val}</span>
                                                <span className="block text-xl sm:text-3xl mt-4 text-white/40 font-bold normal-case tracking-normal opacity-60">Analysis of {customYAxis}</span>
                                            </>
                                        ) : (
                                            <>
                                                {SLIDE_TYPES[currentSlide]} 
                                                <span className="pl-2 sm:pl-4 text-primary italic underline decoration-[4px] sm:decoration-[8px] md:decoration-[12px] decoration-white underline-offset-[4px] sm:underline-offset-[8px] md:underline-offset-[12px]">Global {customYAxis}</span>
                                            </>
                                        )}
                                    </h2>
                                </div>
 
                                <div className="w-full flex-1 bg-white border-4 md:border-[8px] border-black rounded-2xl md:rounded-[2.5rem] shadow-[10px_10px_0px_0px_#22c55e] md:shadow-[20px_20px_0px_0px_#22c55e] p-3 md:p-8 min-h-0 overflow-hidden relative group">
                                    <ChartGenerator 
                                        data={filteredData} 
                                        isStatic={true} 
                                        forcedChartType={SLIDE_TYPES[currentSlide] as any} 
                                        forcedXAxis={customXAxis}
                                        forcedYAxis={customYAxis}
                                        hideConfig={true}
                                        fullHeight={true}
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between mt-6 md:mt-8 max-w-5xl mx-auto w-full gap-6">
                        {/* Navigation Controls */}
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={prevSlide}
                                className="p-4 bg-white border-4 border-black rounded-2xl shadow-neo hover:translate-y-[2px] active:scale-95 transition-all"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>

                            <div className="flex gap-2 p-3 bg-white border-4 border-black rounded-2xl shadow-neo min-w-[120px] justify-center">
                                {SLIDE_TYPES.map((_, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setCurrentSlide(i)}
                                        className={cn(
                                            "h-3 rounded-full transition-all duration-300 border-2 border-black",
                                            currentSlide === i ? "w-10 bg-primary" : "w-3 bg-black/10 hover:bg-black/20"
                                        )}
                                    />
                                ))}
                            </div>

                            <button 
                                onClick={nextSlide}
                                className="p-4 bg-white border-4 border-black rounded-2xl shadow-neo hover:translate-y-[2px] active:scale-95 transition-all"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </div>

                        {/* Axis Controls */}
                        <div className="flex flex-wrap items-center gap-4 p-4 bg-black/40 backdrop-blur-md border-2 border-white/20 rounded-[2rem]">
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Dimension (X)</span>
                                <select 
                                    value={customXAxis}
                                    onChange={(e) => setCustomXAxis(e.target.value)}
                                    className="bg-white border-2 border-black rounded-lg px-3 py-1.5 font-bold text-xs shadow-neo-sm outline-none cursor-pointer"
                                >
                                    {categoricalKeys.concat(numericKeys).map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-[1px] h-6 bg-white/10" />

                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Measure (Y)</span>
                                <select 
                                    value={customYAxis}
                                    onChange={(e) => setCustomYAxis(e.target.value)}
                                    className="bg-white border-2 border-black rounded-lg px-3 py-1.5 font-bold text-xs shadow-neo-sm outline-none cursor-pointer"
                                >
                                    {numericKeys.map(k => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress bar at the very bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentSlide + 1) / SLIDE_TYPES.length) * 100}%` }}
                        className="h-full bg-primary"
                    />
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
