"use client";

import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Treemap,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Sankey,
  LineChart,
  AreaChart,
  BarChart,
  ScatterChart,
  Scatter,
  ReferenceLine,
  ReferenceArea,
  Brush,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  MoreVertical,
  Filter,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Target,
  Eye,
} from "lucide-react";

// Types
interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface AdvancedChartProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  height?: number;
  className?: string;
  showControls?: boolean;
  exportable?: boolean;
  realTime?: boolean;
  onDataUpdate?: (data: ChartDataPoint[]) => void;
}

interface MultiAxisChartProps extends AdvancedChartProps {
  leftAxisData: string;
  rightAxisData: string;
  combinationType: "line-bar" | "line-area" | "bar-area" | "triple";
}

interface HeatmapCalendarProps extends Omit<AdvancedChartProps, "data"> {
  data: Array<{ date: string; value: number; level: number }>;
  year: number;
}

// Color schemes
const CHART_COLORS = {
  primary: ["#3b82f6", "#1d4ed8", "#1e40af", "#1e3a8a"],
  success: ["#10b981", "#059669", "#047857", "#065f46"],
  warning: ["#f59e0b", "#d97706", "#b45309", "#92400e"],
  danger: ["#ef4444", "#dc2626", "#b91c1c", "#991b1b"],
  purple: ["#8b5cf6", "#7c3aed", "#6d28d9", "#5b21b6"],
  gradient: {
    blue: "url(#blueGradient)",
    green: "url(#greenGradient)",
    orange: "url(#orangeGradient)",
    purple: "url(#purpleGradient)",
  },
};

// Advanced Tooltip Component
const AdvancedTooltip = ({ active, payload, label, type = "default" }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 min-w-[220px] max-w-[300px]"
    >
      <div className="text-sm font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-100">
        {label}
      </div>
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-gray-600">{entry.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {typeof entry.value === "number"
                ? entry.value.toLocaleString()
                : entry.value}
            </span>
          </div>
        ))}
      </div>
      {type === "detailed" && payload[0]?.payload && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">Additional info available</div>
        </div>
      )}
    </motion.div>
  );
};

// Chart Controls Component
const ChartControls = ({
  onExport,
  onShare,
  onMaximize,
  isMaximized,
  onFilter,
  showRealTime,
  onToggleRealTime,
}: {
  onExport?: () => void;
  onShare?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  onFilter?: () => void;
  showRealTime?: boolean;
  onToggleRealTime?: () => void;
}) => (
  <div className="flex items-center gap-2">
    {showRealTime && (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleRealTime}
        className="h-8"
      >
        <Activity className="w-4 h-4 mr-1" />
        Live
      </Button>
    )}
    {onFilter && (
      <Button variant="outline" size="sm" onClick={onFilter} className="h-8">
        <Filter className="w-4 h-4" />
      </Button>
    )}
    {onExport && (
      <Button variant="outline" size="sm" onClick={onExport} className="h-8">
        <Download className="w-4 h-4" />
      </Button>
    )}
    {onShare && (
      <Button variant="outline" size="sm" onClick={onShare} className="h-8">
        <Share2 className="w-4 h-4" />
      </Button>
    )}
    {onMaximize && (
      <Button variant="outline" size="sm" onClick={onMaximize} className="h-8">
        {isMaximized ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </Button>
    )}
  </div>
);

