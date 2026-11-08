import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface ToolRunningContextType {
  isToolRunning: boolean;
  activeToolId: string | null;
  setIsToolRunning: (running: boolean, toolId?: string) => void;
  startTool: (toolId: string) => void;
  stopTool: () => void;
}

const ToolRunningContext = createContext<ToolRunningContextType>({
  isToolRunning: false,
  activeToolId: null,
  setIsToolRunning: () => {},
  startTool: () => {},
  stopTool: () => {}
});

export const ToolRunningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isToolRunning, setIsToolRunningState] = useState<boolean>(false);
  const [activeToolId, setActiveToolId] = useState<string | null>(null);

  const setIsToolRunning = useCallback((running: boolean, toolId?: string) => {
    setIsToolRunningState(running);
    setActiveToolId(running ? (toolId || 'active-tool') : null);
  }, []);

  const startTool = useCallback((toolId: string) => {
    setIsToolRunningState(true);
    setActiveToolId(toolId);
  }, []);

  const stopTool = useCallback(() => {
    setIsToolRunningState(false);
    setActiveToolId(null);
  }, []);

  const value = useMemo(
    () => ({
      isToolRunning,
      activeToolId,
      setIsToolRunning,
      startTool,
      stopTool
    }),
    [isToolRunning, activeToolId, setIsToolRunning, startTool, stopTool]
  );

  return (
    <ToolRunningContext.Provider value={value}>
      {children}
    </ToolRunningContext.Provider>
  );
};

export const useToolRunning = () => useContext(ToolRunningContext);
