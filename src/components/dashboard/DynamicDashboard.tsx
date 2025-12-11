"use client";

import { DashboardLayout, DashboardWidget } from "@/types/dashboard";
import { StatCard } from "./StatCard";
import { SimpleBarChart, SimpleLineChart, SimplePieChart } from "./ChartRenderers";

interface DynamicDashboardProps {
  layout: DashboardLayout | null | undefined;
  data: any[];
}

export function DynamicDashboard({ layout, data }: DynamicDashboardProps) {
  if (!layout || !layout.widgets || layout.widgets.length === 0) {
    return null;
  }

  const renderWidget = (widget: DashboardWidget) => {
    switch (widget.type) {
      case "stat_card":
        return <StatCard key={widget.id} widget={widget} data={data} />;
      case "bar_chart":
        return <SimpleBarChart key={widget.id} widget={widget} data={data} />;
      case "line_chart":
        return <SimpleLineChart key={widget.id} widget={widget} data={data} />;
      case "pie_chart":
        return <SimplePieChart key={widget.id} widget={widget} data={data} />;
      default:
        return null;
    }
  };

  // Separate widgets by type for better layout
  const statCards = layout.widgets.filter((w) => w.type === "stat_card");
  const charts = layout.widgets.filter((w) => w.type !== "stat_card");

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Dashboard</h2>
      
      {/* Stat Cards Row */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statCards.map((widget) => renderWidget(widget))}
        </div>
      )}

      {/* Charts Row */}
      {charts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts.map((widget) => renderWidget(widget))}
        </div>
      )}
    </div>
  );
}

