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
    <div className="relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all group overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/30 group-hover:to-purple-50/30 transition-all duration-300" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
            {widget.title}
          </h3>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
            <div className="relative p-2.5 rounded-xl bg-white/80 backdrop-blur-sm border border-white/60 text-blue-600 shadow-sm">
              {getIcon()}
            </div>
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-extrabold tracking-tight text-slate-900">{formattedValue}</p>
          {widget.operation === "sum" && (
            <span className="text-sm text-slate-500 font-semibold">total</span>
          )}
          {widget.operation === "avg" && (
            <span className="text-sm text-slate-500 font-semibold">avg</span>
          )}
        </div>
        {data.length === 0 && (
          <p className="text-xs text-slate-400 mt-3 font-medium">No data available</p>
        )}
      </div>
    </div>
  );
}

