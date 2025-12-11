/**
 * Dashboard Widget Types
 * Used for AI-generated dashboard layouts
 */

export type WidgetType = 'stat_card' | 'bar_chart' | 'line_chart' | 'pie_chart';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  field: string; // The database key to analyze (e.g., "total_amount")
  operation?: 'sum' | 'count' | 'avg'; // For stat cards
  xAxis?: string; // For charts (e.g., "invoice_date")
  yAxis?: string; // For charts (e.g., "total_amount")
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
}

/**
 * Extended Collection interface with dashboard layout
 */
export interface CollectionMetadata {
  id: string;
  orgId: string;
  name: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select';
    options?: string[];
  }>;
  dashboardLayout?: DashboardLayout;
  createdAt: Date;
  updatedAt: Date;
}

