import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../auth/jwt.js";
import {
  upsertDocument,
  getDocument,
  listDocuments,
  deleteDocument,
  VALID_FILE_NAMES,
} from "../services/weaviate.js";

export const uploadRouter = Router();

uploadRouter.use(authMiddleware);

// List all uploaded files for the user
uploadRouter.get("/files", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const files = await listDocuments(req.userId!);
    res.json({ files });
  } catch (err) {
    console.error("Failed to list files:", err);
    res.status(500).json({ error: "Failed to list files" });
  }
});

// Get a specific file
uploadRouter.get(
  "/files/:fileName",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const fileName = req.params.fileName as string;
      if (!VALID_FILE_NAMES.includes(fileName as any)) {
        res.status(400).json({
          error: `Invalid file name. Valid names: ${VALID_FILE_NAMES.join(", ")}`,
        });
        return;
      }

      const doc = await getDocument(req.userId!, fileName);
      if (!doc) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      res.json(doc);
    } catch (err) {
      console.error("Failed to get file:", err);
      res.status(500).json({ error: "Failed to get file" });
    }
  },
);

// Upload/update a file
uploadRouter.put(
  "/files/:fileName",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const fileName = req.params.fileName as string;
      if (!VALID_FILE_NAMES.includes(fileName as any)) {
        res.status(400).json({
          error: `Invalid file name. Valid names: ${VALID_FILE_NAMES.join(", ")}`,
        });
        return;
      }

      const { content } = req.body;
      if (!content || typeof content !== "string") {
        res.status(400).json({ error: "Request body must include 'content' as a string" });
        return;
      }

      await upsertDocument(req.userId!, fileName, content);
      res.json({ success: true, fileName });
    } catch (err) {
      console.error("Failed to upload file:", err);
      res.status(500).json({ error: "Failed to upload file" });
    }
  },
);

// Delete a file
uploadRouter.delete(
  "/files/:fileName",
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const fileName = req.params.fileName as string;
      const deleted = await deleteDocument(req.userId!, fileName);
      if (!deleted) {
        res.status(404).json({ error: "File not found" });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      console.error("Failed to delete file:", err);
      res.status(500).json({ error: "Failed to delete file" });
    }
  },
);
