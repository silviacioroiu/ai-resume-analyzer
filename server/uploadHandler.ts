import { randomBytes } from "crypto";
import { Router } from "express";
import multer from "multer";
import { authenticateJWT, type AuthRequest } from "./auth";
import { extractTextFromFile, SUPPORTED_MIME_TYPES } from "./fileParser";
import { minioStoragePut } from "./minioStorage";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (_req, file, cb) => {
    if ((SUPPORTED_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and DOCX files are allowed."));
    }
  },
});

export const uploadRouter = Router();

uploadRouter.post(
  "/upload-resume",
  authenticateJWT,
  (req: AuthRequest, res) => {
    upload.single("resume")(req, res, async err => {
      if (err) {
        const message =
          err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? "File is too large (max 10 MB)."
            : err.message;
        return res.status(400).json({ success: false, error: message });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, error: "No file uploaded" });
      }

      let resumeText: string;
      try {
        resumeText = await extractTextFromFile(
          req.file.buffer,
          req.file.mimetype
        );
      } catch (error) {
        // Parser errors are user-facing (e.g. scanned PDF with no text).
        const message =
          error instanceof Error ? error.message : "Could not read the file";
        return res.status(422).json({ success: false, error: message });
      }

      try {
        const extension =
          req.file.mimetype === "application/pdf" ? "pdf" : "docx";
        const fileKey = `resumes/${req.user!.userId}/${Date.now()}-${randomBytes(8).toString("hex")}.${extension}`;
        const { url } = await minioStoragePut(
          fileKey,
          req.file.buffer,
          req.file.mimetype
        );

        return res.json({
          success: true,
          data: {
            resumeText,
            resumeFileName: req.file.originalname,
            resumeFileKey: fileKey,
            resumeFileUrl: url,
          },
        });
      } catch (error) {
        console.error("[Upload] Failed to store file:", error);
        return res
          .status(500)
          .json({
            success: false,
            error: "Could not store the file. Please try again.",
          });
      }
    });
  }
);
