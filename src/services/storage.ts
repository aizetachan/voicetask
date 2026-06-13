// Capa de almacenamiento. Aísla la persistencia para poder migrar a SQLite
// más adelante sin tocar el store ni la UI.

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export interface Storage {
  load<T>(key: string): Promise<T | null>;
  save<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

// Implementación nativa fiable vía @capacitor/preferences.
const preferencesStorage: Storage = {
  async load<T>(key: string): Promise<T | null> {
    const { value } = await Preferences.get({ key });
    return value ? (JSON.parse(value) as T) : null;
  },
  async save<T>(key: string, value: T): Promise<void> {
    await Preferences.set({ key, value: JSON.stringify(value) });
  },
  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  },
};

// Fallback a localStorage para desarrollo en web.
const localStorageStorage: Storage = {
  async load<T>(key: string): Promise<T | null> {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async save<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  },
  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  },
};

export const storage: Storage = Capacitor.isNativePlatform()
  ? preferencesStorage
  : localStorageStorage;

export const STORAGE_KEYS = {
  tasks: 'ahora.tasks',
} as const;
