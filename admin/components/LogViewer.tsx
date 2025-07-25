// admin/components/LogViewer.tsx
import React, { useState, useEffect } from "react";

// (Você pode copiar a interface e os estilos do exemplo anterior)
interface LogEntry {
  timestamp: string;
  level: "ERROR" | "INFO" | "WARN";
  message: string;
  context?: any;
  stack?: string;
}

const styles = {
  container: {
    marginTop: "24px",
    borderTop: "2px solid #e1e1e1",
    paddingTop: "24px",
  },
  header: { marginBottom: "16px" },
  logEntry: {
    border: "1px solid #e1e1e1",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    backgroundColor: "#fff",
  },
  logHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logLevel: (level: string) => ({
    padding: "4px 8px",
    borderRadius: "4px",
    color: "#fff",
    backgroundColor: level === "ERROR" ? "#e53e3e" : "#f6ad55",
  }),
  pre: {
    backgroundColor: "#f7fafc",
    padding: "12px",
    borderRadius: "4px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: "200px",
    overflowY: "auto",
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "16px",
  },
};

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/memoryLogs");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Recent Error Logs</h2>
      <button onClick={fetchLogs} style={styles.button} disabled={loading}>
        {loading ? "Loading..." : "Update"}
      </button>

      {logs.length === 0 && !loading && <p>No recent error logs.</p>}

      {logs.map((log, index) => (
        <div key={index} style={styles.logEntry}>
          <div style={styles.logHeader}>
            <span style={styles.logLevel(log.level)}>{log.level}</span>
            <strong>{new Date(log.timestamp).toLocaleString("en")}</strong>
          </div>
          <h3 style={{ marginTop: "12px" }}>{log.message}</h3>
          {log.context && (
            <pre style={styles.pre}>
              <code>{JSON.stringify(log.context, null, 2)}</code>
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
