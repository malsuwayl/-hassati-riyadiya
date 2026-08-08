import { useEffect, useRef } from 'react';
import {
  TimetableEntry,
  ClassItem,
  TeacherSettings,
  PeriodTimeConfig,
  NotificationSettings,
} from '../types';
import {
  DEFAULT_PERIOD_TIMES,
  DEFAULT_NOTIFICATION_SETTINGS,
} from '../data/initialData';
import { triggerFullPeriodAlert } from '../utils/notificationSound';

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

export function usePeriodNotifier(
  timetable: TimetableEntry[],
  classes: ClassItem[],
  settings: TeacherSettings,
  showToast: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void
) {
  const triggeredKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const periodTimes: PeriodTimeConfig[] =
      settings.periodTimes && settings.periodTimes.length > 0
        ? settings.periodTimes
        : DEFAULT_PERIOD_TIMES;

    const notifSettings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(settings.notifications || {}),
    };

    if (!notifSettings.enableAlerts) return;

    const checkSchedule = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0: Sunday, 1: Monday, ...
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const dateStr = now.toISOString().slice(0, 10);

      // Today's entries
      const todayEntries = timetable.filter((t) => t.dayOfWeek === currentDay);

      todayEntries.forEach((entry) => {
        const pConfig = periodTimes.find((p) => p.periodNumber === entry.periodNumber);
        if (!pConfig) return;

        const classItem = classes.find((c) => c.id === entry.classId);
        const className = classItem ? classItem.name : 'فصل غير محدد';

        const startMin = timeToMinutes(pConfig.startTime);
        const endMin = timeToMinutes(pConfig.endTime);

        const preMinutes = notifSettings.preClassMinutes || 5;

        // 1. Pre-Class Alert
        if (
          notifSettings.enablePreClassAlert &&
          currentMin === startMin - preMinutes
        ) {
          const key = `${dateStr}-p${entry.periodNumber}-prestart`;
          if (!triggeredKeysRef.current.has(key)) {
            triggeredKeysRef.current.add(key);
            const title = `⏱️ تنبيه قرب بداية الحصة ${entry.periodNumber}`;
            const message = `متبقي ${preMinutes} دقائق على بداية حصة: ${className} (${pConfig.startTime})`;
            showToast(message, 'info');
            triggerFullPeriodAlert(title, message, 'pre', {
              enableSound: notifSettings.enableSound,
              enableTTS: notifSettings.enableTTS,
              enableBrowser: notifSettings.enableBrowserNotifications,
            });
          }
        }

        // 2. Class Start Bell
        if (
          notifSettings.enableClassStartBell &&
          currentMin === startMin
        ) {
          const key = `${dateStr}-p${entry.periodNumber}-start`;
          if (!triggeredKeysRef.current.has(key)) {
            triggeredKeysRef.current.add(key);
            const title = `🔔 جرس بداية الحصة ${entry.periodNumber}`;
            const message = `حان الآن موعد حصة: ${className}`;
            showToast(message, 'success');
            triggerFullPeriodAlert(title, message, 'start', {
              enableSound: notifSettings.enableSound,
              enableTTS: notifSettings.enableTTS,
              enableBrowser: notifSettings.enableBrowserNotifications,
            });
          }
        }

        // 3. Pre-End Alert (5 mins before end)
        if (
          notifSettings.enablePreEndAlert &&
          currentMin === endMin - 5
        ) {
          const key = `${dateStr}-p${entry.periodNumber}-preend`;
          if (!triggeredKeysRef.current.has(key)) {
            triggeredKeysRef.current.add(key);
            const title = `⏳ تنبيه قرب نهاية الحصة ${entry.periodNumber}`;
            const message = `متبقي 5 دقائق على نهاية حصة: ${className}`;
            showToast(message, 'warning');
            triggerFullPeriodAlert(title, message, 'pre', {
              enableSound: notifSettings.enableSound,
              enableTTS: notifSettings.enableTTS,
              enableBrowser: notifSettings.enableBrowserNotifications,
            });
          }
        }

        // 4. Class End Bell
        if (
          notifSettings.enableClassEndBell &&
          currentMin === endMin
        ) {
          const key = `${dateStr}-p${entry.periodNumber}-end`;
          if (!triggeredKeysRef.current.has(key)) {
            triggeredKeysRef.current.add(key);
            const title = `🏁 جرس نهاية الحصة ${entry.periodNumber}`;
            const message = `انتهت الآن الحصة ${entry.periodNumber} (${className})`;
            showToast(message, 'info');
            triggerFullPeriodAlert(title, message, 'end', {
              enableSound: notifSettings.enableSound,
              enableTTS: notifSettings.enableTTS,
              enableBrowser: notifSettings.enableBrowserNotifications,
            });
          }
        }
      });
    };

    // Run initial check and then every 10 seconds
    checkSchedule();
    const interval = setInterval(checkSchedule, 10000);

    return () => clearInterval(interval);
  }, [timetable, classes, settings, showToast]);
}
