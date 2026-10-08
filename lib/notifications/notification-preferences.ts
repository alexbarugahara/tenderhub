import type { NotificationType } from "@prisma/client";

import type {
  NotificationPreference,
  NotificationPreferenceMap,
} from "./notification-types";

/**
 * Default notification preferences.
 *
 * The Prisma schema does not define a separate NotificationPreference model,
 * so these defaults are kept as application-level configuration.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferenceMap = {};

/**
 * Returns whether a notification type is enabled.
 *
 * If no explicit preference exists, notifications are enabled by default.
 */
export function isNotificationTypeEnabled(
  type: NotificationType,
  preferences?: NotificationPreferenceMap | null,
): boolean {
  if (!preferences || preferences[type] === undefined) {
    return true;
  }

  return preferences[type] === true;
}

/**
 * Enable a notification type.
 */
export function enableNotificationType(
  preferences: NotificationPreferenceMap | null | undefined,
  type: NotificationType,
): NotificationPreferenceMap {
  return {
    ...(preferences ?? {}),
    [type]: true,
  };
}

/**
 * Disable a notification type.
 */
export function disableNotificationType(
  preferences: NotificationPreferenceMap | null | undefined,
  type: NotificationType,
): NotificationPreferenceMap {
  return {
    ...(preferences ?? {}),
    [type]: false,
  };
}

/**
 * Set the enabled state for a notification type.
 */
export function setNotificationTypeEnabled(
  preferences: NotificationPreferenceMap | null | undefined,
  type: NotificationType,
  enabled: boolean,
): NotificationPreferenceMap {
  return {
    ...(preferences ?? {}),
    [type]: enabled,
  };
}

/**
 * Convert a preference map into a list of preferences.
 *
 * Only explicitly configured notification types are returned.
 */
export function toNotificationPreferenceList(
  preferences?: NotificationPreferenceMap | null,
): NotificationPreference[] {
  if (!preferences) {
    return [];
  }

  return Object.entries(preferences).map(([type, enabled]) => ({
    type: type as NotificationType,
    enabled: enabled === true,
  }));
}

/**
 * Convert a preference list into a preference map.
 */
export function toNotificationPreferenceMap(
  preferences: NotificationPreference[],
): NotificationPreferenceMap {
  return preferences.reduce<NotificationPreferenceMap>(
    (result, preference) => {
      result[preference.type] = preference.enabled;
      return result;
    },
    {},
  );
}

/**
 * Merge existing preferences with new preferences.
 */
export function mergeNotificationPreferences(
  current: NotificationPreferenceMap | null | undefined,
  updates: NotificationPreferenceMap | null | undefined,
): NotificationPreferenceMap {
  return {
    ...(current ?? {}),
    ...(updates ?? {}),
  };
}

/**
 * Remove an explicit preference.
 *
 * Once removed, the notification type falls back to the default behaviour.
 */
export function removeNotificationPreference(
  preferences: NotificationPreferenceMap | null | undefined,
  type: NotificationType,
): NotificationPreferenceMap {
  const result = {
    ...(preferences ?? {}),
  };

  delete result[type];

  return result;
}

/**
 * Check whether a notification type has an explicitly configured preference.
 */
export function hasExplicitNotificationPreference(
  type: NotificationType,
  preferences?: NotificationPreferenceMap | null,
): boolean {
  return preferences?.[type] !== undefined;
}

/**
 * Return a copy of the default preferences.
 */
export function getDefaultNotificationPreferences(): NotificationPreferenceMap {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
  };
}