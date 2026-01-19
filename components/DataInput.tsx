"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X, BarChart3, Sparkles, Share2, Database, Code2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import { read, utils } from "xlsx";
import { cn } from "@/lib/utils";

interface DataInputProps {
  onDataParsed: (data: any[], fileName?: string) => void;
}

export default function DataInput({ onDataParsed }: DataInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseTextData = (content: string, type: "csv" | "json", name?: string) => {
    setError(null);
    try {
      if (type === "json") {
        const data = JSON.parse(content);
        if (Array.isArray(data)) {
          onDataParsed(data, name || "data.json");
        } else {
          setError("JSON must be an array of objects.");
        }
      } else {
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true, // Auto-convert numbers
          complete: (results) => {
            if (results && results.errors && results.errors.length > 0) {
              console.warn("PapaParse results had some errors (likely malformed rows):", results.errors);
            }
            // Proceed if we have ANY data, even with errors
            if (results && results.data && results.data.length > 0) {
              onDataParsed(results.data as any[], name || "data.csv");
            } else if (!results.errors || results.errors.length === 0) {
              // Only show error if there's no data AND no errors were reported (empty file)
              setError("No data found in parsed CSV.");
            } else {
              // If there's no data and many errors, show one generic error
              setError("Failed to parse data. Please check the file format.");
            }
          },
          error: (err: Error) => {
            setError("Failed to parse CSV: " + err.message);
          }
        });
      }
    } catch (e) {
      setError("Invalid format. Please check your data.");
    }
  };

  const processFile = (file: File) => {
    setError(null);
    const isExcel = file.name.match(/\.(xlsx|xls)$/i);
    const isJson = file.name.match(/\.json$/i) || file.type.includes("json");

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = utils.sheet_to_json(worksheet);
            
            if (jsonData && jsonData.length > 0) {
                onDataParsed(jsonData as any[], file.name);
            } else {
                setError("No data found in Excel sheet.");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to parse Excel file.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (isJson) {
          parseTextData(content, "json", file.name);
        } else {
          parseTextData(content, "csv", file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handlePaste = () => {
    if (!textInput.trim()) return;
    const trimmed = textInput.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
       parseTextData(trimmed, "json", "pasted-data.json");
    } else {
       parseTextData(trimmed, "csv", "pasted-data.csv");
    }
  };

  return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-4xl mx-auto space-y-6 py-4 px-4"
    >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 sticky top-0  backdrop-blur-sm z-10 p-2 rounded-[2rem]">
            {/* Drop Zone */}
            <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    "relative h-[280px] md:h-[350px] flex flex-col items-center justify-center border-[4px] md:border-[6px] border-dashed rounded-[2rem] md:rounded-[3rem] transition-all cursor-pointer group overflow-hidden",
                    isDragging 
                        ? "border-primary bg-primary/5 scale-[1.01] md:scale-[1.02]" 
                        : "border-black/20 hover:border-black/40 bg-white"
                )}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                    style={{ 
                        backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)', 
                        backgroundSize: '20px 20px' 
                    }} 
                />
                
                <div className="relative z-10 flex flex-col items-center text-center px-6 space-y-6">
                    <div className="p-6 bg-black text-white rounded-[2rem] shadow-neo group-hover:rotate-6 transition-transform group-hover:scale-110">
                        <Upload className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-2xl font-black uppercase italic tracking-tight">Drop Files Here</p>
                        <p className="text-sm font-bold text-black/40 uppercase tracking-widest">CSV • JSON • XLSX</p>
                    </div>
                    <button className="px-8 py-3 bg-white border-4 border-black font-black uppercase tracking-widest text-xs shadow-neo-sm hover:translate-y-1 hover:shadow-neo-xs transition-all">
                        Browse Files
                    </button>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept=".csv,.json,.xlsx,.xls"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Paste Data */}
            <div className="relative h-[350px] flex flex-col bg-white border-4 border-black rounded-[3rem] shadow-neo-lg overflow-hidden group">
                <div className="p-5 border-b-4 border-black bg-black text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-lg">
                            <FileText className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black uppercase tracking-widest text-xs italic">Raw Snippet</span>
                    </div>
                </div>
                
                <textarea 
                    className="flex-1 p-6 font-mono text-sm bg-transparent outline-none resize-none placeholder:text-black/20 font-bold"
                    placeholder={`Name,Sales,Region\nApple,100,North\nOrange,150,South...`}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                />
                
                <div className="p-5 border-t-4 border-black bg-gray-50">
                    <button 
                        disabled={!textInput.trim()}
                        onClick={handlePaste}
                        className="w-full py-4 bg-primary text-white border-4 border-black rounded-2xl font-black uppercase tracking-widest text-sm shadow-neo-sm hover:translate-y-1 hover:shadow-neo-xs transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-neo-sm active:shadow-none active:translate-y-2"
                    >
                        Analyze Snippet
                    </button>
                </div>
            </div>
        </div>

        {/* Floating Icons or Decorative Elements */}
        <div className="flex justify-center gap-12 opacity-10 grayscale py-8">
            <BarChart3 className="w-12 h-12" />
            <X className="w-12 h-12" />
            <FileText className="w-12 h-12" />
        </div>
    </motion.div>
  );
}
