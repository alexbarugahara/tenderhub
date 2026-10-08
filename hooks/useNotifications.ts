"use client";

import { useCallback, useEffect, useState } from "react";

export type Notification = {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
};

type UseNotificationsOptions = {
  enabled?: boolean;
  unreadOnly?: boolean;
};

export function useNotifications({
  enabled = true,
  unreadOnly = false,
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const query = unreadOnly ? "?unread=true" : "";

      const response = await fetch(
        `/api/notifications${query}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load notifications.");
      }

      const data = await response.json();

      setNotifications(data.notifications ?? data ?? []);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load notifications.",
      );
    } finally {
      setLoading(false);
    }
  }, [enabled, unreadOnly]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch: fetchNotifications,
  };
}