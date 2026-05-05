"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sticker, Info, AlertTriangle, CheckCircle2, Star, ArrowUpRight, TrendingUp, Zap, Heart, ThumbsUp, ThumbsDown, Target, Flame, Trophy, Crown, Sparkles, Rocket, Eye, Lightbulb, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

export const STICKERS = [
    // Text Stickers
    { id: 'look', type: 'text', content: 'LOOK HERE!', color: 'bg-yellow-300', rotate: -5 },
    { id: 'danger', type: 'text', content: 'DANGER!', color: 'bg-red-500 text-background', rotate: 3 },
    { id: 'cool', type: 'text', content: 'COOL DATA', color: 'bg-primary text-background', rotate: -2 },
    { id: 'growth', type: 'text', content: 'GROWTH!', color: 'bg-green-500 text-background', rotate: 5 },
    { id: 'wow', type: 'text', content: 'WOW!', color: 'bg-purple-500 text-background', rotate: -8 },
    { id: 'hot', type: 'text', content: '🔥 HOT!', color: 'bg-orange-500 text-background', rotate: 6 },
    { id: 'new', type: 'text', content: 'NEW!', color: 'bg-pink-500 text-background', rotate: -4 },
    { id: 'important', type: 'text', content: 'IMPORTANT', color: 'bg-foreground text-background', rotate: 2 },
    { id: 'key_insight', type: 'text', content: '🔑 KEY', color: 'bg-amber-400', rotate: -3 },
    { id: 'question', type: 'text', content: '❓ WHY?', color: 'bg-blue-300', rotate: 7 },
    // Icon Stickers
    { id: 'star_stick', type: 'icon', content: <Star className="w-8 h-8"/>, color: 'bg-yellow-400', rotate: 10 },
    { id: 'zap_stick', type: 'icon', content: <Zap className="w-8 h-8"/>, color: 'bg-blue-400', rotate: -10 },
    { id: 'trending_stick', type: 'icon', content: <TrendingUp className="w-8 h-8"/>, color: 'bg-green-400', rotate: 0 },
    { id: 'alert_stick', type: 'icon', content: <AlertTriangle className="w-8 h-8"/>, color: 'bg-red-400', rotate: 15 },
    { id: 'heart_stick', type: 'icon', content: <Heart className="w-8 h-8"/>, color: 'bg-pink-400', rotate: -12 },
    { id: 'thumbsup_stick', type: 'icon', content: <ThumbsUp className="w-8 h-8"/>, color: 'bg-green-300', rotate: 8 },
    { id: 'thumbsdown_stick', type: 'icon', content: <ThumbsDown className="w-8 h-8"/>, color: 'bg-red-300', rotate: -8 },
    { id: 'target_stick', type: 'icon', content: <Target className="w-8 h-8"/>, color: 'bg-indigo-400', rotate: 5 },
    { id: 'flame_stick', type: 'icon', content: <Flame className="w-8 h-8"/>, color: 'bg-orange-400', rotate: -5 },
    { id: 'trophy_stick', type: 'icon', content: <Trophy className="w-8 h-8"/>, color: 'bg-amber-500', rotate: 0 },
    { id: 'crown_stick', type: 'icon', content: <Crown className="w-8 h-8"/>, color: 'bg-yellow-500', rotate: -7 },
    { id: 'sparkles_stick', type: 'icon', content: <Sparkles className="w-8 h-8"/>, color: 'bg-purple-300', rotate: 12 },
    { id: 'rocket_stick', type: 'icon', content: <Rocket className="w-8 h-8"/>, color: 'bg-cyan-400', rotate: -15 },
    { id: 'eye_stick', type: 'icon', content: <Eye className="w-8 h-8"/>, color: 'bg-gray-400', rotate: 3 },
    { id: 'lightbulb_stick', type: 'icon', content: <Lightbulb className="w-8 h-8"/>, color: 'bg-yellow-200', rotate: -6 },
    { id: 'flag_stick', type: 'icon', content: <Flag className="w-8 h-8"/>, color: 'bg-red-500 text-background', rotate: 10 },
    { id: 'check_stick', type: 'icon', content: <CheckCircle2 className="w-8 h-8"/>, color: 'bg-green-500 text-background', rotate: -10 },
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
                        className="fixed inset-0 bg-foreground/20 z-[100]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-[260px] sm:max-w-[280px] bg-background border-l-4 border-border z-[101] shadow-[-10px_0px_0px_0px_rgba(0,0,0,1)] flex flex-col"
                    >
                        <div className="p-6 border-b-4 border-border bg-primary text-background flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sticker className="w-6 h-6" />
                                <h2 className="text-xl font-black tracking-tight">Stickers</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-foreground/10 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 gap-4">
                            <p className="text-xs font-black text-foreground/40 mb-2">Click to add sticker</p>
                            {STICKERS.map((sticker) => (
                                <button
                                    key={sticker.id}
                                    onClick={() => onAddSticker(sticker)}
                                    className={cn(
                                        "p-4 border-4 border-border rounded-xl shadow-neo-sm hover:shadow-neo hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all flex items-center justify-center font-black  tracking-tighter text-sm",
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
