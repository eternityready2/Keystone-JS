interface LogEntry {
  timestamp: Date;
  level: "ERROR" | "INFO" | "WARN";
  message: string;
  context?: any;
  stack?: string;
}

const MAX_LOG_ENTRIES = 100;
const logs: LogEntry[] = [];

export const addMemoryLog = (log: Omit<LogEntry, "timestamp">) => {
  if (logs.length >= MAX_LOG_ENTRIES) {
    logs.shift();
  }

  const newLogEntry: LogEntry = {
    timestamp: new Date(),
    ...log,
  };

  logs.push(newLogEntry);
  console.log(`[Memory Log] Log added. Total logs: ${logs.length}`);
};

export const getMemoryLogs = (): LogEntry[] => {
  return [...logs];
};
