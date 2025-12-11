"use client";

import { DashboardWidget } from "@/types/dashboard";
import { TrendingUp, DollarSign, Hash, BarChart3 } from "lucide-react";

interface StatCardProps {
  widget: DashboardWidget;
  data: any[];
}

export function StatCard({ widget, data }: StatCardProps) {
  // Calculate the metric based on operation
  const calculateValue = () => {
    if (!widget.operation || !widget.field) return 0;

    const field = widget.field;
    const values = data
      .map((record) => {
        const value = record.data?.[field] ?? record[field];
        return typeof value === "number" ? value : 0;
      })
      .filter((v) => !isNaN(v));

    switch (widget.operation) {
      case "sum":
        return values.reduce((acc, val) => acc + val, 0);
      case "avg":
        return values.length > 0 ? values.reduce((acc, val) => acc + val, 0) / values.length : 0;
      case "count":
        return data.length;
      default:
        return 0;
    }
  };

  const value = calculateValue();
  const formattedValue =
    widget.operation === "count"
      ? value.toLocaleString()
      : widget.operation === "avg"
      ? value.toFixed(2)
      : value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  // Choose icon based on operation
  const getIcon = () => {
    if (widget.operation === "sum") return <DollarSign className="h-5 w-5" />;
    if (widget.operation === "avg") return <BarChart3 className="h-5 w-5" />;
    return <Hash className="h-5 w-5" />;
  };

  return (
    <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          {widget.title}
        </h3>
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">{getIcon()}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-slate-900">{formattedValue}</p>
        {widget.operation === "sum" && (
          <span className="text-sm text-slate-500 font-medium">total</span>
        )}
        {widget.operation === "avg" && (
          <span className="text-sm text-slate-500 font-medium">avg</span>
        )}
      </div>
      {data.length === 0 && (
        <p className="text-xs text-slate-400 mt-2">No data available</p>
      )}
    </div>
  );
}

