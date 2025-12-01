"use client";

import { useNotifications } from "./use-notifications";

export function useNotificationBadge() {
  const { unreadCount } = useNotifications();
  return { unreadCount };
}

