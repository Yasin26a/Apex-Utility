import { useState, useCallback } from 'react';

/**
 * Custom hook that caches the user's last selected voice name in localStorage
 * so the preferred voice preference persists across different article reading sessions.
 */
export function useVoicePreference(key = 'apex_selected_voice_name') {
  const [selectedVoiceName, setSelectedVoiceNameState] = useState<string>(() => {
    try {
      const persisted = localStorage.getItem(key);
      return persisted || '';
    } catch {
      return '';
    }
  });

  const setSelectedVoiceName = useCallback((name: string) => {
    setSelectedVoiceNameState(name);
    try {
      localStorage.setItem(key, name);
    } catch (e) {
      console.error('Failed to save selected voice name to localStorage:', e);
    }
  }, [key]);

  return [selectedVoiceName, setSelectedVoiceName] as const;
}
