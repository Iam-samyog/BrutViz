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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, Sparkles } from "lucide-react";
import { generateForecast } from "@/lib/insights";

interface ChartGeneratorProps {
  data: any[];
  isStatic?: boolean;
  forcedChartType?: "bar" | "line" | "area" | "pie" | "radar" | "kp";
  forcedXAxis?: string;
  forcedYAxis?: string;
  forcedShowForecast?: boolean;
  hideConfig?: boolean;
  hideChart?: boolean;
  hideTypeSelector?: boolean;
  fullHeight?: boolean;
  onConfigChange?: (config: { type?: string, xAxis?: string, yAxis?: string, showForecast?: boolean }) => void;
  colorPalette?: string[];
  darkMode?: boolean;
}

const DEFAULT_COLORS = [
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#ef4444", // Red
];

// Modern glassmorphism tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(15, 15, 25, 0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "14px",
          padding: "12px 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          minWidth: "140px",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            fontWeight: 800,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "8px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: "6px",
          }}
        >
          {label}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: entry.color || entry.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                  boxShadow: `0 0 6px ${entry.color || entry.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                {entry.name}:{" "}
                <span style={{ color: "#fff", fontWeight: 900 }}>
                  {Number(entry.value).toLocaleString()}
                </span>
              </span>
              {entry.payload.isForecast && (
                <span
                  style={{
                    fontSize: "8px",
                    padding: "2px 6px",
                    background: "rgba(99,102,241,0.3)",
                    color: "#a5b4fc",
                    borderRadius: "99px",
                    fontWeight: 800,
                  }}
                >
                  AI
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Shared axis tick style
const TICK_STYLE = { fontSize: 11, fontWeight: 700, fill: "rgba(150,150,180,0.8)" };
const GRID_STROKE = "rgba(120,120,160,0.12)";

export default function ChartGenerator({
  data,
  isStatic = false,
  forcedChartType,
  forcedXAxis,
  forcedYAxis,
  forcedShowForecast,
  hideConfig = false,
  hideChart = false,
  hideTypeSelector = false,
  fullHeight = false,
  onConfigChange,
  colorPalette,
  darkMode = false,
}: ChartGeneratorProps) {
  const COLORS = colorPalette && colorPalette.length > 0 ? colorPalette : DEFAULT_COLORS;

  const [chartTypeState, setChartType] = useState<"bar" | "line" | "area" | "pie">("bar");
  const chartType = forcedChartType || chartTypeState;

  const [xAxisKeyOverride, setXAxisKey] = useState<string>("");
  const [yAxisKeysOverride, setYAxisKeys] = useState<string[]>([]);
  const [showForecastInternal, setShowForecastInternal] = useState(false);

  const xAxisKey = forcedXAxis || xAxisKeyOverride;
  const yAxisKeys = forcedYAxis ? [forcedYAxis] : yAxisKeysOverride;
  const showForecast = forcedShowForecast !== undefined ? forcedShowForecast : showForecastInternal;

  const { numericKeys, categoricalKeys } = useMemo(() => {
    if (!data.length) return { numericKeys: [], categoricalKeys: [] };
    const firstRow = data[0];
    const nKeys: string[] = [];
    const cKeys: string[] = [];
    Object.keys(firstRow).forEach((key) => {
      const val = firstRow[key];
      if (typeof val === "number" || (!isNaN(Number(val)) && val !== "")) {
        nKeys.push(key);
      } else {
        cKeys.push(key);
      }
    });
    return { numericKeys: nKeys, categoricalKeys: cKeys };
  }, [data]);

  useEffect(() => {
    if (forcedChartType) setChartType(forcedChartType);
    if (forcedXAxis) setXAxisKey(forcedXAxis);
    if (forcedYAxis) setYAxisKeys([forcedYAxis]);

    if (!forcedXAxis && !xAxisKeyOverride && categoricalKeys.length > 0) {
      setXAxisKey(categoricalKeys[0]);
    } else if (!forcedXAxis && !xAxisKeyOverride && numericKeys.length > 0) {
      setXAxisKey(numericKeys[0]);
    }

    if (!forcedYAxis && yAxisKeysOverride.length === 0 && numericKeys.length > 0) {
      const currentXAxis = forcedXAxis || xAxisKeyOverride;
      const target = numericKeys.find((k) => k !== currentXAxis) || numericKeys[0];
      if (target) setYAxisKeys([target]);
    }
  }, [categoricalKeys, numericKeys, forcedChartType, forcedXAxis, forcedYAxis]);

  const chartData = useMemo(() => {
    return data.map((row) => {
      const newRow = { ...row };
      numericKeys.forEach((key) => { newRow[key] = Number(newRow[key]); });
      return newRow;
    });
  }, [data, numericKeys]);

  const { augmentedData } = useMemo(() => {
    if (!showForecast || !xAxisKey || yAxisKeys.length === 0) return { augmentedData: chartData };
    const forecast = generateForecast(chartData, xAxisKey, yAxisKeys[0], 6);
    const combinedData = [...chartData, ...forecast.map((f) => ({ ...f, [xAxisKey]: f[xAxisKey] }))];
    return { augmentedData: combinedData };
  }, [chartData, showForecast, xAxisKey, yAxisKeys]);

  if (numericKeys.length === 0 && chartType !== "radar") {
    return (
      <div className="p-8 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-white/30 gap-3">
        <AlertCircle className="w-6 h-6" />
        <p className="text-sm font-semibold">No numeric data found to chart.</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case "radar": {
        const radarKeys = numericKeys.slice(0, 6);
        const radarData = radarKeys.map((key) => {
          const entry: any = { subject: key };
          const grouped = new Map<string, number>();
          chartData.forEach((row) => {
            const cat = String(row[xAxisKey] ?? "");
            grouped.set(cat, (grouped.get(cat) || 0) + (Number(row[key]) || 0));
          });
          grouped.forEach((v, cat) => { entry[cat] = v; });
          return entry;
        });
        const radarCategories = Array.from(new Set(chartData.map((r) => String(r[xAxisKey] ?? ""))));
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
            <defs>
              {radarCategories.slice(0, 5).map((_, i) => (
                <radialGradient key={i} id={`radarGrad${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.05} />
                </radialGradient>
              ))}
            </defs>
            <PolarGrid stroke="rgba(255,255,255,0.08)" gridType="polygon" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fontSize: 10, fontWeight: 800, fill: "rgba(200,200,230,0.7)" }}
            />
            <PolarRadiusAxis
              tick={{ fontSize: 8, fontWeight: 600, fill: "rgba(150,150,180,0.4)" }}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {radarCategories.slice(0, 5).map((cat, i) => (
              <Radar
                key={cat}
                name={cat}
                dataKey={cat}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.18}
                strokeWidth={2.5}
                isAnimationActive={!isStatic}
              />
            ))}
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "10px", fontWeight: 800, color: "rgba(200,200,230,0.7)" }}
            />
          </RadarChart>
        );
      }

      case "kp": {
        const kpY1 = numericKeys[0] || "";
        const kpY2 = numericKeys[1] || numericKeys[0] || "";
        const KP_GOLD = "#F5C518";
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: "#F5C518", opacity: 0.8 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "rgba(255,255,255,0.4)" }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,197,24,0.06)" }} />
            <Legend verticalAlign="top" align="right" iconType="square" wrapperStyle={{ fontSize: "10px", fontWeight: 900, color: "#F5C518" }} />
            <Bar dataKey={kpY1} name="Kill Points" stackId="kp" fill={KP_GOLD} radius={[0, 0, 0, 0]} isAnimationActive={!isStatic} barSize={28} />
            {kpY2 !== kpY1 && (
              <Bar dataKey={kpY2} name="Placement Pts" stackId="kp" fill="#1a1a2e" radius={[4, 4, 0, 0]} isAnimationActive={!isStatic} barSize={28} stroke={KP_GOLD} strokeWidth={1} />
            )}
          </BarChart>
        );
      }

      case "area": {
        return (
          <ComposedChart data={augmentedData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <defs>
              {yAxisKeys.map((key, i) => (
                <linearGradient key={key} id={`areaGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={TICK_STYLE} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={TICK_STYLE} width={45} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: "16px", fontSize: "10px", fontWeight: 800, color: "rgba(200,200,230,0.8)" }} />
            {yAxisKeys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={3}
                fill={`url(#areaGrad${i})`}
                isAnimationActive={!isStatic}
                dot={false}
                activeDot={{ r: 6, stroke: COLORS[i % COLORS.length], strokeWidth: 2, fill: "#fff" }}
                strokeDasharray={showForecast ? "6 4" : "0"}
              />
            ))}
          </ComposedChart>
        );
      }

      case "line": {
        return (
          <ComposedChart data={augmentedData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={TICK_STYLE} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={TICK_STYLE} width={45} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: "16px", fontSize: "10px", fontWeight: 800, color: "rgba(200,200,230,0.8)" }} />
            {yAxisKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={3}
                dot={(props: any) => {
                  if (props?.payload?.isForecast) return <svg />;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={COLORS[i % COLORS.length]}
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth={2}
                    />
                  );
                }}
                strokeDasharray={showForecast ? "6 4" : "0"}
                activeDot={{ r: 7, stroke: COLORS[i % COLORS.length], strokeWidth: 2, fill: "#fff" }}
                isAnimationActive={!isStatic}
              />
            ))}
          </ComposedChart>
        );
      }

      case "pie": {
        const aggregatedData = (() => {
          if (chartData.length <= 8) return chartData;
          const sorted = [...chartData].sort((a, b) => (b[yAxisKeys[0]] || 0) - (a[yAxisKeys[0]] || 0));
          const top = sorted.slice(0, 8);
          const rest = sorted.slice(8);
          const otherValue = rest.reduce((sum, item) => sum + (Number(item[yAxisKeys[0]]) || 0), 0);
          return [...top, { [xAxisKey]: "Others", [yAxisKeys[0]]: otherValue }];
        })();

        return (
          <PieChart>
            <defs>
              {aggregatedData.map((_, i) => (
                <radialGradient key={i} id={`pieGrad${i}`} cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={1} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.7} />
                </radialGradient>
              ))}
            </defs>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={aggregatedData}
              dataKey={yAxisKeys[0]}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              innerRadius="38%"
              outerRadius="65%"
              paddingAngle={3}
              label={({ name, percent }) =>
                percent !== undefined && percent > 0.05
                  ? `${name} (${(percent * 100).toFixed(0)}%)`
                  : ""
              }
              labelLine={{ stroke: "rgba(200,200,230,0.4)", strokeWidth: 1 }}
              isAnimationActive={!isStatic}
            >
              {aggregatedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#pieGrad${index})`}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "10px", fontWeight: 800, color: "rgba(200,200,230,0.8)" }}
            />
          </PieChart>
        );
      }

      default: { // Bar
        return (
          <BarChart data={augmentedData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }} barCategoryGap="28%">
            <defs>
              {yAxisKeys.map((key, i) => (
                <linearGradient key={key} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS[i % COLORS.length]} stopOpacity={1} />
                  <stop offset="100%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.6} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={TICK_STYLE} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={TICK_STYLE} width={45} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)", radius: 6 }} content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: "16px", fontSize: "10px", fontWeight: 800, color: "rgba(200,200,230,0.8)" }} />
            {yAxisKeys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                radius={[6, 6, 0, 0]}
                isAnimationActive={!isStatic}
                barSize={36}
              >
                {augmentedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isForecast ? "transparent" : `url(#barGrad${i})`}
                    fillOpacity={entry.isForecast ? 0 : 1}
                    stroke={entry.isForecast ? COLORS[i % COLORS.length] : "none"}
                    strokeWidth={entry.isForecast ? 2 : 0}
                    strokeDasharray={entry.isForecast ? "4 4" : "0"}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        );
      }
    }
  };

  return (
    <div className={cn("space-y-6", fullHeight && "h-full space-y-0 flex flex-col")}>
      {!hideConfig && (
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-3 group">
            <label className="text-[11px] font-black text-foreground/40 tracking-tighter flex items-center gap-1.5 group-hover:text-primary transition-colors shrink-0">
              <span className="text-primary font-black">X</span>
              <span>:</span>
            </label>
            <select
              className="min-w-[120px] py-1.5 px-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 border-none outline-none transition-all text-xs cursor-pointer font-extrabold"
              value={xAxisKey}
              onChange={(e) => {
                const newX = e.target.value;
                setXAxisKey(newX);
                onConfigChange?.({ type: chartType, xAxis: newX, yAxis: yAxisKeys[0] });
              }}
            >
              {categoricalKeys.concat(numericKeys).map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 group">
            <label className="text-[11px] font-black text-foreground/40 tracking-tighter flex items-center gap-1.5 group-hover:text-[#22c55e] transition-colors shrink-0">
              <span className="text-[#22c55e] font-black">Y</span>
              <span>:</span>
            </label>
            <select
              className="min-w-[120px] py-1.5 px-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 border-none outline-none transition-all text-xs cursor-pointer font-extrabold"
              value={yAxisKeys[0] || ""}
              onChange={(e) => {
                const newY = e.target.value;
                setYAxisKeys([newY]);
                onConfigChange?.({ type: chartType, xAxis: xAxisKey, yAxis: newY });
              }}
            >
              {numericKeys.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-border/10">
            <button
              onClick={() => {
                const newState = !showForecast;
                setShowForecastInternal(newState);
                onConfigChange?.({ type: chartType, xAxis: xAxisKey, yAxis: yAxisKeys[0], showForecast: newState });
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg font-black tracking-tighter text-[10px] transition-all",
                showForecast
                  ? "bg-primary text-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px] border-2 border-border"
                  : "bg-foreground/5 text-foreground hover:bg-foreground/10"
              )}
            >
              <Sparkles className={cn("w-3 h-3", showForecast && "animate-pulse")} />
              {showForecast ? "Sync Active" : "AI Forecast"}
            </button>
          </div>
        </div>
      )}

      {!hideChart && (
        isStatic ? (
          <div
            className={cn(
              fullHeight
                ? "flex-1 min-h-0 w-full"
                : "w-full border-2 border-border rounded-xl p-6 bg-background shadow-neo transition-all hover:shadow-neo-lg h-[500px]"
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
              fullHeight
                ? "flex-1 min-h-0 w-full"
                : "w-full border-2 border-border rounded-xl p-6 bg-background shadow-neo transition-all hover:shadow-neo-lg h-[500px]"
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
