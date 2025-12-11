"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DashboardWidget } from "@/types/dashboard";

interface ChartRendererProps {
  widget: DashboardWidget;
  data: any[];
}

// Professional gradient color palette for charts
const COLORS = [
  "url(#gradientBlue)",
  "url(#gradientGreen)",
  "url(#gradientAmber)",
  "url(#gradientRed)",
  "url(#gradientPurple)",
  "url(#gradientCyan)",
  "url(#gradientPink)",
  "url(#gradientLime)",
];

const SOLID_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

export function SimpleBarChart({ widget, data }: ChartRendererProps) {
  if (!widget.xAxis || !widget.yAxis) {
    return (
      <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 shadow-xl shadow-black/5">
        <p className="text-sm text-slate-500 font-medium">Bar chart requires xAxis and yAxis</p>
      </div>
    );
  }

  // Transform data for bar chart
  const chartData = data.reduce((acc: any[], record) => {
    const xValue = record.data?.[widget.xAxis!] ?? record[widget.xAxis!];
    const yValue = record.data?.[widget.yAxis!] ?? record[widget.yAxis!] ?? 0;

    if (xValue === undefined || xValue === null) return acc;

    // Find existing entry for this xValue
    const existing = acc.find((item) => item.name === String(xValue));
    if (existing) {
      existing.value = (existing.value || 0) + (typeof yValue === "number" ? yValue : 0);
    } else {
      acc.push({
        name: String(xValue),
        value: typeof yValue === "number" ? yValue : 0,
      });
    }

    return acc;
  }, []);

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
          {widget.title}
        </h3>
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all group overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/20 group-hover:to-purple-50/20 transition-all duration-300" />
      
      <div className="relative">
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-6">
          {widget.title}
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <defs>
              <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              fontWeight={500}
            />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} fontWeight={500} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                fontWeight: 600,
              }}
              cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
            />
            <Bar 
              dataKey="value" 
              fill="url(#gradientBlue)" 
              radius={[12, 12, 0, 0]}
              stroke="#2563eb"
              strokeWidth={1}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SimpleLineChart({ widget, data }: ChartRendererProps) {
  if (!widget.xAxis || !widget.yAxis) {
    return (
      <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 shadow-xl shadow-black/5">
        <p className="text-sm text-slate-500 font-medium">Line chart requires xAxis and yAxis</p>
      </div>
    );
  }

  // Transform data for line chart (sort by xAxis for time series)
  const chartData = data
    .map((record) => {
      const xValue = record.data?.[widget.xAxis!] ?? record[widget.xAxis!];
      const yValue = record.data?.[widget.yAxis!] ?? record[widget.yAxis!] ?? 0;

      // Try to parse date if xAxis is a date field
      let parsedXValue = xValue;
      if (typeof xValue === "string" && xValue.match(/^\d{4}-\d{2}-\d{2}/)) {
        parsedXValue = new Date(xValue).toLocaleDateString();
      }

      return {
        name: parsedXValue !== undefined && parsedXValue !== null ? String(parsedXValue) : "",
        value: typeof yValue === "number" ? yValue : 0,
      };
    })
    .filter((item) => item.name !== "")
    .sort((a, b) => {
      // Try to sort by date if possible
      const dateA = new Date(a.name).getTime();
      const dateB = new Date(b.name).getTime();
      if (!isNaN(dateA) && !isNaN(dateB)) {
        return dateA - dateB;
      }
      return a.name.localeCompare(b.name);
    });

  if (chartData.length === 0) {
    return (
      <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 shadow-xl shadow-black/5">
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-4">
          {widget.title}
        </h3>
        <p className="text-sm text-slate-400 font-medium">No data available</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all group overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/20 group-hover:to-purple-50/20 transition-all duration-300" />
      
      <div className="relative">
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-6">
          {widget.title}
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="gradientLine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
              fontWeight={500}
            />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} fontWeight={500} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                fontWeight: 600,
              }}
              cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "5 5" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", r: 5, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 7, stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SimplePieChart({ widget, data }: ChartRendererProps) {
  if (!widget.field) {
    return (
      <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 shadow-xl shadow-black/5">
        <p className="text-sm text-slate-500 font-medium">Pie chart requires a field</p>
      </div>
    );
  }

  // Count occurrences of each value
  const chartData = data.reduce((acc: any[], record) => {
    const value = record.data?.[widget.field!] ?? record[widget.field!];
    if (value === undefined || value === null) return acc;

    const valueStr = String(value);
    const existing = acc.find((item) => item.name === valueStr);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: valueStr, value: 1 });
    }

    return acc;
  }, []);

  if (chartData.length === 0) {
    return (
      <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 shadow-xl shadow-black/5">
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-4">
          {widget.title}
        </h3>
        <p className="text-sm text-slate-400 font-medium">No data available</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all group overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/20 group-hover:to-purple-50/20 transition-all duration-300" />
      
      <div className="relative">
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-6">
          {widget.title}
        </h3>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <defs>
              <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradientAmber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradientRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradientPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradientCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                <stop offset="100%" stopColor="#0891b2" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradientPink" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
                <stop offset="100%" stopColor="#db2777" stopOpacity={0.8} />
              </linearGradient>
              <linearGradient id="gradientLime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#84cc16" stopOpacity={1} />
                <stop offset="100%" stopColor="#65a30d" stopOpacity={0.8} />
              </linearGradient>
            </defs>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => 
                percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
              }
              outerRadius={110}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth={2}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.6)",
                borderRadius: "12px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                fontWeight: 600,
              }}
            />
            <Legend
              wrapperStyle={{
                fontSize: "12px",
                fontWeight: 600,
                paddingTop: "20px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

