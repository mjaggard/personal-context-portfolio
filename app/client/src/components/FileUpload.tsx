import { useState, useRef, type DragEvent } from "react";
import { uploadFile } from "../lib/api";

const VALID_FILES = [
  { name: "identity", label: "Identity" },
  { name: "role-and-responsibilities", label: "Role & Responsibilities" },
  { name: "current-projects", label: "Current Projects" },
  { name: "team-and-relationships", label: "Team & Relationships" },
  { name: "tools-and-systems", label: "Tools & Systems" },
  { name: "communication-style", label: "Communication Style" },
  { name: "goals-and-priorities", label: "Goals & Priorities" },
  { name: "preferences-and-constraints", label: "Preferences & Constraints" },
  { name: "domain-knowledge", label: "Domain Knowledge" },
  { name: "decision-log", label: "Decision Log" },
];

interface Props {
  token: string;
  onUploaded: () => void;
}

export function FileUpload({ token, onUploaded }: Props) {
  const [selectedFile, setSelectedFile] = useState(VALID_FILES[0].name);
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setUploading(true);
    setMessage(null);
    try {
      await uploadFile(token, selectedFile, content);
      setMessage({ text: `Uploaded ${selectedFile} successfully`, type: "success" });
      setContent("");
      onUploaded();
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Upload failed",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  }

  function detectFileName(filename: string): string | null {
    const base = filename.replace(/\.md$/i, "").toLowerCase();
    return VALID_FILES.find((f) => f.name === base)?.name || null;
  }

  async function handleFileRead(file: File) {
    const detected = detectFileName(file.name);
    if (detected) {
      setSelectedFile(detected);
    }
    const text = await file.text();
    setContent(text);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileRead(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  }

  return (
    <div style={{ marginBottom: "2rem" }}>
      <h2>Upload Portfolio File</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="file-select" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>
            File type:
          </label>
          <select
            id="file-select"
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", fontSize: "1rem" }}
          >
            {VALID_FILES.map((f) => (
              <option key={f.name} value={f.name}>
                {f.label} ({f.name}.md)
              </option>
            ))}
          </select>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            marginBottom: "1rem",
            border: `2px dashed ${dragOver ? "#4a9eff" : "#ccc"}`,
            borderRadius: "8px",
            padding: "1rem",
            background: dragOver ? "#f0f7ff" : "transparent",
            transition: "all 0.2s",
          }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your markdown content here, or drag and drop a .md file..."
            rows={12}
            style={{
              width: "100%",
              padding: "0.5rem",
              fontSize: "0.9rem",
              fontFamily: "monospace",
              border: "1px solid #ddd",
              borderRadius: "4px",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "none",
                border: "none",
                color: "#4a9eff",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Or click to browse for a file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt"
              onChange={handleFileInput}
              style={{ display: "none" }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading || !content.trim()}
          style={{
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            background: uploading || !content.trim() ? "#ccc" : "#4a9eff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: uploading || !content.trim() ? "not-allowed" : "pointer",
          }}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            borderRadius: "6px",
            background: message.type === "success" ? "#e6f9e6" : "#ffe6e6",
            color: message.type === "success" ? "#1a7a1a" : "#cc0000",
          }}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
