/**
 * Hook that manages water drinking reminder notifications.
 * 
 * Logic:
 * - Runs a check every 30 minutes while the app is open
 * - Only checks during the user's configured notification window (default 8am–9pm)
 * - Calculates expected proportional water intake based on time elapsed in the window
 * - Fires a browser Notification if the user is behind by more than the deviation threshold
 * - Enforces a 1-hour cooldown between notifications (tracked via localStorage)
 * - Skips if the daily goal is already reached
 *
 * Uses the Web Notification API (works when the browser tab is open, foreground or background).
 */

import { useEffect, useRef } from 'react';
import { UserProfile, WaterLog } from '../types';
import {
  WATER_NOTIFICATION_CHECK_INTERVAL_MS,
  WATER_NOTIFICATION_COOLDOWN_MS,
  formatWaterAmount,
} from '../constants';

/**
 * Request browser notification permission.
 * Returns true if permission is granted.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

/**
 * Check if notifications are supported and permitted.
 */
const canNotify = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Get the localStorage key for tracking last notification time per user.
 */
const getCooldownKey = (userId: string): string => {
  return `smartcalorie_water_notif_last_${userId}`;
};

/**
 * Check if we're still within the cooldown period since last notification.
 */
const isInCooldown = (userId: string): boolean => {
  const lastStr = localStorage.getItem(getCooldownKey(userId));
  if (!lastStr) return false;
  const lastTime = parseInt(lastStr, 10);
  return Date.now() - lastTime < WATER_NOTIFICATION_COOLDOWN_MS;
};

/**
 * Record that a notification was just sent.
 */
const recordNotification = (userId: string): void => {
  localStorage.setItem(getCooldownKey(userId), Date.now().toString());
};

/**
 * Core check: determine whether a water reminder notification should fire.
 * Returns a message string if a notification should be sent, or null otherwise.
 */
const checkWaterDeficit = (
  profile: UserProfile,
  todayWaterLogs: WaterLog[],
): string | null => {
  if (!profile.waterTrackingEnabled || !profile.waterNotificationEnabled) return null;

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const startHour = profile.waterNotificationStartHour;
  const endHour = profile.waterNotificationEndHour;

  // Only check during the notification window
  if (currentHour < startHour || currentHour >= endHour) return null;

  const dailyGoalMl = profile.dailyWaterGoalMl;
  const totalActiveHours = endHour - startHour;
  const hoursElapsed = currentHour - startHour;

  // How much water should have been consumed proportionally by now
  const expectedIntakeMl = (dailyGoalMl / totalActiveHours) * hoursElapsed;

  // The deviation threshold: how many hours' worth of water deficit to tolerate
  const deviationHours = profile.waterNotificationDeviationHours;
  const deviationMl = (dailyGoalMl / totalActiveHours) * deviationHours;

  // Actual intake today
  const actualIntakeMl = todayWaterLogs.reduce((sum, log) => sum + log.amountMl, 0);

  // Already reached the goal — no notification needed
  if (actualIntakeMl >= dailyGoalMl) return null;

  // Check if deficit exceeds the threshold
  const deficit = expectedIntakeMl - actualIntakeMl;
  if (deficit > deviationMl) {
    const remaining = dailyGoalMl - actualIntakeMl;
    const waterUnit = profile.waterUnit || 'ml';
    return `You're behind on water! Drink ${formatWaterAmount(Math.round(remaining), waterUnit)} more to reach your daily goal. 💧`;
  }

  return null;
};

/**
 * Get today's water logs from the full water logs array.
 */
const getTodayWaterLogs = (waterLogs: WaterLog[]): WaterLog[] => {
  const today = new Date();
  return waterLogs.filter(log => {
    const logDate = new Date(log.timestamp);
    return logDate.getDate() === today.getDate() &&
           logDate.getMonth() === today.getMonth() &&
           logDate.getFullYear() === today.getFullYear();
  });
};

/**
 * Send a browser notification for water reminder.
 */
const sendWaterNotification = (message: string, userId: string): void => {
  if (!canNotify()) return;
  if (isInCooldown(userId)) return;

  try {
    new Notification('💧 Water Reminder', {
      body: message,
      icon: '/icon.png',
      tag: 'water-reminder', // Replaces previous notification with same tag
    });
    recordNotification(userId);
  } catch (e) {
    console.warn('[WaterNotification] Failed to send notification:', e);
  }
};

/**
 * React hook that periodically checks water intake and sends reminder notifications.
 *
 * @param profile - The current user's profile (null if not loaded)
 * @param waterLogs - All water logs for the current user
 */
export function useWaterNotification(
  profile: UserProfile | null,
  waterLogs: WaterLog[],
): void {
  // Use refs to always have current values in the interval callback
  const profileRef = useRef(profile);
  const waterLogsRef = useRef(waterLogs);

  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { waterLogsRef.current = waterLogs; }, [waterLogs]);

  useEffect(() => {
    // Don't set up interval if feature is not enabled
    if (!profile?.waterTrackingEnabled || !profile?.waterNotificationEnabled) return;

    const runCheck = () => {
      const currentProfile = profileRef.current;
      const currentWaterLogs = waterLogsRef.current;
      if (!currentProfile) return;

      const todayLogs = getTodayWaterLogs(currentWaterLogs);
      const message = checkWaterDeficit(currentProfile, todayLogs);

      if (message) {
        sendWaterNotification(message, currentProfile.id);
      }
    };

    // Run an initial check shortly after mount (5 seconds delay to let the app settle)
    const initialTimeout = setTimeout(runCheck, 5000);

    // Then check every 30 minutes
    const interval = setInterval(runCheck, WATER_NOTIFICATION_CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [profile?.waterTrackingEnabled, profile?.waterNotificationEnabled, profile?.id]);
}
