import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to periodically persist state to localStorage.
 * Automatically loads state on mount from localStorage (if exists).
 * Periodically of saving state every `interval` ms when changes are detected.
 * 
 * @param key LocalStorage string key
 * @param initialValue Fallback initialization value if local storage is empty
 * @param options Custom options including interval delay and save/load callbacks
 */
interface PersistenceOptions<T> {
  interval?: number; // Autosave delay in ms (defaults to 5000ms)
  onSave?: (savedValue: T) => void;
  onLoad?: (loadedValue: T) => void;
}

export default function useLocalStoragePersistence<T>(
  key: string,
  initialValue: T,
  options: PersistenceOptions<T> = {}
) {
  const { interval = 5000, onSave, onLoad } = options;

  // Initialize state with localStorage value or fallback
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (onLoad) {
          onLoad(parsed);
        }
        return parsed;
      }
    } catch (error) {
      console.error(`LocalStorage read error for key "${key}":`, error);
    }
    return initialValue;
  });

  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const stateRef = useRef<T>(state);

  // Keep stateRef in sync so periodic interval always gets current state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Periodic autosave hook
  useEffect(() => {
    let lastSavedString = '';
    try {
      lastSavedString = localStorage.getItem(key) || '';
    } catch (e) {}

    const timer = setInterval(() => {
      try {
        const currentString = JSON.stringify(stateRef.current);
        if (currentString !== lastSavedString) {
          localStorage.setItem(key, currentString);
          lastSavedString = currentString;
          setLastSaved(new Date());
          if (onSave) {
            onSave(stateRef.current);
          }
        }
      } catch (error) {
        console.error(`LocalStorage periodic write error for key "${key}":`, error);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [key, interval, onSave]);

  // Manual save trigger helper
  const forceSave = (customValue?: T) => {
    try {
      const targetValue = customValue !== undefined ? customValue : stateRef.current;
      localStorage.setItem(key, JSON.stringify(targetValue));
      setLastSaved(new Date());
      if (onSave) {
        onSave(targetValue);
      }
    } catch (error) {
      console.error(`LocalStorage manual save error for key "${key}":`, error);
    }
  };

  // Clear helper
  const clearPersistence = () => {
    try {
      localStorage.removeItem(key);
      setState(initialValue);
      setLastSaved(null);
    } catch (error) {
      console.error(`LocalStorage clear error for key "${key}":`, error);
    }
  };

  return [state, setState, { lastSaved, forceSave, clearPersistence }] as const;
}
