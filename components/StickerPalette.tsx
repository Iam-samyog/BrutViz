"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sticker, Info, AlertTriangle, CheckCircle2, Star, ArrowUpRight, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const STICKERS = [
    { id: 'look', type: 'text', content: 'LOOK HERE!', color: 'bg-yellow-300', rotate: -5 },
    { id: 'danger', type: 'text', content: 'DANGER!', color: 'bg-red-500 text-white', rotate: 3 },
    { id: 'cool', type: 'text', content: 'COOL DATA', color: 'bg-primary text-white', rotate: -2 },
    { id: 'growth', type: 'text', content: 'GROWTH!', color: 'bg-green-500 text-white', rotate: 5 },
    { id: 'star_stick', type: 'icon', content: <Star className="w-8 h-8"/>, color: 'bg-yellow-400', rotate: 10 },
    { id: 'zap_stick', type: 'icon', content: <Zap className="w-8 h-8"/>, color: 'bg-blue-400', rotate: -10 },
    { id: 'trending_stick', type: 'icon', content: <TrendingUp className="w-8 h-8"/>, color: 'bg-green-400', rotate: 0 },
    { id: 'alert_stick', type: 'icon', content: <AlertTriangle className="w-8 h-8"/>, color: 'bg-red-400', rotate: 15 },
];

interface StickerPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSticker: (sticker: any) => void;
}

export const StickerPalette: React.FC<StickerPaletteProps> = ({ isOpen, onClose, onAddSticker }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 z-[100]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-[260px] sm:max-w-[280px] bg-white border-l-4 border-black z-[101] shadow-[-10px_0px_0px_0px_rgba(0,0,0,1)] flex flex-col"
                    >
                        <div className="p-6 border-b-4 border-black bg-primary text-white flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sticker className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight uppercase">Stickers</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-black/10 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 gap-4">
                            <p className="text-xs font-black uppercase text-black/40 mb-2">Click to add sticker</p>
                            {STICKERS.map((sticker) => (
                                <button
                                    key={sticker.id}
                                    onClick={() => onAddSticker(sticker)}
                                    className={cn(
                                        "p-4 border-4 border-black rounded-xl shadow-neo-sm hover:shadow-neo hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all flex items-center justify-center font-black uppercase tracking-tighter text-sm",
                                        sticker.color
                                    )}
                                    style={{ transform: `rotate(${sticker.rotate}deg)` }}
                                >
                                    {sticker.content}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
