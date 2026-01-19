"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, BarChart3 } from "lucide-react";

interface ChartGeneratorProps {
  data: any[];
  isStatic?: boolean;
  forcedChartType?: "bar" | "line" | "area" | "pie";
  forcedXAxis?: string;
  forcedYAxis?: string;
  hideConfig?: boolean;
  fullHeight?: boolean;
}

const COLORS = [
  "#007AFF", // Apple Blue
  "#AF52DE", // Apple Purple
  "#FF2D55", // Apple Pink
  "#5856D6", // Apple Indigo
  "#5AC8FA", // Apple Teal
  "#34C759", // Apple Green
  "#FF9500", // Apple Orange
];

export default function ChartGenerator({ 
  data, 
  isStatic = false, 
  forcedChartType, 
  forcedXAxis,
  forcedYAxis,
  hideConfig = false, 
  fullHeight = false 
}: ChartGeneratorProps) {
  const [chartTypeState, setChartType] = useState<"bar" | "line" | "area" | "pie">("bar");
  const chartType = forcedChartType || chartTypeState; // Override if forced

  const [xAxisKeyOverride, setXAxisKey] = useState<string>("");
  const [yAxisKeysOverride, setYAxisKeys] = useState<string[]>([]);

  const xAxisKey = forcedXAxis || xAxisKeyOverride;
  const yAxisKeys = forcedYAxis ? [forcedYAxis] : yAxisKeysOverride;

  // Analyze data to find potential axes
  const { numericKeys, categoricalKeys } = useMemo(() => {
    if (!data.length) return { numericKeys: [], categoricalKeys: [] };
    const firstRow = data[0];
    const nKeys: string[] = [];
    const cKeys: string[] = [];

    Object.keys(firstRow).forEach((key) => {
      const val = firstRow[key];
      // simplified check
      if (typeof val === "number" || (!isNaN(Number(val)) && val !== "")) {
        nKeys.push(key);
      } else {
        cKeys.push(key);
      }
    });
    return { numericKeys: nKeys, categoricalKeys: cKeys };
  }, [data]);

  // Auto-select defaults if not set
  useMemo(() => {
    // Prefer categorical for X, numeric for Y
    if (!xAxisKey && categoricalKeys.length > 0) {
      setXAxisKey(categoricalKeys[0]);
    } else if (!xAxisKey && numericKeys.length > 0) {
       // fallback if no categorical
       setXAxisKey(numericKeys[0]);
    }

    if (yAxisKeys.length === 0 && numericKeys.length > 0) {
        // Pick all numeric keys that aren't the X axis? Or just the first one?
        // Let's pick the first one not equal to X
        const target = numericKeys.find(k => k !== xAxisKey) || numericKeys[0];
        if (target) setYAxisKeys([target]);
    }
  }, [categoricalKeys, numericKeys, xAxisKey, yAxisKeys]);

  if (numericKeys.length === 0) {
    return (
      <div className="p-8 border rounded-xl border-dashed flex flex-col items-center justify-center text-muted-foreground gap-2">
        <AlertCircle className="w-6 h-6" />
        <p>No numeric data found to chart.</p>
      </div>
    );
  }

  // Ensure data is formatted for Recharts (numbers are actual numbers)
  const chartData = useMemo(() => {
      return data.map(row => {
          const newRow = { ...row };
          numericKeys.forEach(key => {
              newRow[key] = Number(newRow[key]);
          });
          return newRow;
      });
  }, [data, numericKeys]);

  const renderChart = () => {
    switch (chartType) {
      case "area":
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xAxisKey} style={{ fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
            <YAxis style={{ fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area type="monotone" dataKey={yAxisKeys[0]} stroke="#007AFF" fill="#007AFF" fillOpacity={0.2} isAnimationActive={!isStatic} />
          </AreaChart>
        );
      case "line":
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xAxisKey} style={{ fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
            <YAxis style={{ fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {yAxisKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={!isStatic} />
            ))}
          </LineChart>
        );
      case "pie":
        // Group data for Pie charts to avoid clutter
        const aggregatedData = (() => {
            if (chartData.length <= 8) return chartData;
            const sorted = [...chartData].sort((a, b) => (b[yAxisKeys[0]] || 0) - (a[yAxisKeys[0]] || 0));
            const top = sorted.slice(0, 8);
            const rest = sorted.slice(8);
            const otherValue = rest.reduce((sum, item) => sum + (Number(item[yAxisKeys[0]]) || 0), 0);
            
            return [
                ...top,
                { [xAxisKey]: "Others", [yAxisKeys[0]]: otherValue }
            ];
        })();

        return (
          <PieChart>
             <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '2px solid black', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', fontWeight: 'bold' }} 
             />
             <Legend verticalAlign="bottom" height={36} />
             <Pie
               data={aggregatedData}
               dataKey={yAxisKeys[0]}
               nameKey={xAxisKey}
               cx="50%"
               cy="50%"
               innerRadius={60}
               outerRadius={100}
               paddingAngle={2}
               fill="#8884d8"
               label={({ name, percent }) => (percent !== undefined && percent > 0.05) ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
               isAnimationActive={!isStatic}
             >
               {aggregatedData.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="black" strokeWidth={1} />
               ))}
             </Pie>
          </PieChart>
        );
      default: // Bar
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xAxisKey} style={{ fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
            <YAxis style={{ fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {yAxisKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} isAnimationActive={!isStatic} />
            ))}
          </BarChart>
        );
    }
  };

  return (
    <div className={cn("space-y-6", fullHeight && "h-full space-y-0 flex flex-col")}>
      {!hideConfig && (
        <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-black shadow-neo-sm space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary text-white border-2 border-black rounded-lg shadow-sm">
                  <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-black block">Chart Config</span>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Select your dimensions to analyze</span>
              </div>
            </div>
          </div>
        
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-black ml-1 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-black/10 flex items-center justify-center text-[8px]">📊</span>
                    Chart Type
                  </label>
                  <select
                  className="block w-full p-3 rounded-xl border-2 border-black bg-white focus:shadow-neo focus:border-primary outline-none transition-all text-sm cursor-pointer font-bold"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as any)}
                  >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie Chart</option>
                  </select>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-black text-black ml-1 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-primary/20 text-primary flex items-center justify-center text-[8px] font-black">X</span>
                    Dimension (Categories)
                  </label>
                  <select
                  className="block w-full p-3 rounded-xl border-2 border-black bg-white focus:shadow-neo focus:border-primary outline-none transition-all text-sm cursor-pointer font-bold"
                  value={xAxisKey}
                  onChange={(e) => setXAxisKey(e.target.value)}
                  >
                  {categoricalKeys.concat(numericKeys).map(k => (
                      <option key={k} value={k}>{k}</option>
                  ))}
                  </select>
                  <p className="text-[9px] font-bold text-black/30 ml-1">Groups your data (e.g., Date, Region)</p>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-black text-black ml-1 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#22c55e]/20 text-[#22c55e] flex items-center justify-center text-[8px] font-black">Y</span>
                    Measure (Values)
                  </label>
                  <select
                  className="block w-full p-3 rounded-xl border-2 border-black bg-white focus:shadow-neo focus:border-primary outline-none transition-all text-sm cursor-pointer font-bold"
                  value={yAxisKeys[0] || ""}
                  onChange={(e) => setYAxisKeys([e.target.value])}
                  >
                  {numericKeys.map(k => (
                      <option key={k} value={k}>{k}</option>
                  ))}
                  </select>
                  <p className="text-[9px] font-bold text-black/30 ml-1">What to measure (e.g., Sales, Profit)</p>
              </div>
          </div>
        </div>
      )}


      {isStatic ? (
        <div 
            className={cn(
                "w-full border-2 border-black rounded-xl p-6 bg-white shadow-neo",
                fullHeight ? "flex-1 min-h-0" : "h-[500px]"
            )}
        >
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                {renderChart()}
            </ResponsiveContainer>
        </div>
      ) : (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "w-full border-2 border-black rounded-xl p-6 bg-white shadow-neo",
                fullHeight ? "flex-1 min-h-0" : "h-[500px]"
            )}
        >
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                {renderChart()}
            </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
