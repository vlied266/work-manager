"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CompletionTrendProps {
  data: Array<{ date: string; count: number }>;
}

export function CompletionTrend({ data }: CompletionTrendProps) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center text-center">
        <div>
          <p className="text-sm font-semibold text-slate-900">No data available</p>
          <p className="mt-1 text-xs text-slate-600">
            Complete some tasks to see productivity trends
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
          labelStyle={{ color: "#1e293b", fontWeight: 600 }}
          formatter={(value: number) => [value, "Completed"]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorCompleted)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

