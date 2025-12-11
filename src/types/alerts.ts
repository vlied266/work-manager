export interface AlertRule {
  id?: string;
  collectionName: string;
  condition: string; // JavaScript-like condition, e.g., "record.total_amount > 5000"
  message: string; // Template message, e.g., "High value invoice detected: {{invoice_number}}"
  action: 'email' | 'in_app' | 'both'; // 'email', 'in_app', or 'both'
  organizationId: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean; // Default to true
  recipientEmail?: string; // Optional: specific email for this alert (overrides ADMIN_EMAIL)
}

export interface Notification {
  id?: string;
  alertRuleId: string;
  collectionName: string;
  recordId: string;
  recordData: any;
  message: string; // Resolved message with variables replaced
  action: 'email' | 'in_app';
  organizationId: string;
  createdAt?: Date;
  read?: boolean;
}

