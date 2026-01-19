"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Play, Maximize2, Sparkles, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChartGenerator from './ChartGenerator';

interface PresentationModeProps {
    data: any[];
    isOpen: boolean;
    onClose: () => void;
}

const SLIDE_TYPES = ['bar', 'line', 'area', 'pie'];

export const PresentationMode: React.FC<PresentationModeProps> = ({ data, isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

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
                        <h3 className="text-white text-2xl font-black tracking-tighter uppercase italic leading-none">Vizly Live</h3>
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
                    <div className="flex-1 flex flex-col items-center justify-center min-h-0 space-y-4 md:space-y-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                                animate={{ y: 0, opacity: 1, scale: 1 }}
                                exit={{ y: -20, opacity: 0, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                                className="w-full h-full flex flex-col items-center justify-center min-h-0"
                            >
                                <div className="text-center space-y-2 mb-4">
                                    <h2 className="text-3xl sm:text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] text-white">
                                        {SLIDE_TYPES[currentSlide]} 
                                        <span className="pl-2 sm:pl-4 text-primary italic underline decoration-[4px] sm:decoration-[8px] md:decoration-[12px] decoration-white underline-offset-[4px] sm:underline-offset-[8px] md:underline-offset-[12px]">Analysis</span>
                                    </h2>
                                </div>

                                <div className="w-full flex-1 bg-white border-4 md:border-[8px] border-black rounded-2xl md:rounded-[2.5rem] shadow-[10px_10px_0px_0px_#22c55e] md:shadow-[20px_20px_0px_0px_#22c55e] p-3 md:p-8 min-h-0 overflow-hidden relative group">
                                    <ChartGenerator 
                                        data={data} 
                                        isStatic={true} 
                                        forcedChartType={SLIDE_TYPES[currentSlide] as any} 
                                        hideConfig={true}
                                        fullHeight={true}
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between mt-6 md:mt-8 max-w-2xl mx-auto w-full gap-4">
                        <button 
                            onClick={prevSlide}
                            className="p-3 md:p-5 bg-white border-2 md:border-4 border-black rounded-xl md:rounded-2xl shadow-neo-sm md:shadow-neo hover:translate-y-[2px] transition-all active:scale-90 flex-shrink-0"
                        >
                            <ChevronLeft className="w-6 h-6 md:w-10 md:h-10" />
                        </button>

                        <div className="flex gap-2 md:gap-3 px-3 py-2 md:px-6 md:py-4 bg-white border-2 md:border-4 border-black rounded-2xl md:rounded-3xl shadow-neo-sm overflow-x-auto no-scrollbar">
                            {SLIDE_TYPES.map((_, i) => (
                                <button 
                                    key={i}
                                    onClick={() => setCurrentSlide(i)}
                                    className={cn(
                                        "h-2 md:h-3 rounded-full transition-all duration-300 border-[1px] md:border-2 border-black flex-shrink-0",
                                        currentSlide === i ? "w-8 md:w-12 bg-primary" : "w-2 md:w-3 bg-black/10 hover:bg-black/20"
                                    )}
                                />
                            ))}
                        </div>

                        <button 
                            onClick={nextSlide}
                            className="p-3 md:p-5 bg-white border-2 md:border-4 border-black rounded-xl md:rounded-2xl shadow-neo-sm md:shadow-neo hover:translate-y-[2px] transition-all active:scale-90 flex-shrink-0"
                        >
                            <ChevronRight className="w-6 h-6 md:w-10 md:h-10" />
                        </button>
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
