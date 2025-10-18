import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

/**
 * 🧩 تحميل كل ملفات الـ API (بما فيهم المجلدات الفرعية)
 */
const loadApiRoutes = async (folderPath, baseRoute = "") => {
  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      await loadApiRoutes(filePath, `${baseRoute}/${file}`);
    } else if (file.endsWith(".js")) {
      const routeName = `${baseRoute}/${file.replace(".js", "")}`;
      const module = await import(`file://${filePath}`);
      const handler = module.default;

      if (!handler) {
        console.warn(`⚠️ الملف ${file} لا يحتوي على export default`);
        continue;
      }

      // 🧠 اكتشاف إذا كان Router أو دالة عادية
      if (typeof handler === "function") {
        app.get(routeName, (req, res) => handler(req, res, "GET"));
        app.post(routeName, (req, res) => handler(req, res, "POST"));
        app.put(routeName, (req, res) => handler(req, res, "PUT"));
        app.delete(routeName, (req, res) => handler(req, res, "DELETE"));
        console.log(`✅ Function endpoint loaded: ${routeName}`);
      } else if (typeof handler === "object" && handler.stack) {
        app.use(routeName, handler);
        console.log(`🧭 Router endpoint loaded: ${routeName}`);
      } else {
        console.warn(`⚠️ ${file} ليس Router ولا Function صالحة`);
      }
    }
  }
};

// 🚀 تحميل جميع ملفات الـ API
const apiRoot = path.join(__dirname, "api");
if (fs.existsSync(apiRoot)) {
  loadApiRoutes(apiRoot);
} else {
  console.warn("⚠️ مجلد api غير موجود!");
}

// 🔹 صفحة رئيسية بسيطة
app.get("/", (req, res) => {
  res.send("🚀 Tyson API is running...");
});

// 🔥 تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`🟢 Server started on http://localhost:${PORT}`);
});