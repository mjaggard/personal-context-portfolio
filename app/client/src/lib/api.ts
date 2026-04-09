const API_BASE = import.meta.env.VITE_API_URL || "/api";

export interface PortfolioFile {
  fileName: string;
  updatedAt: string;
}

export interface FileContent {
  content: string;
  updatedAt: string;
}

export async function listFiles(token: string): Promise<PortfolioFile[]> {
  const res = await fetch(`${API_BASE}/files`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to list files: ${res.statusText}`);
  const data = await res.json();
  return data.files;
}

export async function getFile(
  token: string,
  fileName: string,
): Promise<FileContent> {
  const res = await fetch(`${API_BASE}/files/${fileName}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to get file: ${res.statusText}`);
  return res.json();
}

export async function uploadFile(
  token: string,
  fileName: string,
  content: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/files/${fileName}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Failed to upload file: ${res.statusText}`);
}

export async function deleteFile(
  token: string,
  fileName: string,
): Promise<void> {
  const res = await fetch(`${API_BASE}/files/${fileName}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to delete file: ${res.statusText}`);
}
