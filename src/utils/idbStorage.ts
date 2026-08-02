import { get, set } from 'idb-keyval';
import { ClassItem, Student, DailyLogRecord, SettingsPointsConfig } from '../types';

export const IDB_KEYS = {
  CLASSES: 'hosati_pe_classes_v1',
  STUDENTS: 'hosati_pe_students_v1',
  LOGS: 'hosati_pe_logs_v1',
  SETTINGS: 'hosati_pe_settings_v1',
};

// Save data asynchronously to IndexedDB + synchronous localStorage backup
export const saveIDBItem = async <T>(key: string, data: T): Promise<void> => {
  try {
    await set(key, data);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key} to IndexedDB:`, err);
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }
};

// Load data asynchronously from IndexedDB with fallback to localStorage
export const loadIDBItem = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const idbVal = await get<T>(key);
    if (idbVal !== undefined && idbVal !== null) {
      return idbVal;
    }
  } catch (err) {
    console.error(`Error loading ${key} from IndexedDB:`, err);
  }

  try {
    const localVal = localStorage.getItem(key);
    if (localVal) {
      return JSON.parse(localVal);
    }
  } catch {}

  return fallback;
};
