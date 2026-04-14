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
  hideChart?: boolean;
  hideTypeSelector?: boolean;
  fullHeight?: boolean;
  onConfigChange?: (config: { type?: string, xAxis?: string, yAxis?: string }) => void;
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
  hideChart = false,
  hideTypeSelector = false,
  fullHeight = false,
  onConfigChange
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
          <div className="flex flex-wrap items-center gap-8">
              <div className="flex items-center gap-3 group">
                  <label className="text-[11px] font-black text-black/40 uppercase tracking-tighter flex items-center gap-1.5 group-hover:text-primary transition-colors shrink-0">
                    <span className="text-primary font-black">X</span>
                    <span>:</span>
                  </label>
                  <select
                  className="min-w-[120px] py-1.5 px-2 rounded-lg bg-black/5 hover:bg-black/10 border-none outline-none transition-all text-xs cursor-pointer font-extrabold"
                  value={xAxisKey}
                  onChange={(e) => {
                    const newX = e.target.value;
                    setXAxisKey(newX);
                    onConfigChange?.({ type: chartType, xAxis: newX, yAxis: yAxisKeys[0] });
                  }}
                  >
                  {categoricalKeys.concat(numericKeys).map(k => (
                      <option key={k} value={k}>{k}</option>
                  ))}
                  </select>
              </div>

              <div className="flex items-center gap-3 group">
                  <label className="text-[11px] font-black text-black/40 uppercase tracking-tighter flex items-center gap-1.5 group-hover:text-[#22c55e] transition-colors shrink-0">
                    <span className="text-[#22c55e] font-black">Y</span>
                    <span>:</span>
                  </label>
                  <select
                  className="min-w-[120px] py-1.5 px-2 rounded-lg bg-black/5 hover:bg-black/10 border-none outline-none transition-all text-xs cursor-pointer font-extrabold"
                  value={yAxisKeys[0] || ""}
                  onChange={(e) => {
                    const newY = e.target.value;
                    setYAxisKeys([newY]);
                    onConfigChange?.({ type: chartType, xAxis, yAxis: newY });
                  }}
                  >
                  {numericKeys.map(k => (
                      <option key={k} value={k}>{k}</option>
                  ))}
                  </select>
              </div>
          </div>
      )}

      {!hideChart && (
        isStatic ? (
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
        )
      )}
    </div>
  );
}
