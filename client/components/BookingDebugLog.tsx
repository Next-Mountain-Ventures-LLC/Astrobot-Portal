import { useApiLog, type ApiLogEntry } from "@/hooks/use-api-log";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, Copy } from "lucide-react";
import { Card } from "@/components/ui/card";

export function BookingDebugLog() {
  const { logs, clearLogs } = useApiLog();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);

  const selectedLog = logs.find((log) => log.id === selectedLogId);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Card className="mt-12 p-4 bg-slate-950 border-slate-700">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span>🔍 API Debug Log ({logs.length})</span>
          </button>

          <Button
            onClick={clearLogs}
            variant="ghost"
            size="sm"
            className="text-xs text-slate-400 hover:text-red-400"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="space-y-3 mt-4">
            {logs.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-4">
                No API calls yet. Try selecting a date or time.
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() =>
                      setSelectedLogId(
                        selectedLogId === log.id ? null : log.id
                      )
                    }
                    className="w-full text-left p-2 rounded bg-slate-900 border border-slate-700 hover:border-cyan-600 transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className={`font-bold whitespace-nowrap ${
                            log.method === "GET"
                              ? "text-blue-400"
                              : "text-green-400"
                          }`}
                        >
                          {log.method}
                        </span>
                        <span className="text-slate-400 truncate">
                          {log.url.replace(/^.*\/api\//, "")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 whitespace-nowrap flex-shrink-0">
                        {log.completed ? (
                          <>
                            {log.error ? (
                              <span className="text-red-400 font-bold">
                                ERROR
                              </span>
                            ) : (
                              <span
                                className={`font-bold ${
                                  log.status && log.status < 300
                                    ? "text-green-400"
                                    : "text-yellow-400"
                                }`}
                              >
                                {log.status}
                              </span>
                            )}
                            {log.duration && (
                              <span className="text-slate-500">
                                {log.duration}ms
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-yellow-400 animate-pulse">
                            ...
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    {selectedLogId === log.id && (
                      <div className="mt-2 space-y-2 pt-2 border-t border-slate-700">
                        {log.requestBody && (
                          <div className="text-xs">
                            <div className="cursor-pointer text-cyan-400 hover:text-cyan-300 font-medium mb-1">
                              📨 Request Body
                            </div>
                            <pre className="p-2 bg-slate-800 rounded overflow-x-auto text-slate-300 text-xs max-h-40 overflow-y-auto">
                              {JSON.stringify(log.requestBody, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.responseBody && (
                          <div className="text-xs">
                            <div className="cursor-pointer text-cyan-400 hover:text-cyan-300 font-medium mb-1">
                              📥 Response Body
                            </div>
                            <pre className="p-2 bg-slate-800 rounded overflow-x-auto text-slate-300 text-xs max-h-40 overflow-y-auto">
                              {JSON.stringify(log.responseBody, null, 2)}
                            </pre>
                            <Button
                              onClick={() =>
                                copyToClipboard(
                                  JSON.stringify(log.responseBody, null, 2)
                                )
                              }
                              variant="ghost"
                              size="sm"
                              className="mt-2 text-xs text-slate-400 hover:text-cyan-400"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </div>
                        )}

                        {log.error && (
                          <div className="text-xs p-2 bg-red-950 border border-red-800 rounded text-red-300">
                            <span className="font-bold">❌ Error:</span> {log.error}
                          </div>
                        )}

                        <div className="text-xs text-slate-500">
                          🕐 {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
