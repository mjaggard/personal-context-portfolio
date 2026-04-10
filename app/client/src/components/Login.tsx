export function Login({ loading }: { loading: boolean }) {
  return (
    <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
      <h1>Personal Context Portfolio</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        {loading
          ? "Connecting to authentication..."
          : "Authentication failed. Please reload to try again."}
      </p>
    </div>
  );
}
