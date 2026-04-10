import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { Login } from "./components/Login";
import { FileUpload } from "./components/FileUpload";
import { FileList } from "./components/FileList";
import { SetupGuide } from "./components/SetupGuide";

export function App() {
  const { authenticated, token, loading, logout } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<"files" | "setup">("files");

  if (loading || !authenticated || !token) {
    return <Login loading={loading} />;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          paddingBottom: "1rem",
          borderBottom: "1px solid #eee",
        }}
      >
        <h1 style={{ margin: 0 }}>Personal Context Portfolio</h1>
        <button
          onClick={logout}
          style={{
            padding: "0.5rem 1rem",
            background: "#f0f0f0",
            border: "1px solid #ccc",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </header>

      <nav style={{ marginBottom: "2rem" }}>
        <button
          onClick={() => setActiveTab("files")}
          style={{
            padding: "0.5rem 1.5rem",
            marginRight: "0.5rem",
            background: activeTab === "files" ? "#4a9eff" : "#f0f0f0",
            color: activeTab === "files" ? "white" : "#333",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Portfolio Files
        </button>
        <button
          onClick={() => setActiveTab("setup")}
          style={{
            padding: "0.5rem 1.5rem",
            background: activeTab === "setup" ? "#4a9eff" : "#f0f0f0",
            color: activeTab === "setup" ? "white" : "#333",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Setup Guide
        </button>
      </nav>

      {activeTab === "files" ? (
        <>
          <FileUpload
            token={token}
            onUploaded={() => setRefreshKey((k) => k + 1)}
          />
          <FileList token={token} refreshKey={refreshKey} />
        </>
      ) : (
        <SetupGuide token={token} />
      )}
    </div>
  );
}
