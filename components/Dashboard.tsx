"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LZString from "lz-string";
import { jsPDF } from "jspdf";
import { BarChart3, Table as TableIcon, RefreshCcw, Download, Image as ImageIcon, ImageDown, Trash2, X, Upload, FileText, AlertCircle, ChevronLeft, ChevronRight, Search, ArrowUpDown, Link as LinkIcon, Mail, Copy, Check, LayoutDashboard, Clock, Sticker, Play } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HistoryShelf } from "@/components/HistoryShelf";
import { StickerPalette } from "@/components/StickerPalette";
import { PresentationMode } from "@/components/PresentationMode";
import { get, set } from "idb-keyval";
import { toPng } from "html-to-image";
import Papa from "papaparse";
import QRCode from "react-qr-code";
import DataInput from "@/components/DataInput";
import DataTable from "@/components/DataTable";
import ChartGenerator from "@/components/ChartGenerator";
import InsightsPanel from "@/components/InsightsPanel";
import DataTransform from "@/components/DataTransform";
import ChatInterface from "@/components/ChatInterface";
import { cn } from "@/lib/utils";

// Define storage keys
const STORAGE_KEY_DATA = "brutviz_v2_data";
const STORAGE_KEY_NAME = "brutviz_v2_filename";
const HISTORY_KEY = 'brutviz_history';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [currentDataId, setCurrentDataId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<"table" | "charts">("table");
  const [transformedData, setTransformedData] = useState<any[] | null>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isStickersOpen, setIsStickersOpen] = useState(false);
  const [isPresentationModeOpen, setIsPresentationModeOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const activeData = transformedData || data;

  // Check for shared data in URL on mount
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
        const searchParams = new URLSearchParams(window.location.search);
        const sharedData = searchParams.get("share");
        if (sharedData) {
            try {
                const decompressed = LZString.decompressFromEncodedURIComponent(sharedData);
                if (decompressed) {
                    const parsed = JSON.parse(decompressed);
                    setData(parsed.data);
                    setFileName(parsed.fileName || "shared_data.csv");
                    setLoading(false);
                    // Remove query param to clean URL
                    window.history.replaceState({}, "", window.location.pathname);
                    return; 
                }
            } catch (e) {
                console.error("Failed to parse shared URL", e);
            }
        }
    }

    const storedData = localStorage.getItem(STORAGE_KEY_DATA);
    const storedName = localStorage.getItem(STORAGE_KEY_NAME);
    
    if (storedData) {
        try {
            setData(JSON.parse(storedData));
        } catch (e) {
            console.error("Failed to parse stored data", e);
        }
    }
    if (storedName) {
        setFileName(storedName);
    }
    setLoading(false);
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    if (data.length > 0) {
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(data));
        if (fileName) localStorage.setItem(STORAGE_KEY_NAME, fileName);
    }
  }, [data, fileName]);

  const saveToHistory = async (parsedData: any[], name: string) => {
    const newId = Date.now().toString();
    const newItem = {
        id: newId,
        fileName: name,
        timestamp: Date.now(),
        rowCount: parsedData.length,
        data: parsedData
    };

    try {
        const history: any[] = (await get(HISTORY_KEY)) || [];
        // Keep only the last 10 items
        const updatedHistory = [newItem, ...history.filter(item => item.fileName !== name)].slice(0, 10);
        await set(HISTORY_KEY, updatedHistory);
        setCurrentDataId(newId);
    } catch (e) {
        console.error("Failed to save to history", e);
    }
  };

  const handleDataParsed = (parsedData: any[], name: string = "data.csv") => {
    setData(parsedData);
    setFileName(name);
    setTransformedData(null);
    saveToHistory(parsedData, name);
  };

  const handleHistorySelect = (item: any) => {
    setData(item.data);
    setFileName(item.fileName);
    setAnnotations(item.annotations || []);
    setCurrentDataId(item.id);
    setTransformedData(null);
    setIsHistoryOpen(false);
  };

  const handleAddSticker = (stickerTemplate: any) => {
    const newSticker = {
        ...stickerTemplate,
        instanceId: Date.now().toString(),
        x: 100 + Math.random() * 50,
        y: 100 + Math.random() * 50
    };
    setAnnotations([...annotations, newSticker]);
    setIsStickersOpen(false);
  };

  const removeSticker = (id: string) => {
    setAnnotations(annotations.filter(a => a.instanceId !== id));
  };

  const reset = () => {
      setData([]);
      setFileName("");
      setCurrentDataId("");
      localStorage.removeItem(STORAGE_KEY_DATA);
      localStorage.removeItem(STORAGE_KEY_NAME);
  };

  const handleExportCSV = () => {
     if (!data.length) return;
     const csv = Papa.unparse(data);
     const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.setAttribute("download", `vizly-export-${Date.now()}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handleShareClick = () => {
      if (!data.length) return;
      const payload = JSON.stringify({ data, fileName });
      const compressed = LZString.compressToEncodedURIComponent(payload);
      const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`;
      setShareUrl(url);
      setIsShareOpen(true);
  };

  const handleCopyLink = () => {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = async () => {
      setIsExporting(true);
      // Allow render cycle to complete and charts to stabilize
      setTimeout(async () => {
          const element = document.getElementById("full-report-capture");
          if (!element) {
              setIsExporting(false);
              return;
          }
          
          try {
              const width = element.offsetWidth;
              const height = element.offsetHeight;

              const dataUrl = await toPng(element, { 
                  backgroundColor: '#ffffff',
                  pixelRatio: 1.5, // Reduced slightly for faster capture but still high quality
                  cacheBust: true,
                  width: width,
                  height: height,
                  style: {
                      transform: 'scale(1)',
                      transformOrigin: 'top left'
                  }
              });
              
              const pdf = new jsPDF({
                  orientation: height > width ? "portrait" : "landscape",
                  unit: "px",
                  format: [width, height],
                  compress: true
              });

              pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
              pdf.save(`vizly-report-${Date.now()}.pdf`);

          } catch (err) {
              console.error("Export failed", err);
              alert("Failed to generate report. Please try again.");
          } finally {
              setIsExporting(false);
          }
      }, 2500); // Increased timeout to 2.5s for maximum reliability
  };

  if (!isClient) return null; // Avoid hydration mismatch

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
        {/* Navbar */}
        <Navbar onHistoryClick={() => setIsHistoryOpen(true)} />

        <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
            />

            {/* Dynamic Animated Background (70+ Balls) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 ">
                {Array.from({ length: 70 }).map((_, i) => {
                    const colors = ['bg-primary', 'bg-[#FF2D55]', 'bg-[#AF52DE]', 'bg-[#22c55e]'];
                    const size = Math.random() * 60 + 20; // 20px to 80px
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const top = Math.random() * 100 + '%';
                    const left = Math.random() * 100 + '%';
                    const delay = Math.random() * 5;
                    const duration = Math.random() * 6 + 4;

                    return (
                        <motion.div
                            key={i}
                            className={`absolute rounded-full border-2 border-black shadow-neo-sm ${color}`}
                            style={{ 
                                top, 
                                left, 
                                width: size, 
                                height: size 
                            }}
                            animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.05, 0.25, 0.05],
                                y: [0, Math.random() * -50 - 20, 0],
                                x: [0, Math.random() * 20 - 10, 0]
                            }}
                            transition={{
                                duration: duration,
                                repeat: Infinity,
                                delay: delay,
                                ease: "easeInOut"
                            }}
                        />
                    );
                })}
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-3xl space-y-12 text-center relative z-10"
            >
                <div className="space-y-6 pt-3">
                    
                    <h1 className="text-7xl font-black tracking-tighter text-black sm:text-9xl leading-[0.8]">
                        Data Viz<br/>
                        <span className="relative inline-block mt-4">
                            <span className="relative z-10 text-white px-6 py-2 pb-4 italic">Simplified.</span>
                            <div className="absolute inset-0 bg-black border-4 border-black shadow-neo rotate-[-2deg] z-0" />
                        </span>
                    </h1>
                    <p className="text-xl text-black/60 max-w-2xl mx-auto font-bold leading-relaxed pt-4">
                        The world's <span className="text-black underline decoration-4 decoration-primary underline-offset-4">fastest</span> Data analyzer. <br/> 
                        No signups. No hazzle. Just data.
                    </p>
                </div>
                
                <div className="relative">
                    <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] blur-3xl -z-10" />
                    <DataInput onDataParsed={handleDataParsed} />
                    
                    <div className="mt-6 flex justify-center">
                        <button 
                            onClick={async () => {
                                const response = await fetch('/demo_data.csv');
                                const text = await response.text();
                                Papa.parse(text, {
                                    header: true,
                                    dynamicTyping: true,
                                    skipEmptyLines: true,
                                    complete: (results) => {
                                        setData(results.data);
                                        setFileName("demo_data.csv");
                                        saveToHistory(results.data, "demo_data.csv");
                                    }
                                });
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-black rounded-xl font-bold hover:shadow-neo hover:translate-y-[-2px] transition-all"
                        >
                            <Play className="w-4 h-4 text-primary" />
                            Use Demo Dataset
                        </button>
                    </div>
                </div>

                {/* How to Use Section */}
                <div className="pt-8 space-y-12 w-full text-left">
                    <div className="space-y-2 text-center">
                        <h2 className="text-4xl font-black tracking-tight">How it works.</h2>
                        <p className="font-bold text-black/40">Master BrutViz in less than 30 seconds.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                        {[
                            { step: "01", title: "Drop CSV/Excel", desc: "Just drag your file anywhere on the dashboard. We support CSV, Excel, and JSON.", icon: <Upload className="w-6 h-6 text-white"/>, color: "bg-primary" },
                            { step: "02", title: "Automated Insights", desc: "Our AI immediately scans your data to find trends, outliers, and patterns.", icon: <Search className="w-6 h-6 text-white"/>, color: "bg-[#AF52DE]" },
                            { step: "03", title: "Custom Charts", desc: "Generate Bar, Line, Pie, and Area charts with zero effort. Fully interactive.", icon: <BarChart3 className="w-6 h-6 text-white"/>, color: "bg-[#FF2D55]" },
                            { step: "04", title: "Instant Export", desc: "Download high-quality PDF reports or individual charts for your meetings.", icon: <Download className="w-6 h-6 text-white"/>, color: "bg-[#007AFF]" }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                className="p-6 bg-white border-4 border-black rounded-2xl shadow-neo flex gap-4 items-start group"
                            >
                                <div className={cn("p-4 rounded-xl border-2 border-black shadow-neo-sm shrink-0", item.color)}>
                                    {item.icon}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-black">{item.title}</h3>
                                        <span className="text-xs font-black opacity-20 group-hover:opacity-100 transition-opacity">STEP {item.step}</span>
                                    </div>
                                    <p className="text-sm font-bold text-black/60 leading-snug">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 bg-background" id="dashboard-container">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b-2 border-[rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-white border-2 border-black rounded-lg shadow-neo-sm">
                <LayoutDashboard className="w-6 h-6" />
            </div>
            <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-black truncate max-w-[200px] md:max-w-none" title={fileName}>{fileName}</h1>
                {transformedData && (
                    <p className="text-sm font-bold text-[rgba(0,0,0,0.5)] flex items-center gap-2">
                        <span className="text-[10px] md:text-xs bg-black text-white px-2 py-0.5 rounded-full whitespace-nowrap">Transformed</span>
                    </p>
                )}
            </div>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
            {/* Tools Group */}
            <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl border-2 border-black/10">
                <button 
                    onClick={() => setIsHistoryOpen(true)}
                    className="p-2 md:p-2.5 bg-white text-black border-2 border-black hover:bg-black hover:text-white rounded-lg shadow-neo-sm active:translate-y-[2px] active:shadow-none transition-all"
                    title="View History"
                >
                    <Clock className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => setIsStickersOpen(true)}
                    className="p-2 md:p-2.5 bg-white text-black border-2 border-black hover:bg-black hover:text-white rounded-lg shadow-neo-sm active:translate-y-[2px] active:shadow-none transition-all"
                    title="Add Stickers"
                >
                    <Sticker className="w-5 h-5" />
                </button>
            </div>

            {/* Presentation Group */}
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/5 rounded-xl border-2 border-primary/20">
                <button 
                    onClick={() => setIsPresentationModeOpen(true)}
                    className="p-2 bg-primary text-white border-2 border-black hover:bg-primary/90 rounded-lg shadow-neo-sm active:translate-y-[2px] active:shadow-none transition-all"
                    title="Presentation Mode"
                >
                    <Play className="w-5 h-5" />
                </button>
            </div>

            <div className="w-[2px] h-8 bg-black/10 mx-1 hidden md:block" />

            {/* Export & Actions Group */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleShareClick}
                    className="p-2.5 bg-white text-black border-2 border-black hover:bg-black hover:text-white rounded-xl shadow-neo-sm active:translate-y-[2px] transition-all"
                    title="Copy Share Link"
                >
                    <LinkIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={handleDownloadAll}
                    className="px-3 md:px-5 py-2.5 bg-white text-black border-2 border-black hover:translate-y-[-2px] rounded-xl shadow-neo font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all"
                >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">EXPORT PDF</span>
                </button>
                <button 
                    onClick={reset}
                    className="p-2.5 bg-destructive text-white border-2 border-black hover:translate-y-[-2px] rounded-xl shadow-neo-sm transition-all"
                    title="Reset Workspace"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
      </header>
      
      {/* Insights Grid */}
      <div className="w-full space-y-6">

           <InsightsPanel data={activeData} />
      </div>

      {transformedData && (
        <div className="flex justify-center">
            <button 
            onClick={() => setTransformedData(null)}
            className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold shadow-neo hover:bg-destructive transition-colors"
            >
            Reset to Original Data ({data.length} rows)
            </button>
        </div>
      )}

      {/* Main Content */}
      <main className="space-y-6">
        <div className="flex items-center justify-center">
            <div className="bg-white p-1.5 rounded-xl flex gap-2 border-2 border-black shadow-neo-sm">
                <button
                    onClick={() => setActiveTab("table")}
                    className={cn(
                        "px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 border-2",
                        activeTab === "table" 
                            ? "bg-primary text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                            : "text-[rgba(0,0,0,0.6)] border-transparent hover:bg-[rgba(0,0,0,0.05)]"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <TableIcon className="w-4 h-4" />
                        Data Table
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab("charts")}
                    className={cn(
                        "px-6 py-2 rounded-lg text-sm font-bold transition-all duration-200 border-2",
                        activeTab === "charts" 
                            ? "bg-primary text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                            : "text-[rgba(0,0,0,0.6)] border-transparent hover:bg-[rgba(0,0,0,0.05)]"
                    )}
                >
                     <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Visualizations
                    </div>
                </button>
            </div>
        </div>

        <div className="bg-white rounded-xl border-2 border-black shadow-neo overflow-hidden min-h-[500px] relative">
            {/* Sticker Layer */}
            <div className="absolute inset-0 pointer-events-none z-50">
                {annotations.map((ann) => (
                    <motion.div
                        key={ann.instanceId}
                        drag
                        dragMomentum={false}
                        className={cn(
                            "absolute pointer-events-auto p-4 border-4 border-black rounded-xl shadow-neo font-black uppercase tracking-tighter cursor-move select-none group",
                            ann.color
                        )}
                        style={{ 
                            left: ann.x, 
                            top: ann.y, 
                            rotate: ann.rotate 
                        }}
                    >
                        {ann.content}
                        <button 
                            onClick={() => removeSticker(ann.instanceId)}
                            className="absolute -top-3 -right-3 w-6 h-6 bg-destructive text-white border-2 border-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </motion.div>
                ))}
            </div>

            <div className={cn("p-6 transition-all duration-300", activeTab === "table" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none")}>
                <DataTable data={activeData} onDataUpdate={transformedData ? setTransformedData : setData} />
            </div>
            
             <div className={cn("p-6 transition-all duration-300", activeTab === "charts" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none")}>
                <ChartGenerator data={activeData} />
            </div>
        </div>
      </main>

      <DataTransform data={data} onDataTransformed={setTransformedData} />
      <ChatInterface data={activeData} />

      <AnimatePresence>
        {isShareOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white w-full max-w-md p-6 rounded-2xl border-2 border-black shadow-neo-lg relative overflow-hidden"
                >
                    <button 
                        onClick={() => setIsShareOpen(false)}
                        className="absolute top-4 right-4 p-1 hover:bg-[rgba(0,0,0,0.1)] rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="space-y-6 text-center">
                        <div>
                            <h2 className="text-2xl font-black text-black">Share Analysis</h2>
                            <p className="text-sm font-medium text-[rgba(0,0,0,0.5)]">Scan or copy to view this analysis anywhere.</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border-2 border-black inline-block shadow-neo-sm">
                            <QRCode value={shareUrl} size={180} />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleCopyLink}
                                className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-black font-bold hover:bg-[rgba(0,0,0,0.05)] transition-colors"
                            >
                                {copied ? <Check className="w-4 h-4 text-[#22c55e]" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Copied!" : "Copy Link"}
                            </button>
                            <a
                                href={`mailto:?subject=Vizly Analysis: ${fileName}&body=Check out this data analysis: ${shareUrl}`}
                                className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-black bg-black text-white font-bold hover:bg-primary hover:border-black transition-colors"
                            >
                                <Mail className="w-4 h-4" />
                                Email
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isExporting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xl px-4"
          >
            <div className="p-8 bg-white border-4 border-black shadow-neo-lg rounded-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4">
                <div className="relative">
                    <RefreshCcw className="w-16 h-16 text-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 bg-black rounded-full" />
                    </div>
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-black tracking-tight">Generating PDF</h2>
                    <p className="text-lg font-bold text-[rgba(0,0,0,0.6)] leading-tight">
                        We're capturing all charts and data for your report.
                    </p>
                </div>
                <div className="w-full h-2 bg-[rgba(0,0,0,0.1)] rounded-full overflow-hidden border-2 border-black">
                    <motion.div 
                        initial={{ width: "0%" }}
                        animate={{ width: "90%" }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="h-full bg-primary"
                    />
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div 
        id="full-report-capture" 
        style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '1200px', 
            height: 'auto', 
            zIndex: -10, 
            backgroundColor: 'white', 
            padding: '40px',
            visibility: isExporting ? 'visible' : 'hidden',
            display: isExporting ? 'block' : 'none', // Added display:none to prevent Recharts measurement attempts
            pointerEvents: 'none',
            opacity: isExporting ? 1 : 0
        }}
        className="space-y-8"
      >
        {isExporting && (
            <>
                <div className="flex items-center justify-between pb-8 border-b-2 border-[rgba(0,0,0,0.1)]">
                    <h1 className="text-4xl font-black">{fileName} - Analysis Report</h1>
                    <div className="flex items-center gap-2 text-[rgba(0,0,0,0.5)] font-bold">
                        <span className="p-2 bg-primary text-white rounded-lg border-2 border-black">
                            <LayoutDashboard className="w-6 h-6" />
                        </span>
                        BrutViz Report
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><ArrowUpDown className="w-5 h-5" /> Key Insights</h2>
                    <InsightsPanel data={activeData} />
                </div>

                <div className="space-y-4 pt-8 border-t-2 border-[rgba(0,0,0,0.1)]">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Visualizations</h2>
                    
                    <div className="grid gap-12">
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-black border-l-4 border-primary pl-3">Bar Chart View</h3>
                            <ChartGenerator data={activeData} isStatic={true} forcedChartType="bar" />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-black border-l-4 border-[#AF52DE] pl-3">Line Chart View</h3>
                            <ChartGenerator data={activeData} isStatic={true} forcedChartType="line" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-black border-l-4 border-[#007AFF] pl-3">Area Chart View</h3>
                            <ChartGenerator data={activeData} isStatic={true} forcedChartType="area" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-black border-l-4 border-[#FF2D55] pl-3">Distribution (Pie)</h3>
                            <ChartGenerator data={activeData} isStatic={true} forcedChartType="pie" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-8 border-t-2 border-[rgba(0,0,0,0.1)]">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><TableIcon className="w-5 h-5" /> Data Table</h2>
                    <div className="border-2 border-black rounded-xl overflow-hidden p-4">
                        <DataTable data={activeData} showAll={true} />
                    </div>
                </div>
            </>
        )}
      </div>

       <HistoryShelf
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelect={handleHistorySelect}
        currentDataId={currentDataId}
      />

      <StickerPalette
        isOpen={isStickersOpen}
        onClose={() => setIsStickersOpen(false)}
        onAddSticker={handleAddSticker}
      />

      <PresentationMode
        data={activeData}
        isOpen={isPresentationModeOpen}
        onClose={() => setIsPresentationModeOpen(false)}
      />
    </div>
  );
}
