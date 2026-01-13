import { useCallback, useRef, useState, useEffect } from "react";

export interface ApiLogEntry {
  id: string;
  timestamp: number;
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  status?: number;
  statusText?: string;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: string;
  duration?: number;
  completed: boolean;
}

// Global log store for sharing across components
let globalApiLogs: ApiLogEntry[] = [];
let logListeners: Set<(logs: ApiLogEntry[]) => void> = new Set();

export function useApiLog() {
  const [logs, setLogs] = useState<ApiLogEntry[]>(globalApiLogs);

  // Subscribe to log updates
  useEffect(() => {
    const listener = (updatedLogs: ApiLogEntry[]) => {
      setLogs([...updatedLogs]);
    };

    logListeners.add(listener);

    return () => {
      logListeners.delete(listener);
    };
  }, []);

  const logRequest = useCallback(
    (method: string, url: string, requestBody?: unknown) => {
      const id = `${Date.now()}-${Math.random()}`;
      const entry: ApiLogEntry = {
        id,
        timestamp: Date.now(),
        method: method.toUpperCase() as any,
        url,
        requestBody,
        completed: false,
      };

      globalApiLogs.push(entry);
      logListeners.forEach((listener) => listener(globalApiLogs));

      return id;
    },
    []
  );

  const logResponse = useCallback(
    (
      logId: string,
      status: number,
      statusText: string,
      responseBody?: unknown,
      duration?: number
    ) => {
      const entry = globalApiLogs.find((e) => e.id === logId);
      if (entry) {
        entry.status = status;
        entry.statusText = statusText;
        entry.responseBody = responseBody;
        entry.duration = duration;
        entry.completed = true;
      }
      logListeners.forEach((listener) => listener(globalApiLogs));
    },
    []
  );

  const logError = useCallback(
    (logId: string, error: string, duration?: number) => {
      const entry = globalApiLogs.find((e) => e.id === logId);
      if (entry) {
        entry.error = error;
        entry.duration = duration;
        entry.completed = true;
      }
      logListeners.forEach((listener) => listener(globalApiLogs));
    },
    []
  );

  const clearLogs = useCallback(() => {
    globalApiLogs = [];
    logListeners.forEach((listener) => listener(globalApiLogs));
  }, []);

  return {
    logs,
    logRequest,
    logResponse,
    logError,
    clearLogs,
  };
}
