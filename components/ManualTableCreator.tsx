"use client";

import React, { useState } from 'react';
import { Plus, Trash2, Check, X, Table as TableIcon, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import AnimatedBackground from '@/components/AnimatedBackground';

interface ManualTableCreatorProps {
    onConfirm: (data: any[], fileName: string) => void;
    onCancel: () => void;
}

export default function ManualTableCreator({ onConfirm, onCancel }: ManualTableCreatorProps) {
    const [headers, setHeaders] = useState<string[]>(['Category', 'Value']);
    const [rows, setRows] = useState<any[]>([
        { Category: 'Item 1', Value: 100 },
        { Category: 'Item 2', Value: 200 }
    ]);
    const [tableName, setTableName] = useState('Manual Data');

    const addColumn = () => {
        const newHeader = `Column ${headers.length + 1}`;
        setHeaders([...headers, newHeader]);
        setRows(rows.map(row => ({ ...row, [newHeader]: '' })));
    };

    const addRow = () => {
        const newRow = headers.reduce((acc, header) => ({ ...acc, [header]: '' }), {});
        setRows([...rows, newRow]);
    };

    const removeColumn = (index: number) => {
        if (headers.length <= 1) return;
        const headerToRemove = headers[index];
        const newHeaders = headers.filter((_, i) => i !== index);
        setHeaders(newHeaders);
        setRows(rows.map(row => {
            const { [headerToRemove]: _, ...rest } = row;
            return rest;
        }));
    };

    const removeRow = (index: number) => {
        if (rows.length <= 1) return;
        setRows(rows.filter((_, i) => i !== index));
    };

    const updateHeader = (index: number, newValue: string) => {
        const oldHeader = headers[index];
        const newHeaders = [...headers];
        newHeaders[index] = newValue;
        setHeaders(newHeaders);
        setRows(rows.map(row => {
            const { [oldHeader]: val, ...rest } = row;
            return { ...rest, [newValue]: val };
        }));
    };

    const updateCell = (rowIndex: number, header: string, value: string) => {
        const newRows = [...rows];
        // Auto-convert to number if possible
        const numericValue = value === '' ? '' : (!isNaN(Number(value)) ? Number(value) : value);
        newRows[rowIndex][header] = numericValue;
        setRows(newRows);
    };

    const handleConfirm = () => {
        // Filter out empty rows if any (optional)
        onConfirm(rows, `${tableName}.csv`);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full max-w-6xl mx-auto p-4 md:p-8 space-y-8"
        >
            <AnimatedBackground count={20} opacity={0.1} />
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-foreground text-background rounded-2xl shadow-neo-sm transform -rotate-3">
                        <TableIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <input 
                            type="text" 
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            className="text-xl sm:text-3xl font-black italic tracking-tighter bg-transparent border-b-4 border-border outline-none focus:border-primary transition-colors w-full max-w-[200px] sm:max-w-none"
                        />
                        <p className="text-[10px] font-black text-foreground/40 tracking-widest mt-1">Manual Table Creation Mode</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={onCancel}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-background border-3 sm:border-4 border-border rounded-xl sm:rounded-2xl font-black tracking-widest text-[10px] sm:text-xs hover:bg-gray-50 active:translate-y-1 transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="px-4 sm:px-8 py-2 sm:py-3 bg-primary text-background border-3 sm:border-4 border-border rounded-xl sm:rounded-2xl font-black tracking-widest text-[10px] sm:text-xs shadow-neo-sm sm:shadow-neo hover:translate-y-[-4px] hover:shadow-neo-lg active:translate-y-[2px] active:shadow-neo-sm transition-all"
                    >
                        Analyze
                    </button>
                </div>
            </div>

            <div className="bg-background border-4 border-border rounded-[2.5rem] shadow-neo-lg overflow-hidden flex flex-col min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-4 border-border bg-primary text-background">
                                {headers.map((header, i) => (
                                <th key={i} className="p-2 sm:p-4 border-r-2 sm:border-r-4 border-border min-w-[120px] sm:min-w-[180px]">
                                        <div className="flex items-center gap-2 group">
                                            <input 
                                                type="text" 
                                                value={header}
                                                onChange={(e) => updateHeader(i, e.target.value)}
                                                className="flex-1 bg-transparent font-black italic outline-none focus:text-background transition-colors text-xs sm:text-sm placeholder-white/60"
                                            />
                                            <button 
                                                onClick={() => removeColumn(i)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-4 w-20">
                                    <button 
                                        onClick={addColumn}
                                        className="p-3 text-background border-3 border-border rounded-xl hover:bg-primary hover:bg-background transition-all transform hover:rotate-12"
                                        title="Add Column"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {rows.map((row, rowIndex) => (
                                    <motion.tr 
                                        key={rowIndex}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="border-b-4 border-border last:border-b-0 bg-blue-50 hover:bg-primary/10 transition-colors"
                                    >
                                        {headers.map((header, colIndex) => (
                                        <td key={colIndex} className="p-1 sm:p-2 border-r-2 sm:border-r-4 border-border">
                                                <input 
                                                    type="text" 
                                                    value={row[header] ?? ""}
                                                    onChange={(e) => updateCell(rowIndex, header, e.target.value)}
                                                className="w-full p-2 sm:p-3 font-bold text-xs sm:text-sm bg-transparent outline-none focus:bg-background focus:shadow-neo-xs rounded-lg sm:rounded-xl transition-all"
                                                />
                                            </td>
                                        ))}
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => removeRow(rowIndex)}
                                                className="p-2 text-foreground/20 hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
                
                <div className="p-8 flex justify-center border-t-4 border-border bg-foreground/5">
                    <button 
                        onClick={addRow}
                        className="group flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-4 bg-background border-3 sm:border-4 border-border rounded-2xl sm:rounded-3xl font-black tracking-widest text-xs sm:text-sm shadow-neo-sm sm:shadow-neo hover:translate-y-[-4px] hover:shadow-neo-lg active:translate-y-[2px] active:shadow-neo-sm transition-all"
                    >
                        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        Add New Row
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-yellow-100 border-4 border-border rounded-3xl">
                <div className="p-3 bg-foreground text-background rounded-xl">
                    <Layout className="w-6 h-6" />
                </div>
                <p className="font-bold text-sm text-foreground/70">
                    <span className="font-black text-foreground">Pro Tip:</span> You can type numbers or text. Numbers will be automatically detected for charting!
                </p>
            </div>
        </motion.div>
    );
}
