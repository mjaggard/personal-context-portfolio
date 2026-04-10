import { useState, useEffect } from "react";
import { listFiles, getFile, deleteFile, type PortfolioFile } from "../lib/api";

interface Props {
  token: string;
  refreshKey: number;
}

export function FileList({ token, refreshKey }: Props) {
  const [files, setFiles] = useState<PortfolioFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<{
    fileName: string;
    content: string;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    listFiles(token)
      .then(setFiles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, refreshKey]);

  async function handleView(fileName: string) {
    if (viewing?.fileName === fileName) {
      setViewing(null);
      return;
    }
    const data = await getFile(token, fileName);
    setViewing({ fileName, content: data.content });
  }

  async function handleDelete(fileName: string) {
    if (!confirm(`Delete ${fileName}?`)) return;
    await deleteFile(token, fileName);
    setViewing(null);
    const updated = await listFiles(token);
    setFiles(updated);
  }

  if (loading) return <p>Loading files...</p>;

  if (files.length === 0) {
    return (
      <div>
        <h2>Your Portfolio Files</h2>
        <p style={{ color: "#666" }}>
          No files uploaded yet. Use the form above to upload your first
          portfolio file.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Your Portfolio Files</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>File</th>
            <th style={{ padding: "0.5rem" }}>Last Updated</th>
            <th style={{ padding: "0.5rem" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.fileName} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "0.5rem", fontFamily: "monospace" }}>
                {f.fileName}.md
              </td>
              <td style={{ padding: "0.5rem", color: "#666" }}>
                {new Date(f.updatedAt).toLocaleString()}
              </td>
              <td style={{ padding: "0.5rem" }}>
                <button
                  onClick={() => handleView(f.fileName)}
                  style={{
                    marginRight: "0.5rem",
                    padding: "0.25rem 0.75rem",
                    cursor: "pointer",
                    background: "#f0f0f0",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                >
                  {viewing?.fileName === f.fileName ? "Hide" : "View"}
                </button>
                <button
                  onClick={() => handleDelete(f.fileName)}
                  style={{
                    padding: "0.25rem 0.75rem",
                    cursor: "pointer",
                    background: "#ffe6e6",
                    border: "1px solid #ffcccc",
                    borderRadius: "4px",
                    color: "#cc0000",
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {viewing && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "#f8f8f8",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        >
          <h3 style={{ marginTop: 0 }}>{viewing.fileName}.md</h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "monospace",
              fontSize: "0.9rem",
              lineHeight: 1.5,
            }}
          >
            {viewing.content}
          </pre>
        </div>
      )}
    </div>
  );
}
