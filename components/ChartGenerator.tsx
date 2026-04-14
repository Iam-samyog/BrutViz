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
  Sankey,
} from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AlertCircle, Sparkles } from "lucide-react";
import { generateForecast } from "@/lib/insights";

interface ChartGeneratorProps {
  data: any[];
  isStatic?: boolean;
  forcedChartType?: "bar" | "line" | "area" | "pie" | "sankey" | "kp";
  forcedXAxis?: string;
  forcedYAxis?: string;
  forcedShowForecast?: boolean;
  hideConfig?: boolean;
  hideChart?: boolean;
  hideTypeSelector?: boolean;
  fullHeight?: boolean;
  onConfigChange?: (config: { type?: string, xAxis?: string, yAxis?: string, showForecast?: boolean }) => void;
}

const COLORS = [
  "#3B82F6", // Blue 500
  "#8B5CF6", // Violet 500
  "#EC4899", // Pink 500
  "#F59E0B", // Amber 500
  "#10B981", // Emerald 500
  "#6366F1", // Indigo 500
  "#EF4444", // Red 500
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl">
        <p className="font-black text-xs uppercase tracking-widest text-black/40 mb-2 border-b-2 border-black/5 pb-1">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full border-2 border-black" 
                style={{ backgroundColor: entry.color || entry.fill || COLORS[index % COLORS.length] }} 
              />
              <span className="text-xs font-black text-black">
                {entry.name}: <span className="text-primary">{entry.value.toLocaleString()}</span>
              </span>
              {entry.payload.isForecast && (
                <span className="text-[8px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-black uppercase">AI Predicted</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

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
  onConfigChange
}: ChartGeneratorProps) {
  const [chartTypeState, setChartType] = useState<"bar" | "line" | "area" | "pie">("bar");
  const chartType = forcedChartType || chartTypeState; // Override if forced

  const [xAxisKeyOverride, setXAxisKey] = useState<string>("");
  const [yAxisKeysOverride, setYAxisKeys] = useState<string[]>([]);
  const [showForecastInternal, setShowForecastInternal] = useState(false);

  const xAxisKey = forcedXAxis || xAxisKeyOverride;
  const yAxisKeys = forcedYAxis ? [forcedYAxis] : yAxisKeysOverride;
  const showForecast = forcedShowForecast !== undefined ? forcedShowForecast : showForecastInternal;

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

  const { augmentedData } = useMemo(() => {
    if (!showForecast || !xAxisKey || yAxisKeys.length === 0) return { augmentedData: chartData };
    
    // Generate forecast for the first Y axis key
    const forecast = generateForecast(chartData, xAxisKey, yAxisKeys[0], 6);
    const combinedData = [...chartData, ...forecast.map(f => ({ ...f, [xAxisKey]: f[xAxisKey] }))];
    
    return { augmentedData: combinedData };
  }, [chartData, showForecast, xAxisKey, yAxisKeys]);

  // Build Sankey data from first two categorical columns
  const sankeyData = useMemo(() => {
    if (categoricalKeys.length < 2 || !data.length) return null;
    const sourceKey = categoricalKeys[0];
    const targetKey = categoricalKeys[1];
    const valueKey = numericKeys[0];
    const nodeNames = Array.from(new Set([
      ...data.map(r => String(r[sourceKey])),
      ...data.map(r => String(r[targetKey])),
    ]));
    const nodeMap = new Map(nodeNames.map((n, i) => [n, i]));
    const linkMap = new Map<string, number>();
    data.forEach(row => {
      const s = String(row[sourceKey]);
      const t = String(row[targetKey]);
      const key = `${s}__${t}`;
      const v = Number(row[valueKey]) || 1;
      linkMap.set(key, (linkMap.get(key) || 0) + v);
    });
    const links = Array.from(linkMap.entries()).map(([key, value]) => {
      const [s, t] = key.split('__');
      return { source: nodeMap.get(s)!, target: nodeMap.get(t)!, value };
    }).filter(l => l.source !== l.target && l.value > 0);
    return { nodes: nodeNames.map(name => ({ name })), links };
  }, [data, categoricalKeys, numericKeys]);

  if (numericKeys.length === 0 && chartType !== 'sankey') {
    return (
      <div className="p-8 border rounded-xl border-dashed flex flex-col items-center justify-center text-muted-foreground gap-2">
        <AlertCircle className="w-6 h-6" />
        <p>No numeric data found to chart.</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (chartType) {
      case "sankey": {
        if (!sankeyData || sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-black/40">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-black uppercase tracking-tight">Need 2+ text columns for flow</p>
            </div>
          );
        }
        return (
          <Sankey
            width={500}
            height={400}
            data={sankeyData}
            nodeWidth={12}
            nodePadding={24}
            linkCurvature={0.5}
            iterations={32}
            node={{ fill: '#3B82F6', stroke: '#000', strokeWidth: 2 }}
            link={{ stroke: '#3B82F6', strokeOpacity: 0.25 }}
          >
            <Tooltip
              content={({ active, payload }: any) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                const label = d?.name || `${d?.source?.name} → ${d?.target?.name}`;
                const value = d?.value;
                return (
                  <div className="bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl text-xs font-black">
                    <p className="text-black/40 uppercase tracking-widest mb-1">{label}</p>
                    {value !== undefined && <p className="text-primary">{Number(value).toLocaleString()}</p>}
                  </div>
                );
              }}
            />
          </Sankey>
        );
      }

      case "kp": {
        // PUBG KP-style stacked bar with gold/black esports aesthetic
        const kpY1 = numericKeys[0] || '';
        const kpY2 = numericKeys[1] || numericKeys[0] || '';
        const KP_GOLD = '#F5C518';
        const KP_DARK = '#1a1a2e';
        return (
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ background: 'transparent' }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#fff" opacity={0.08} />
            <XAxis
              dataKey={xAxisKey}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 900, fill: '#F5C518', opacity: 0.8 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 900, fill: '#fff', opacity: 0.5 }}
            />
            <Tooltip
              cursor={{ fill: 'rgba(245,197,24,0.08)' }}
              content={({ active, payload, label }: any) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-[#1a1a2e] border-2 border-[#F5C518] p-3 shadow-[4px_4px_0px_0px_#F5C518] rounded-xl">
                    <p className="font-black text-xs uppercase tracking-widest text-[#F5C518] mb-2 border-b border-[#F5C518]/20 pb-1">{label}</p>
                    {payload.map((e: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: e.fill }} />
                        <span className="text-xs font-black text-white">{e.name}: <span className="text-[#F5C518]">{Number(e.value).toLocaleString()}</span></span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="square"
              wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#F5C518' }}
            />
            <Bar dataKey={kpY1} name="Kill Points" stackId="kp" fill={KP_GOLD} radius={[0,0,0,0]} isAnimationActive={!isStatic} barSize={28} />
            {kpY2 !== kpY1 && (
              <Bar dataKey={kpY2} name="Placement Pts" stackId="kp" fill={KP_DARK} radius={[4,4,0,0]} isAnimationActive={!isStatic} barSize={28}
                stroke={KP_GOLD} strokeWidth={1}
              />
            )}
          </BarChart>
        );
      }

      case "area":
        return (
          <ComposedChart data={augmentedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#000" opacity={0.05} />
            <XAxis 
              dataKey={xAxisKey} 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#000', opacity: 0.4 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#000', opacity: 0.4 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            {showForecast && (
              <Area 
                type="monotone" 
                stroke="none"
                fill={COLORS[0]}
                fillOpacity={0.05}
                connectNulls
                name="Confidence Range"
                data={augmentedData.map(d => ({ ...d, range: d.isForecast ? [d.lowerBound, d.upperBound] : null }))}
                dataKey="range"
              />
            )}
            <Area 
              type="monotone" 
              dataKey={yAxisKeys[0]} 
              stroke={COLORS[0]} 
              strokeWidth={4}
              fill="url(#colorArea)" 
              isAnimationActive={!isStatic} 
              strokeDasharray={showForecast ? "5 5" : "0"}
            />
          </ComposedChart>
        );
      case "line":
        return (
          <ComposedChart data={augmentedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
             <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#000" opacity={0.05} />
            <XAxis 
              dataKey={xAxisKey} 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#000', opacity: 0.4 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#000', opacity: 0.4 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            {showForecast && (
              <Area 
                type="monotone" 
                stroke="none"
                fill={COLORS[0]}
                fillOpacity={0.05}
                connectNulls
                name="Confidence Range"
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
                strokeWidth={4} 
                dot={(props: any) => {
                  if (props?.payload?.isForecast) return <svg></svg>;
                  return <circle cx={props.cx} cy={props.cy} r={5} fill={COLORS[i % COLORS.length]} strokeWidth={2} stroke="white" />;
                }}
                strokeDasharray={showForecast ? "5 5" : "0"}
                activeDot={{ r: 8, stroke: 'white', strokeWidth: 3 }} 
                isAnimationActive={!isStatic} 
              />
            ))}
          </ComposedChart>
        );
      case "pie":
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
             <Tooltip content={<CustomTooltip />} />
             <Pie
               data={aggregatedData}
               dataKey={yAxisKeys[0]}
               nameKey={xAxisKey}
               cx="50%"
               cy="50%"
               innerRadius={70}
               outerRadius={100}
               paddingAngle={5}
               label={({ name, percent }) => (percent !== undefined && percent > 0.05) ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
               isAnimationActive={!isStatic}
             >
               {aggregatedData.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="black" strokeWidth={2} />
               ))}
             </Pie>
          </PieChart>
        );
      default: // Bar
        return (
          <BarChart data={augmentedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#000" opacity={0.05} />
            <XAxis 
              dataKey={xAxisKey} 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#000', opacity: 0.4 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fontWeight: 700, fill: '#000', opacity: 0.4 }}
            />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            {yAxisKeys.map((key, i) => (
              <Bar 
                key={key} 
                dataKey={key} 
                radius={[6, 6, 0, 0]} 
                isAnimationActive={!isStatic} 
                barSize={40}
              >
                {augmentedData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={entry.isForecast ? 0.3 : 1}
                        stroke={entry.isForecast ? COLORS[i % COLORS.length] : "none"}
                        strokeWidth={2}
                        strokeDasharray={entry.isForecast ? "4 4" : "0"}
                    />
                ))}
              </Bar>
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
                    onConfigChange?.({ type: chartType, xAxis: xAxisKey, yAxis: newY });
                  }}
                  >
                  {numericKeys.map(k => (
                      <option key={k} value={k}>{k}</option>
                  ))}
                  </select>
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-black/10">
                  <button
                    onClick={() => {
                        const newState = !showForecast;
                        setShowForecastInternal(newState);
                        onConfigChange?.({ type: chartType, xAxis: xAxisKey, yAxis: yAxisKeys[0], showForecast: newState });
                    }}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg font-black uppercase tracking-tighter text-[10px] transition-all",
                        showForecast ? "bg-primary text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-1px] border-2 border-black" : "bg-black/5 text-black hover:bg-black/10"
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
                  fullHeight ? "flex-1 min-h-0 w-full" : "w-full border-2 border-black rounded-xl p-6 bg-white shadow-neo transition-all hover:shadow-neo-lg h-[500px]"
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
                  fullHeight ? "flex-1 min-h-0 w-full" : "w-full border-2 border-black rounded-xl p-6 bg-white shadow-neo transition-all hover:shadow-neo-lg h-[500px]"
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
