"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Trash2, FileText, ChevronRight } from 'lucide-react';
import { get, set } from 'idb-keyval';
import { cn } from '@/lib/utils';
import { ConfirmationModal } from './ConfirmationModal';

interface HistoryItem {
    id: string;
    fileName: string;
    timestamp: number;
    rowCount: number;
    data: any[];
}

const HISTORY_KEY = 'brutviz_history';

interface HistoryShelfProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: HistoryItem) => void;
    currentDataId?: string;
}

export const HistoryShelf: React.FC<HistoryShelfProps> = ({ isOpen, onClose, onSelect, currentDataId }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    const loadHistory = async () => {
        const stored = await get(HISTORY_KEY);
        if (stored) {
            setHistory(stored);
        }
    };

    const deleteItem = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const updated = history.filter(item => item.id !== id);
        setHistory(updated);
        await set(HISTORY_KEY, updated);
    };

    const handleClearAll = async () => {
        setHistory([]);
        await set(HISTORY_KEY, []);
        setShowClearConfirm(false);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="shelf-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[100]"
                    />
                )}
                {isOpen && (
                    <motion.div
                        key="shelf-container"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-[320px] sm:max-w-sm bg-background border-l-4 border-border z-[101] shadow-[-10px_0px_0px_0px_rgba(0,0,0,1)] flex flex-col"
                    >
                        <div className="p-6 border-b-4 border-border bg-primary text-background flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="w-6 h-6" />
                                <h2 className="text-2xl font-black tracking-tight">History</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-foreground/10 rounded-lg transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                    <div className="p-4 bg-gray-100 rounded-full border-2 border-border border-dashed">
                                        <FileText className="w-12 h-12" />
                                    </div>
                                    <p className="font-black tracking-widest text-sm">No history yet</p>
                                </div>
                            ) : (
                                history.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        onClick={() => onSelect(item)}
                                        className={cn(
                                            "p-4 border-4 border-border rounded-xl shadow-neo-sm cursor-pointer transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-neo group relative overflow-hidden",
                                            currentDataId === item.id ? "bg-primary/10 border-primary" : "bg-background"
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <h3 className="font-black text-lg truncate pr-8">{item.fileName}</h3>
                                                <div className="flex items-center gap-3 text-xs font-bold text-foreground/40">
                                                    <span>{item.rowCount} rows</span>
                                                    <span>•</span>
                                                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => deleteItem(e, item.id)}
                                                className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-background rounded-md border-2 border-transparent hover:border-border transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {history.length > 0 && (
                            <div className="p-4 border-t-4 border-border bg-gray-50">
                                <button 
                                    onClick={() => setShowClearConfirm(true)}
                                    className="w-full py-3 bg-background text-foreground border-2 border-border font-black tracking-widest text-xs hover:bg-destructive hover:text-background transition-all shadow-neo-sm active:translate-y-[2px] active:shadow-none"
                                >
                                    Clear History
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            
            <ConfirmationModal 
                isOpen={showClearConfirm}
                onClose={() => setShowClearConfirm(false)}
                onConfirm={handleClearAll}
                title="Clear History?"
                message="This will permanently delete all your saved datasets. This action cannot be undone."
                confirmText="Yes, Clear All"
                variant="destructive"
            />
        </>
    );
};
