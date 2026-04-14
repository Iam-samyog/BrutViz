"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LZString from "lz-string";
import { jsPDF } from "jspdf";
import { BarChart3, Table as TableIcon, RefreshCcw, Download, Image as ImageIcon, ImageDown, Trash2, X, Upload, FileText, AlertCircle, ChevronLeft, ChevronRight, Search, ArrowUpDown, Link as LinkIcon, Mail, Copy, Check, LayoutDashboard, Clock, Sticker, Play, Lightbulb, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HistoryShelf } from "@/components/HistoryShelf";
import { StickerPalette } from "@/components/StickerPalette";
import { PresentationMode } from "@/components/PresentationMode";
import { get, set, del } from "idb-keyval";
import { toJpeg } from "html-to-image";
import Papa from "papaparse";
import QRCode from "react-qr-code";
import DataInput from "@/components/DataInput";
import ManualTableCreator from "@/components/ManualTableCreator";
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
  const [chartConfig, setChartConfig] = useState<{type?: string, xAxis?: string, yAxis?: string, showForecast?: boolean}>({
      showForecast: false
  });
  
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isStickersOpen, setIsStickersOpen] = useState(false);
  const [isPresentationModeOpen, setIsPresentationModeOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [currentExportPage, setCurrentExportPage] = useState<{ type: 'cover' | 'analysis_1' | 'analysis_2', catKey?: string, numKey?: string } | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  const activeData = transformedData || data;

  // Check for shared data in URL on mount
  useEffect(() => {
    setIsClient(true);
    
    const loadData = async () => {
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

      try {
          const storedData: any[] | undefined = await get(STORAGE_KEY_DATA);
          const storedName: string | undefined = await get(STORAGE_KEY_NAME);
          
          if (storedData) {
              setData(storedData);
          } else {
              // ... fallback logic ...
          }

          if (storedName) {
              setFileName(storedName);
          } else {
              // ... fallback logic ...
          }
      } catch (e) {
          console.error("Failed to load stored data", e);
      } finally {
          setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save to IndexedDB when data changes
  useEffect(() => {
    if (!loading) {
        if (data.length > 0) {
            set(STORAGE_KEY_DATA, data).catch(e => console.error("IDB Save Error:", e));
            if (fileName) set(STORAGE_KEY_NAME, fileName).catch(e => console.error("IDB Name Save Error:", e));
        }
    }
  }, [data, fileName, loading]);

  const saveToHistory = async (parsedData: any[], name: string) => {
    const newId = Date.now().toString();
    const newItem = {
        id: newId,
        fileName: name,
        timestamp: Date.now(),
        rowCount: parsedData.length,
        data: parsedData,
        chartConfig: { ...chartConfig }
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
    setChartConfig(item.chartConfig || {});
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

  const reset = async () => {
      setData([]);
      setFileName("");
      setCurrentDataId("");
      await del(STORAGE_KEY_DATA);
      await del(STORAGE_KEY_NAME);
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
      // Optimize payload by stripping unnecessary whitespace from data strings
      const payload = JSON.stringify({ 
          data: data.map(row => {
              const newRow = { ...row };
              Object.keys(newRow).forEach(key => {
                  if (typeof newRow[key] === 'string') {
                      newRow[key] = newRow[key].trim();
                  }
              });
              return newRow;
          }), 
          fileName: fileName.trim() 
      });
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
      setExportStatus("Initializing export...");
      
      try {
          // 1. Calculate all pages needed
          const pagesToExport: Array<{ type: 'cover' | 'analysis_1' | 'analysis_2', catKey?: string, numKey?: string }> = [
              { type: 'cover' }
          ];

          if (activeData && activeData.length > 0) {
              const headers = Object.keys(activeData[0]);
              const numericKeys = headers.filter(key => 
                  activeData.some(row => typeof row[key] === 'number' || (!isNaN(Number(row[key])) && row[key] !== ''))
              );
              const categoricalKeys = headers.filter(key => !numericKeys.includes(key));
              
              // SMART LIMIT: Only export the top 5 categorical and top 5 numeric keys to prevent overflow/slowness
              const limitedCatKeys = categoricalKeys.slice(0, 5);
              const limitedNumKeys = numericKeys.slice(0, 5);
              const xKeys = limitedCatKeys.length > 0 ? limitedCatKeys : limitedNumKeys;

              xKeys.forEach(catKey => {
                  limitedNumKeys.forEach(numKey => {
                      if (catKey !== numKey || limitedCatKeys.length === 0) {
                           // PAGE A: Bar + Line
                           pagesToExport.push({ type: 'analysis_1', catKey, numKey });
                           // PAGE B: Pie + Stats
                           pagesToExport.push({ type: 'analysis_2', catKey, numKey });
                      }
                  });
              });

              // HARD LIMIT: Maximum 25 pages total for stability
              if (pagesToExport.length > 25) {
                console.log("Limiting export to first 25 pages for performance.");
                pagesToExport.splice(25);
              }
          }

          console.log(`Planned ${pagesToExport.length} pages for export.`);
          const capturedImages: string[] = [];
          
          const textEncoder = new TextEncoder();
          const calculateSize = (base64String: string) => {
             // Rough estimate
             return base64String.length * 0.75;
          };
          let totalSize = 0;

          // 2. Sequential Capture
          for (let i = 0; i < pagesToExport.length; i++) {
              const pageConfig = pagesToExport[i];
              setExportStatus(`Capturing section ${i + 1} of ${pagesToExport.length}...`);
              
              // Trigger Render
              setCurrentExportPage(pageConfig);
              
              // Wait for DOM to stabilize (Chart rendering - no animations so just render tick)
              await new Promise(r => setTimeout(r, 100)); // 100ms is enough for layout reflow

              const element = document.getElementById("single-export-page");
              if (!element) throw new Error("Export page container missing");

              const dataUrl = await toJpeg(element, { 
                  quality: 0.85, // Balanced quality
                  backgroundColor: '#ffffff',
                  pixelRatio: 2, // 2x is enough for sharp A4 prints, 3x is overkill and slow
                  cacheBust: true,
              });
              
              capturedImages.push(dataUrl);
              totalSize += calculateSize(dataUrl);
              
              // Safety break if we exceed ~200MB in images (browser limit safety)
              if (totalSize > 200 * 1024 * 1024) {
                  console.warn("PDF size limit approaching, stopping capture early.");
                  break;
              }
          }

          // 3. Sequential Assembly
          setExportStatus("Assembling PDF...");
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pageWidth = pdf.internal.pageSize.getWidth();   // 210mm
          const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

          // Page 1: Cover (Full Page)
          if (capturedImages.length > 0) {
               const coverImg = capturedImages[0];
               const imgProps = pdf.getImageProperties(coverImg);
               const pdfImgHeight = (imgProps.height * pageWidth) / imgProps.width;
               pdf.addImage(coverImg, 'JPEG', 0, 0, pageWidth, pdfImgHeight);
          }

          // Pages 2+: Analysis (Hero Layout - 1 Image Per Page)
          // Each captured image now represents a full "Hero" page
          const analysisImages = capturedImages.slice(1);
          for (let i = 0; i < analysisImages.length; i++) {
              pdf.addPage();
              const img = analysisImages[i];
              const imgProps = pdf.getImageProperties(img);
              const pdfImgHeight = (imgProps.height * pageWidth) / imgProps.width;
              pdf.addImage(img, 'JPEG', 0, 0, pageWidth, pdfImgHeight);
          }

          pdf.save(`vizly-analysis-${Date.now()}.pdf`);

      } catch (err: any) {
          console.error("Export failed:", err);
          alert(`Failed to generate report: ${err.message || err}`);
      } finally {
          setIsExporting(false);
          setExportStatus("");
          setCurrentExportPage(null);
      }
  };

  if (!isClient) return null; // Avoid hydration mismatch

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (data.length === 0) {
    // Manual Table Creation Mode
    if (isManualMode) {
      return (
        <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 p-4">
          <ManualTableCreator 
            onConfirm={(manualData, manualFileName) => {
              setData(manualData);
              setFileName(manualFileName);
              saveToHistory(manualData, manualFileName);
              setIsManualMode(false);
            }}
            onCancel={() => setIsManualMode(false)}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
        {/* Navbar */}
        <Navbar onHistoryClick={() => setIsHistoryOpen(true)} />

        <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Grid Accent */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, black 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
            />

            {/* Dynamic Animated Background (70+ Balls with Popping Entry) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                {Array.from({ length: 70 }).map((_, i) => {
                    const colors = ['bg-primary', 'bg-[#FF2D55]', 'bg-[#AF52DE]', 'bg-[#22c55e]', 'bg-[#FFCC00]', 'bg-[#FF9500]'];
                    const size = Math.random() * 60 + 20;
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const top = Math.random() * 100 + '%';
                    const left = Math.random() * 100 + '%';
                    const delay = Math.random() * 2;
                    const duration = Math.random() * 6 + 4;

                    return (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                                scale: [0, 1.2, 1, 1.1, 1],
                                opacity: [0, 0.5, 0.2, 0.4, 0.15],
                                y: [0, Math.random() * -50 - 20, 0],
                                x: [0, Math.random() * 20 - 10, 0]
                            }}
                            transition={{
                                scale: { duration: 0.8, delay: delay },
                                opacity: { duration: 0.8, delay: delay },
                                y: { duration: duration, repeat: Infinity, ease: "easeInOut", delay: delay + 0.8 },
                                x: { duration: duration, repeat: Infinity, ease: "easeInOut", delay: delay + 0.8 }
                            }}
                            className={`absolute rounded-full border-2 border-black/20 shadow-lg ${color}`}
                            style={{ 
                                top, 
                                left, 
                                width: size, 
                                height: size 
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
                        The world's one of the <span className="text-black underline decoration-4 decoration-primary underline-offset-4"> fastest</span> Data analyzer. <br/> 
                        No signups. No hazzle. Just data.
                    </p>
                </div>
                
                <div className="relative">
                    <div className="absolute -inset-4 bg-primary/5 rounded-[2rem] blur-3xl -z-10" />
                    <DataInput onDataParsed={handleDataParsed} />
                    
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
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

                        <button 
                            onClick={() => setIsManualMode(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-black text-white border-2 border-black rounded-xl font-bold hover:shadow-neo hover:translate-y-[-2px] transition-all"
                        >
                            <TableIcon className="w-4 h-4" />
                            Build Manual Table
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
                            { step: "02", title: "Automated Insights", desc: "OriData AI immediately scans your data to find trends, outliers, and patterns.", icon: <Search className="w-6 h-6 text-white"/>, color: "bg-[#AF52DE]" },
                            { step: "03", title: "Custom Charts", desc: "Generate Bar, Line, Pie, and Area charts with zero effort.", icon: <BarChart3 className="w-6 h-6 text-white"/>, color: "bg-[#FF2D55]" },
                            { step: "04", title: "Instant Export", desc: "Download high-quality PDF reports  for your meetings.", icon: <Download className="w-6 h-6 text-white"/>, color: "bg-[#007AFF]" }
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
    <div className="min-h-screen p-4 sm:p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 bg-background relative overflow-hidden" id="dashboard-container">
      {/* Background Balls for Cohesion */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                {Array.from({ length: 50 }).map((_, i) => {
                    const colors = ['bg-primary', 'bg-[#FF2D55]', 'bg-[#AF52DE]', 'bg-[#22c55e]', 'bg-[#FFCC00]', 'bg-[#FF9500]'];
                    const size = Math.random() * 50 + 15;
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const top = Math.random() * 100 + '%';
                    const left = Math.random() * 100 + '%';
                    const delay = Math.random() * 2;
                    const duration = Math.random() * 10 + 5;

                    return (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ 
                                scale: [0, 1.1, 1],
                                opacity: [0, 0.25, 0.08],
                                y: [0, Math.random() * -100 - 50, 0],
                            }}
                            transition={{
                                scale: { duration: 1, delay: delay },
                                opacity: { duration: 1, delay: delay },
                                y: { duration: duration, repeat: Infinity, ease: "linear", delay: delay + 1 }
                            }}
                            className={`absolute rounded-full border border-black/10 shadow-sm ${color}`}
                            style={{ 
                                top, 
                                left, 
                                width: size, 
                                height: size 
                            }}
                        />
                    );
                })}
      </div>

      <div className="relative z-10 space-y-6 md:space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 p-4 md:p-6 bg-black border-4 border-black rounded-[2rem] shadow-neo">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-white border-2 border-white rounded-lg shadow-neo-sm">
                <LayoutDashboard className="w-6 h-6" />
            </div>
            <div className="min-w-0">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white truncate max-w-[200px] md:max-w-none" title={fileName}>{fileName}</h1>
                {transformedData && (
                    <p className="text-sm font-bold text-white/50 flex items-center gap-2">
                        <span className="text-[10px] md:text-xs bg-white text-black px-2 py-0.5 rounded-full whitespace-nowrap">Transformed</span>
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
                    disabled={isExporting}
                    className="px-3 md:px-5 py-2.5 bg-white text-black border-2 border-black hover:translate-y-[-2px] rounded-xl shadow-neo font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-wait"
                >
                    {isExporting ? (
                         <span className="animate-pulse">{exportStatus}</span>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">EXPORT PDF</span>
                        </>
                    )}
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
      
      {/* Sidebar Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10">
        
        {/* Sidebar: Key Insights */}
        <aside className="lg:col-span-1 space-y-6">
            <div className="flex items-center gap-3 p-4 bg-white border-4 border-black rounded-2xl shadow-neo-sm">
                <div className="p-2 bg-primary text-white border-2 border-black rounded-lg">
                    <Lightbulb className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">Key Insights</h2>
            </div>
            <InsightsPanel data={activeData} orientation="vertical" />
        </aside>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
            {transformedData && (
                <div className="flex justify-center mb-6">
                    <button 
                    onClick={() => setTransformedData(null)}
                    className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold shadow-neo hover:bg-destructive transition-colors"
                    >
                    Reset to Original Data ({data.length} rows)
                    </button>
                </div>
            )}

            <main className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex bg-white items-center rounded-3xl border-4 border-black shadow-neo-sm overflow-hidden p-2 gap-4">
                    <button
                        onClick={() => setActiveTab("table")}
                        className={cn(
                            "relative px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 z-10",
                            activeTab === "table" ? "text-white" : "text-black/40 hover:text-black"
                        )}
                    >
                        {activeTab === "table" && (
                            <motion.div 
                                layoutId="activeTab"
                                className="absolute inset-0 bg-primary border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-[-1]"
                            />
                        )}
                        <div className="flex items-center gap-2">
                            <TableIcon className="w-4 h-4" />
                            Data Table
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("charts")}
                        className={cn(
                            "relative px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 z-10",
                            activeTab === "charts" ? "text-white" : "text-black/40 hover:text-black"
                        )}
                    >
                        {activeTab === "charts" && (
                            <motion.div 
                                layoutId="activeTab"
                                className="absolute inset-0 bg-primary border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-[-1]"
                            />
                        )}
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Visualizations
                        </div>
                    </button>

                    {activeTab === 'charts' && (
                        <div className="flex items-center ml-2 pr-4">
                            <ChartGenerator 
                                data={activeData}
                                forcedChartType={chartConfig.type as any || "bar"}
                                isStatic={true}
                                hideConfig={false}
                                hideChart={true}
                                hideTypeSelector={true}
                                onConfigChange={(newConfig) => {
                                    setChartConfig(prev => ({
                                        ...prev,
                                        ...newConfig
                                    }));
                                }}
                                forcedXAxis={chartConfig.xAxis}
                                forcedYAxis={chartConfig.yAxis}
                                forcedShowForecast={chartConfig.showForecast}
                            />
                        </div>
                    )}
                </div>
                </div>

                <div className="relative min-h-[600px]">
                    {/* Sticker Layer (remains same) */}
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

                    <div className={cn("transition-all duration-300", activeTab === "table" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none")}>
                        <DataTable key={currentDataId || 'new'} data={activeData} onDataUpdate={transformedData ? setTransformedData : setData} />
                    </div>
                    
                    <div className={cn("transition-all duration-300", activeTab === "charts" ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none")}>
                        {/* THE REFINED VISUALIZATION GRID */}
                        <div className="space-y-6">

                            {/* BAR CHART — Indigo tint */}
                            <div className="w-full bg-indigo-50 border-4 border-black rounded-3xl shadow-neo-sm overflow-hidden h-[500px]">
                                <ChartGenerator 
                                    data={activeData} 
                                    forcedChartType="bar"
                                    hideConfig={true}
                                    fullHeight={true}
                                    forcedXAxis={chartConfig.xAxis}
                                    forcedYAxis={chartConfig.yAxis}
                                    forcedShowForecast={chartConfig.showForecast}
                                    colorPalette={['#3388ff', '#a855f7', '#f6d743', '#4ade80', '#ff4911']}
                                />
                            </div>

                            {/* SECOND ROW: Pie + Pentagon (2 columns) */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Pie Chart — Rose tint */}
                                <div className="bg-rose-50 border-4 border-black rounded-3xl shadow-neo-sm overflow-hidden h-[500px]">
                                    <ChartGenerator 
                                        data={activeData} 
                                        forcedChartType="pie"
                                        hideConfig={true}
                                        fullHeight={true}
                                        forcedXAxis={chartConfig.xAxis}
                                        forcedYAxis={chartConfig.yAxis}
                                        forcedShowForecast={chartConfig.showForecast}
                                        colorPalette={['#ff9bc5', '#3388ff', '#f6d743', '#ff4911', '#4ade80', '#a855f7', '#ffffff']}
                                    />
                                </div>

                                {/* Pentagon Radar Chart — Violet tint */}
                                <div className="bg-violet-50 border-4 border-black rounded-3xl shadow-neo-sm overflow-hidden h-[500px] flex flex-col">
                                    <div className="px-5 pt-4 pb-2 border-b-2 border-black/5 flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Multi-Axis</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-black">Pentagon</span>
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <ChartGenerator 
                                            data={activeData} 
                                            forcedChartType="radar"
                                            hideConfig={true}
                                            fullHeight={true}
                                            forcedXAxis={chartConfig.xAxis}
                                            forcedYAxis={chartConfig.yAxis}
                                            colorPalette={['#a855f7', '#ff4911', '#3388ff', '#f6d743', '#4ade80']}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* AI FORECAST ROW — Full-width Line + Area */}
                            <div className="space-y-6">
                                {/* Line chart — Sky blue tint */}
                                <div className="w-full bg-sky-50 border-4 border-black rounded-3xl shadow-neo-sm overflow-hidden h-[450px]">
                                    <ChartGenerator 
                                        data={activeData} 
                                        forcedChartType="line"
                                        hideConfig={true}
                                        fullHeight={true}
                                        forcedXAxis={chartConfig.xAxis}
                                        forcedYAxis={chartConfig.yAxis}
                                        forcedShowForecast={chartConfig.showForecast}
                                        colorPalette={['#a855f7', '#3388ff', '#ff4911', '#4ade80', '#f6d743']}
                                    />
                                </div>
                                {/* Area chart — Emerald tint */}
                                <div className="w-full bg-emerald-50 border-4 border-black rounded-3xl shadow-neo-sm overflow-hidden h-[450px]">
                                    <ChartGenerator 
                                        data={activeData} 
                                        forcedChartType="area"
                                        hideConfig={true}
                                        fullHeight={true}
                                        forcedXAxis={chartConfig.xAxis}
                                        forcedYAxis={chartConfig.yAxis}
                                        forcedShowForecast={chartConfig.showForecast}
                                        colorPalette={['#f6d743', '#ff4911', '#3388ff', '#a855f7', '#4ade80']}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
      </div>

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

                        <div className="bg-white p-4 rounded-xl border-2 border-black inline-block shadow-neo-sm relative group">
                            {shareUrl.length < 3300 ? (
                                <QRCode value={shareUrl} size={180} />
                            ) : (
                                <div className="w-[180px] h-[180px] flex flex-col items-center justify-center gap-3 p-4 bg-gray-50 border-2 border-dashed border-black/20 rounded-lg">
                                    <AlertCircle className="w-8 h-8 text-black/40" />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-tight text-black/60 leading-tight">
                                            Data too large for QR
                                        </p>
                                        <button 
                                            onClick={handleCopyLink}
                                            className="text-[9px] font-black underline decoration-2 decoration-primary underline-offset-2 hover:text-primary transition-colors"
                                        >
                                            USE "COPY LINK" INSTEAD
                                        </button>
                                    </div>
                                </div>
                            )}
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
            width: '1200px', // Fixed A4-ratio width
            zIndex: -10, 
            visibility: isExporting ? 'visible' : 'hidden',
            pointerEvents: 'none',
            opacity: isExporting ? 1 : 0
        }}
      >
        {isExporting && currentExportPage && (
            <div id="single-export-page" className="bg-white border-b-8 border-black">
                {currentExportPage.type === 'cover' ? (
                    // --- COVER PAGE RENDER (Full Height allowed) ---
                    <div className="p-12 space-y-8 min-h-[1600px]">
                        <div className="flex items-center justify-between pb-8 border-b-4 border-black">
                            <div className="space-y-2">
                                <h1 className="text-5xl font-black tracking-tight uppercase">{fileName}</h1>
                                <p className="text-xl font-bold text-gray-500">{new Date().toLocaleDateString()} | Automated Analysis</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-4 bg-primary text-white rounded-xl border-4 border-black shadow-neo">
                                    <LayoutDashboard className="w-10 h-10" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black flex items-center gap-3 bg-black text-white p-4 rounded-xl shadow-neo-sm inline-block">
                                <ArrowUpDown className="w-6 h-6" /> Key AI Insights
                            </h2>
                            {(() => {
                                const insights = require('@/lib/insights').generateInsights(activeData);
                                return (
                                    <div className="grid grid-cols-2 gap-4">
                                        {insights.map((insight: any, idx: number) => (
                                            <div key={idx} className="p-5 rounded-xl border-2 border-black bg-white shadow-neo-sm">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg border-2 border-black bg-primary/10">
                                                        {insight.type === 'correlation' && <ArrowUpDown className="w-4 h-4" />}
                                                        {insight.type === 'outlier' && <AlertCircle className="w-4 h-4" />}
                                                        {insight.type === 'summary' && <FileText className="w-4 h-4" />}
                                                        {insight.type === 'distribution' && <BarChart3 className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-black text-xs uppercase tracking-wider text-gray-500">
                                                                {insight.title}
                                                            </h4>
                                                            {insight.score >= 7 && (
                                                                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary text-white">
                                                                    KEY
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm font-bold text-black leading-snug">
                                                            {insight.description.replace(/\*\*/g, '')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="mt-12 p-8 bg-blue-50 border-4 border-blue-500 rounded-2xl border-dashed text-center space-y-2">
                            <p className="text-2xl font-black text-blue-600">Report Contents</p>
                            <p className="text-lg font-bold text-blue-400">Comprehensive Visual Analysis on following pages</p>
                        </div>
                    </div>
                ) : currentExportPage.type === 'analysis_1' ? (
                    // --- ANALYSIS PAGE 1: COMPARISON & TRENDS (Bar + Line) ---
                    <div className="p-12 space-y-12 w-full min-h-[1600px] flex flex-col"> 
                         <div className="flex items-center justify-between border-b-4 border-black pb-6">
                            <div className="flex items-baseline gap-4">
                                <h3 className="text-4xl font-black text-black uppercase tracking-tight bg-primary/20 px-4 py-2 rounded-xl">
                                    {currentExportPage.catKey}
                                </h3>
                                <span className="text-gray-400 font-black italic text-2xl">vs</span>
                                <h3 className="text-4xl font-black text-black uppercase tracking-tight bg-yellow-400/20 px-4 py-2 rounded-xl">
                                    {currentExportPage.numKey}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-black text-white rounded-full font-bold text-sm">PART 1</span>
                                <BarChart3 className="w-12 h-12 text-black/20" />
                            </div>
                        </div>

                        {/* CHART 1: DIRECT COMPARISON (TOP HALF) */}
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg font-black text-sm">1</span>
                                <p className="text-xl font-black uppercase tracking-widest text-black/60">Direct Comparison</p>
                            </div>
                            <div className="h-[550px] border-4 border-black rounded-3xl overflow-hidden bg-white shadow-neo-lg">
                                <ChartGenerator 
                                    data={activeData} 
                                    isStatic={true} 
                                    forcedChartType="bar" 
                                    forcedXAxis={currentExportPage.catKey} 
                                    forcedYAxis={currentExportPage.numKey} 
                                    hideConfig={true} 
                                />
                            </div>
                        </div>

                        {/* CHART 2: TREND ANALYSIS (BOTTOM HALF) */}
                        <div className="space-y-4 flex-1 pt-8 border-t-4 border-dashed border-gray-200">
                             <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg font-black text-sm">2</span>
                                <p className="text-xl font-black uppercase tracking-widest text-black/60">Trend Analysis</p>
                            </div>
                            <div className="h-[550px] border-4 border-black rounded-3xl overflow-hidden bg-white shadow-neo-lg">
                                <ChartGenerator 
                                    data={activeData} 
                                    isStatic={true} 
                                    forcedChartType="line" 
                                    forcedXAxis={currentExportPage.catKey} 
                                    forcedYAxis={currentExportPage.numKey} 
                                    hideConfig={true} 
                                />
                            </div>
                        </div>

                        <div className="pt-8 text-center text-gray-300">
                            <p className="text-sm font-black uppercase tracking-[0.5em]">Vizly Analytics • Page 1/2</p>
                        </div>
                    </div>
                ) : (
                    // --- ANALYSIS PAGE 2: DISTRIBUTION & STATS (Pie + Summary) ---
                    <div className="p-12 space-y-12 w-full min-h-[1600px] flex flex-col"> 
                         <div className="flex items-center justify-between border-b-4 border-black pb-6">
                            <div className="flex items-baseline gap-4">
                                <h3 className="text-4xl font-black text-black uppercase tracking-tight bg-primary/20 px-4 py-2 rounded-xl">
                                    {currentExportPage.catKey}
                                </h3>
                                <span className="text-gray-400 font-black italic text-2xl">vs</span>
                                <h3 className="text-4xl font-black text-black uppercase tracking-tight bg-yellow-400/20 px-4 py-2 rounded-xl">
                                    {currentExportPage.numKey}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1 bg-black text-white rounded-full font-bold text-sm">PART 2</span>
                                <BarChart3 className="w-12 h-12 text-black/20" />
                            </div>
                        </div>

                        {/* CHART 3: DISTRIBUTION (TOP HALF) */}
                        <div className="space-y-4 flex-1">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg font-black text-sm">3</span>
                                <p className="text-xl font-black uppercase tracking-widest text-black/60">Distribution Share</p>
                            </div>
                            <div className="h-[600px] border-4 border-black rounded-3xl overflow-hidden bg-white shadow-neo-lg">
                                <ChartGenerator 
                                    data={activeData} 
                                    isStatic={true} 
                                    forcedChartType="pie" 
                                    forcedXAxis={currentExportPage.catKey} 
                                    forcedYAxis={currentExportPage.numKey} 
                                    hideConfig={true} 
                                />
                            </div>
                        </div>

                         {/* SUMMARY CARD (BOTTOM HALF) */}
                        <div className="space-y-4 flex-1 pt-8 border-t-4 border-dashed border-gray-200">
                             <div className="flex items-center gap-3">
                                <span className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-lg font-black text-sm">4</span>
                                <p className="text-xl font-black uppercase tracking-widest text-black/60">Statistical Summary</p>
                            </div>
                            
                            <div className="h-[500px] p-8 border-4 border-black rounded-3xl bg-gray-50 flex flex-col justify-center space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-6 bg-white rounded-2xl border-2 border-black shadow-sm">
                                        <p className="text-gray-500 font-bold uppercase text-sm mb-2">Category</p>
                                        <p className="text-3xl font-black truncate">{currentExportPage.catKey}</p>
                                    </div>
                                    <div className="p-6 bg-white rounded-2xl border-2 border-black shadow-sm">
                                        <p className="text-gray-500 font-bold uppercase text-sm mb-2">Metric</p>
                                        <p className="text-3xl font-black truncate">{currentExportPage.numKey}</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-blue-50 rounded-2xl border-2 border-blue-200 border-dashed text-center">
                                    <p className="text-2xl font-black text-blue-400">Detailed Breakdown</p>
                                    <p className="text-gray-500 mt-2">Refer to the Distribution Chart above for percentage splits.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 text-center text-gray-300">
                             <p className="text-sm font-black uppercase tracking-[0.5em]">Vizly Analytics • Page 2/2</p>
                        </div>
                    </div>
                )}
            </div>
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
        key={currentDataId}
        data={activeData} 
        isOpen={isPresentationModeOpen} 
        onClose={() => setIsPresentationModeOpen(false)} 
      />
      </div>

      {/* Decorative Blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ delay: 0.2, duration: 2, ease: "easeOut" }}
          className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ delay: 0.4, duration: 2, ease: "easeOut" }}
          className="absolute -top-20 -right-20 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-3xl"
        />
      </div>
    </div>
  );
}
