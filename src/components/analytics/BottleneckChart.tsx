"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BottleneckChartProps {
  data: Array<{ name: string; avgTime: number; count: number }>;
}

export function BottleneckChart({ data }: BottleneckChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center text-center">
        <div>
          <p className="text-sm font-semibold text-slate-900">No data available</p>
          <p className="mt-1 text-xs text-slate-600">
            Complete some processes to see bottleneck analysis
          </p>
        </div>
      </div>
    );
  }

  // Format time for display
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  // Truncate long names
  const formatName = (name: string): string => {
    if (name.length > 20) {
      return name.substring(0, 20) + "...";
    }
    return name;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          type="number"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatTime(value)}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={120}
          tickFormatter={formatName}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
          labelStyle={{ color: "#1e293b", fontWeight: 600 }}
          formatter={(value: number, name: string, props: any) => [
            formatTime(value),
            `Avg Duration (${props.payload.count} runs)`,
          ]}
        />
        <Bar
          dataKey="avgTime"
          fill="#3b82f6"
          radius={[0, 8, 8, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