// Multi-Axis Combination Chart
export const MultiAxisComboChart: React.FC<MultiAxisChartProps> = ({
  title,
  description,
  data,
  leftAxisData,
  rightAxisData,
  combinationType = "line-bar",
  height = 400,
  className,
  showControls = true,
  exportable = true,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [brushDomain, setBrushDomain] = useState<
    [number, number] | undefined
  >();

  const chartRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(() => {
    // Export functionality would be implemented here
    console.log("Exporting chart...");
  }, []);

  const renderChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.6} />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />
        <YAxis
          yAxisId="left"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />

        <Tooltip content={<AdvancedTooltip type="detailed" />} />
        <Legend />

        {combinationType.includes("bar") && (
          <Bar
            yAxisId="left"
            dataKey={leftAxisData}
            fill={CHART_COLORS.gradient.blue}
            radius={[2, 2, 0, 0]}
            name={leftAxisData}
          />
        )}

        {combinationType.includes("line") && (
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={rightAxisData}
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
            name={rightAxisData}
          />
        )}

        {combinationType.includes("area") && (
          <Area
            yAxisId="left"
            type="monotone"
            dataKey={leftAxisData}
            stroke="#f59e0b"
            fill={CHART_COLORS.gradient.orange}
            strokeWidth={2}
            name={leftAxisData}
          />
        )}

        {data.length > 10 && (
          <Brush dataKey="name" height={30} stroke="#3b82f6" />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );

  return (
    <motion.div
      layout
      className={cn(
        "chart-container",
        isMaximized && "fixed inset-4 z-50 bg-white rounded-lg shadow-2xl",
        className,
      )}
      ref={chartRef}
    >
      <Card className="h-full border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            {showControls && (
              <ChartControls
                onExport={exportable ? handleExport : undefined}
                onMaximize={() => setIsMaximized(!isMaximized)}
                isMaximized={isMaximized}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-2">{renderChart()}</CardContent>
      </Card>
    </motion.div>
  );
};

// Advanced Donut Chart with Drill-down
export const InteractiveDonutChart: React.FC<
  AdvancedChartProps & {
    centerContent?: React.ReactNode;
    drillDownData?: { [key: string]: ChartDataPoint[] };
  }
> = ({
  title,
  description,
  data,
  height = 400,
  className,
  centerContent,
  drillDownData,
  showControls = true,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>();
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState(data);

  const handlePieClick = useCallback(
    (data: any, index: number) => {
      if (drillDownData && drillDownData[data.name]) {
        setCurrentLevel(data.name);
        setCurrentData(drillDownData[data.name]);
      }
    },
    [drillDownData],
  );

  const handleBack = useCallback(() => {
    setCurrentLevel(null);
    setCurrentData(data);
  }, [data]);

  const total = useMemo(
    () => currentData.reduce((sum, item) => sum + item.value, 0),
    [currentData],
  );

  return (
    <motion.div layout className={cn("chart-container", className)}>
      <Card className="h-full border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {currentLevel && (
                  <Button variant="ghost" size="sm" onClick={handleBack}>
                    ←
                  </Button>
                )}
                {title} {currentLevel && `- PKR {currentLevel}`}
              </CardTitle>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            {showControls && <ChartControls />}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="relative">
            <ResponsiveContainer width="100%" height={height}>
              <PieChart>
                <Pie
                  data={currentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={handlePieClick}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(undefined)}
                >
                  {currentData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        CHART_COLORS.primary[
                          index % CHART_COLORS.primary.length
                        ]
                      }
                      stroke={activeIndex === index ? "#ffffff" : "none"}
                      strokeWidth={activeIndex === index ? 2 : 0}
                      style={{
                        filter:
                          activeIndex === index ? "brightness(1.1)" : "none",
                        cursor: drillDownData?.[entry.name]
                          ? "pointer"
                          : "default",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<AdvancedTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Content */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                {centerContent || (
                  <>
                    <div className="text-2xl font-bold text-gray-900">
                      {total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {currentData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      CHART_COLORS.primary[index % CHART_COLORS.primary.length],
                  }}
                />
                <span className="text-sm text-gray-600 truncate">
                  {item.name}
                </span>
                <span className="text-sm font-medium ml-auto">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Radar Chart for Multi-dimensional Metrics
export const RadarMetricsChart: React.FC<
  AdvancedChartProps & {
    metrics: string[];
    maxValue?: number;
  }
> = ({
  title,
  description,
  data,
  metrics,
  maxValue = 100,
  height = 400,
  className,
  showControls = true,
}) => {
  return (
    <motion.div layout className={cn("chart-container", className)}>
      <Card className="h-full border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            {showControls && <ChartControls />}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid stroke="#f1f5f9" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, maxValue]}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              />
              <Tooltip content={<AdvancedTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Heatmap Calendar
export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  title,
  description,
  data,
  year,
  height = 200,
  className,
  showControls = true,
}) => {
  const processedData = useMemo(() => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const weeks: Array<
      Array<{
        date: string;
        day: number;
        value: number;
        level: number;
      }>
    > = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const week: Array<{
        date: string;
        day: number;
        value: number;
        level: number;
      }> = [];
      for (let i = 0; i < 7; i++) {
        if (currentDate <= endDate) {
          const dateStr = currentDate.toISOString().split("T")[0];
          const dayData = data.find((d) => d.date === dateStr);
          week.push({
            date: dateStr,
            day: currentDate.getDay(),
            value: dayData?.value || 0,
            level: dayData?.level || 0,
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      if (week.length > 0) weeks.push(week);
    }

    return weeks;
  }, [data, year]);

  return (
    <motion.div layout className={cn("chart-container", className)}>
      <Card className="h-full border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            {showControls && <ChartControls />}
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-1">
            {processedData.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-110"
                    style={{
                      backgroundColor:
                        day.level === 0
                          ? "#f3f4f6"
                          : `rgba(59, 130, 246, ${0.2 + day.level * 0.2})`,
                    }}
                    title={`${day.date}: ${day.value}`}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className="w-3 h-3 rounded-sm"
                  style={{
                    backgroundColor:
                      level === 0
                        ? "#f3f4f6"
                        : `rgba(59, 130, 246, ${0.2 + level * 0.2})`,
                  }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Real-time Line Chart with Live Updates
export const RealTimeChart: React.FC<
  AdvancedChartProps & {
    maxDataPoints?: number;
    updateInterval?: number;
  }
> = ({
  title,
  description,
  data: initialData,
  maxDataPoints = 20,
  updateInterval = 5000,
  height = 300,
  className,
  onDataUpdate,
  realTime = false,
}) => {
  const [data, setData] = useState(initialData);
  const [isLive, setIsLive] = useState(realTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateRandomDataPoint = useCallback(() => {
    const lastPoint = data[data.length - 1];
    const timestamp = new Date().toLocaleTimeString();
    const variation = (Math.random() - 0.5) * 20;
    const newValue = Math.max(0, (lastPoint?.value || 50) + variation);

    return {
      name: timestamp,
      value: Math.round(newValue),
      timestamp: Date.now(),
    };
  }, [data]);

  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(() => {
        setData((prevData) => {
          const newDataPoint = generateRandomDataPoint();
          const updatedData = [...prevData, newDataPoint];

          if (updatedData.length > maxDataPoints) {
            updatedData.shift();
          }

          onDataUpdate?.(updatedData);
          return updatedData;
        });
      }, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isLive,
    updateInterval,
    maxDataPoints,
    generateRandomDataPoint,
    onDataUpdate,
  ]);

  return (
    <motion.div layout className={cn("chart-container", className)}>
      <Card className="h-full border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {title}
                {isLive && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
                    Live
                  </Badge>
                )}
              </CardTitle>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
            </div>
            <ChartControls
              showRealTime={true}
              onToggleRealTime={() => setIsLive(!isLive)}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data}>
              <defs>
                <linearGradient id="liveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                opacity={0.6}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#6b7280" }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />

              <Tooltip content={<AdvancedTooltip />} />

              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                fill="url(#liveGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: "#10b981", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export { AdvancedTooltip, ChartControls, CHART_COLORS };
