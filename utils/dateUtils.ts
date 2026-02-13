/**
 * Shared date utility functions.
 * Used across App, Dashboard, and ImpactHistoryModal.
 */

/** Format a Date as YYYY-MM-DD using local time */
export const formatDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Get yesterday's date (local time, current time preserved) */
export const getYesterday = (): Date => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
};
