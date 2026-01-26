"use client";

import { useMemo, useState, useEffect } from "react";
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
  ComposedChart,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, BarChart3, Sparkles } from "lucide-react";
import { generateForecast } from "@/lib/insights";

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
  const [showForecast, setShowForecast] = useState(false);

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
  useEffect(() => {
    // If forced values are provided, update local state to match to avoid UI confusion
    if (forcedChartType) setChartType(forcedChartType);
    if (forcedXAxis) setXAxisKey(forcedXAxis);
    if (forcedYAxis) setYAxisKeys([forcedYAxis]);

    // Only set defaults if no forced values and no override values are set
    // Prefer categorical for X, numeric for Y
    if (!forcedXAxis && !xAxisKeyOverride && categoricalKeys.length > 0) {
      setXAxisKey(categoricalKeys[0]);
    } else if (!forcedXAxis && !xAxisKeyOverride && numericKeys.length > 0) {
       // fallback if no categorical
       setXAxisKey(numericKeys[0]);
    }

    if (!forcedYAxis && yAxisKeysOverride.length === 0 && numericKeys.length > 0) {
        // Pick all numeric keys that aren't the X axis? Or just the first one?
        // Let's pick the first one not equal to X
        const currentXAxis = forcedXAxis || xAxisKeyOverride;
        const target = numericKeys.find(k => k !== currentXAxis) || numericKeys[0];
        if (target) setYAxisKeys([target]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoricalKeys, numericKeys, forcedChartType, forcedXAxis, forcedYAxis]);

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

  const { augmentedData, forecastData } = useMemo(() => {
    if (!showForecast || !xAxisKey || yAxisKeys.length === 0) return { augmentedData: chartData, forecastData: [] };
    
    // Generate forecast for the first Y axis key
    const forecast = generateForecast(chartData, xAxisKey, yAxisKeys[0], 6);
    
    // Combine to ensure continuity
    const lastRealPoint = chartData[chartData.length - 1];
    const combinedData = [...chartData, ...forecast.map(f => ({ ...f, [xAxisKey]: f[xAxisKey] }))];
    
    return { augmentedData: combinedData, forecastData: forecast };
  }, [chartData, showForecast, xAxisKey, yAxisKeys]);

  if (numericKeys.length === 0) {
    return (
      <div className="p-8 border rounded-xl border-dashed flex flex-col items-center justify-center text-muted-foreground gap-2">
        <AlertCircle className="w-6 h-6" />
        <p>No numeric data found to chart.</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case "area":
        return (
          <ComposedChart data={augmentedData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xAxisKey} style={{ fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
            <YAxis style={{ fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                formatter={(value: any, name: string | undefined, props: any) => {
                  if (typeof value !== 'number') return [value, name || ''];
                  if (props.payload.isForecast) return [value.toFixed(2), `${name || ''} (Predicted)`];
                  return [value, name || ''];
                }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {showForecast && (
              <Area 
                type="monotone" 
                stroke="none"
                fill={COLORS[0]}
                fillOpacity={0.1}
                connectNulls
                name="Confidence Interval"
                data={augmentedData.map(d => ({ ...d, range: d.isForecast ? [d.lowerBound, d.upperBound] : null }))}
                dataKey="range"
              />
            )}
            <Area 
              type="monotone" 
              dataKey={yAxisKeys[0]} 
              stroke={COLORS[0]} 
              fill={COLORS[0]} 
              fillOpacity={0.2} 
              isAnimationActive={!isStatic} 
              strokeDasharray={showForecast ? "5 5" : "0"}
            />
          </ComposedChart>
        );
      case "line":
        return (
          <ComposedChart data={augmentedData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey={xAxisKey} style={{ fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
            <YAxis style={{ fontSize: '12px' }} tick={{ fill: 'currentColor' }} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                formatter={(value: any, name: string | undefined, props: any) => {
                  if (typeof value !== 'number') return [value, name || ''];
                  if (props.payload.isForecast) return [value.toFixed(2), `${name || ''} (Predicted)`];
                  return [value, name || ''];
                }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            {showForecast && (
              <Area 
                type="monotone" 
                stroke="none"
                fill={COLORS[0]}
                fillOpacity={0.1}
                connectNulls
                name="Confidence Interval"
                // Recharts Range Area trick
                data={augmentedData.map(d => ({ ...d, range: d.isForecast ? [d.lowerBound, d.upperBound] : null }))}
                dataKey="range"
              />
            )}
            {yAxisKeys.map((key, i) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={COLORS[i % COLORS.length]} 
                strokeWidth={3} 
                dot={(props: any) => {
                  if (props?.payload?.isForecast) return <svg></svg>; // Return empty svg node instead of null
                  return <circle cx={props.cx} cy={props.cy} r={4} fill={COLORS[i % COLORS.length]} strokeWidth={2} stroke="white" />;
                }}
                strokeDasharray={showForecast ? "5 5" : "0"} // Can't be a function per-point in Recharts easily without separate series
                activeDot={{ r: 6 }} 
                isAnimationActive={!isStatic} 
              />
            ))}
          </ComposedChart>
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
                <span className="font-bold text-lg text-black block">Charts</span>
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Select your dimensions to analyze</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <button
                disabled={chartType !== 'line' && chartType !== 'area'}
                onClick={() => setShowForecast(!showForecast)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-black font-black uppercase tracking-widest text-[10px] transition-all shadow-neo-sm",
                  showForecast ? "bg-primary text-white" : "bg-white text-black hover:bg-gray-50",
                  (chartType !== 'line' && chartType !== 'area') && "opacity-30 cursor-not-allowed grayscale shadow-none translate-y-0"
                )}
              >
                <Sparkles className={cn("w-3 h-3", showForecast && "animate-pulse")} />
                {showForecast ? "Forecast Active" : "AI Forecast"}
              </button>
              {(chartType !== 'line' && chartType !== 'area') && (
                <span className="text-[8px] font-bold text-black/30 uppercase max-w-[120px] leading-tight text-right">
                  Select Line/Area chart to unlock
                </span>
              )}
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
