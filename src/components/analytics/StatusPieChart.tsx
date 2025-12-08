"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface StatusPieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export function StatusPieChart({ data }: StatusPieChartProps) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className="flex h-[300px] items-center justify-center text-center">
        <div>
          <p className="text-sm font-semibold text-slate-900">No data available</p>
          <p className="mt-1 text-xs text-slate-600">
            Start some processes to see status distribution
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              percent > 0.05 ? `${name}: ${((percent || 0) * 100).toFixed(0)}%` : ""
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
            formatter={(value: number) => [value, "Runs"]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-slate-600">
              {item.name}: {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

