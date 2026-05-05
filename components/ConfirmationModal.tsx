"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = 'default'
}) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-foreground/60 backdrop-blur-md"
                />
                
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-background border-4 border-border shadow-neo rounded-3xl p-8 overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <AlertCircle className="w-32 h-32 rotate-12" />
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black tracking-tighter italic leading-none">
                                {title}
                            </h3>
                            <p className="text-lg font-bold text-foreground/60 leading-tight">
                                {message}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={cn(
                                    "w-full py-4 rounded-2xl border-4 border-border font-black  tracking-widest shadow-neo-sm active:translate-y-[2px] active:shadow-none transition-all",
                                    variant === 'destructive' 
                                        ? "bg-destructive text-background hover:bg-destructive/90" 
                                        : "bg-primary text-background hover:bg-primary/90"
                                )}
                            >
                                {confirmText}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-background text-foreground border-4 border-border rounded-2xl font-black tracking-widest shadow-neo-sm hover:bg-foreground/5 active:translate-y-[2px] active:shadow-none transition-all"
                            >
                                {cancelText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
