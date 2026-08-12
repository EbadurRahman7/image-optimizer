import express from "express";
import multer from "multer";
import cors from "cors";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 10, fileSize: 20 * 1024 * 1024 }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "image-optimizer" }));

app.post("/api/optimize", upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: "Please upload at least one image." });

    const quality = Math.min(100, Math.max(10, Number(req.body.quality) || 80));
    const format = ["jpeg", "png", "webp", "tiff"].includes(req.body.format) ? req.body.format : "webp";

    const results = await Promise.all(req.files.map(async (file) => {
      let pipeline = sharp(file.buffer, { failOn: "none" }).rotate();

      if (format === "jpeg") pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      if (format === "png") pipeline = pipeline.png({ quality, compressionLevel: 9, palette: quality < 80 });
      if (format === "webp") pipeline = pipeline.webp({ quality, effort: 6 });
      if (format === "tiff") pipeline = pipeline.tiff({ quality, compression: "jpeg" });

      const output = await pipeline.toBuffer();
      const ext = format === "jpeg" ? "jpg" : format;
      const base = path.parse(file.originalname).name.replace(/[^a-z0-9_-]/gi, "-");
      const filename = `${base}-optimized.${ext}`;
      const savedPercent = Math.max(0, Math.round((1 - output.length / file.size) * 100));

      return {
        filename,
        originalSize: file.size,
        optimizedSize: output.length,
        savedPercent,
        dataUrl: `data:image/${format};base64,${output.toString("base64")}`
      };
    }));

    res.json({ results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to optimize the uploaded image(s)." });
  }
});

const publicDir = path.join(__dirname, "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));
}

app.listen(PORT, () => console.log(`Image Optimizer running on port ${PORT}`));