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

// Color palette for charts
const COLORS = [
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
      <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200 p-6">
        <p className="text-sm text-slate-500">Bar chart requires xAxis and yAxis</p>
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
    <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
        {widget.title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleLineChart({ widget, data }: ChartRendererProps) {
  if (!widget.xAxis || !widget.yAxis) {
    return (
      <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200 p-6">
        <p className="text-sm text-slate-500">Line chart requires xAxis and yAxis</p>
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
      <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
          {widget.title}
        </h3>
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
        {widget.title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimplePieChart({ widget, data }: ChartRendererProps) {
  if (!widget.field) {
    return (
      <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200 p-6">
        <p className="text-sm text-slate-500">Pie chart requires a field</p>
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
      <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
          {widget.title}
        </h3>
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
        {widget.title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

